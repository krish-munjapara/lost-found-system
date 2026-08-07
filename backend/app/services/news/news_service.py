"""
Guardian-Link News Service
─────────────────────────────────────────────────
Orchestrates news fetching, processing, and delivery with caching and deduplication.
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import asyncio
from dataclasses import dataclass
import re
from difflib import SequenceMatcher

from .config import (
    NEWS_SOURCES, CACHE_CONFIG, PAGINATION_CONFIG,
    NewsCategory, RELEVANT_KEYWORDS
)
from .feed_fetcher import FeedFetcher
from .image_extractor import ImageExtractor


@dataclass
class NewsArticle:
    """Standardized news article data structure."""
    id: str
    headline: str
    summary: str
    source: str
    source_category: str
    credibility_score: float
    url: str
    image: Optional[str]
    published_at: Optional[str]
    fetched_at: str
    reading_time: Optional[int] = None  # in minutes
    keywords: Optional[List[str]] = None
    priority_score: float = 0.0  # For ranking


class NewsService:
    """Main service for fetching, processing, and serving news articles."""
    
    def __init__(self):
        self.feed_fetcher = FeedFetcher()
        self.image_extractor = ImageExtractor()
        
        # Cache storage
        self._news_cache: Dict[str, tuple] = {}
        self._image_cache: Dict[str, tuple] = {}
        
        # Cache TTL
        self.news_cache_ttl = timedelta(minutes=CACHE_CONFIG['news_cache_ttl_minutes'])
        self.image_cache_ttl = timedelta(minutes=CACHE_CONFIG['metadata_cache_ttl_minutes'])
    
    async def get_news(
        self,
        page: int = 1,
        limit: int = 20,
        category: str = 'all',
        search_query: Optional[str] = None
    ) -> Dict:
        """
        Get news articles with pagination, filtering, and search.
        
        Args:
            page: Page number (1-indexed)
            limit: Number of articles per page
            category: Category filter
            search_query: Search query string
            
        Returns:
            Paginated news response with metadata
        """
        # Validate pagination parameters
        limit = max(PAGINATION_CONFIG['min_limit'], min(limit, PAGINATION_CONFIG['max_limit']))
        
        # Get all articles (from cache or fetch fresh)
        all_articles = await self._get_all_articles()
        
        # Apply filters
        filtered_articles = self._apply_filters(all_articles, category, search_query)
        
        # Calculate pagination
        total = len(filtered_articles)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_articles = filtered_articles[start_idx:end_idx]
        
        # Convert to dict format
        articles_data = [self._article_to_dict(article) for article in paginated_articles]
        
        return {
            "success": True,
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
            "news": articles_data
        }
    
    async def _get_all_articles(self) -> List[NewsArticle]:
        """Get all articles from cache or fetch fresh."""
        cache_key = "news_all"
        
        # Check cache
        cached = self._get_news_cache(cache_key)
        if cached:
            return cached
        
        # Fetch fresh articles
        raw_articles = await self.feed_fetcher.fetch_all_feeds()
        
        # Process articles (extract images, deduplicate, sort)
        processed_articles = await self._process_articles(raw_articles)
        
        # Cache results
        self._set_news_cache(cache_key, processed_articles)
        
        return processed_articles
    
    async def _process_articles(self, raw_articles: List[Dict]) -> List[NewsArticle]:
        """Process raw articles: extract images, deduplicate, sort."""
        articles = []
        
        # Extract images for articles
        tasks = []
        for raw_article in raw_articles:
            task = self._process_single_article(raw_article)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, NewsArticle):
                articles.append(result)
        
        # Deduplicate by URL
        articles = self._deduplicate_articles(articles)
        
        # Sort by priority score (higher first), then by published date (newest first)
        articles.sort(
            key=lambda x: (x.priority_score, x.published_at or '1970-01-01'),
            reverse=True
        )
        
        return articles
    
    async def _process_single_article(self, raw_article: Dict) -> Optional[NewsArticle]:
        """Process a single article: extract image, calculate metadata, create NewsArticle object."""
        try:
            # Extract image (with caching)
            image_url = await self._get_article_image(raw_article['url'])
            
            # Calculate reading time (average 200 words per minute)
            word_count = len(raw_article['summary'].split())
            reading_time = max(1, round(word_count / 200))
            
            # Extract keywords from headline and summary
            keywords = self._extract_keywords(raw_article['headline'], raw_article['summary'])
            
            # Calculate priority score for ranking
            priority_score = self._calculate_priority_score(
                raw_article['source'],
                raw_article['source_category'],
                raw_article['credibility_score']
            )
            
            return NewsArticle(
                id=raw_article['id'],
                headline=raw_article['headline'],
                summary=raw_article['summary'],
                source=raw_article['source'],
                source_category=raw_article['source_category'],
                credibility_score=raw_article['credibility_score'],
                url=raw_article['url'],
                image=image_url,
                published_at=raw_article['published_at'],
                fetched_at=raw_article['fetched_at'],
                reading_time=reading_time,
                keywords=keywords,
                priority_score=priority_score
            )
        except Exception as e:
            print(f"Error processing article: {e}")
            return None
    
    async def _get_article_image(self, article_url: str) -> Optional[str]:
        """Get article image with caching."""
        # Check cache
        cached = self._get_image_cache(article_url)
        if cached is not None:
            return cached if cached else None
        
        # Extract image
        image_url = await self.image_extractor.extract_image(article_url, article_url)
        
        # Cache result
        self._set_image_cache(article_url, image_url)
        
        return image_url
    
    def _deduplicate_articles(self, articles: List[NewsArticle]) -> List[NewsArticle]:
        """Remove duplicate articles based on URL and similar content."""
        # First, remove exact URL duplicates
        seen_urls = set()
        unique_articles = []
        for article in articles:
            if article.url not in seen_urls:
                seen_urls.add(article.url)
                unique_articles.append(article)
        
        # Second, remove similar content duplicates (same event covered by multiple sources)
        deduplicated = []
        seen_headlines = []
        
        for article in unique_articles:
            is_duplicate = False
            headline_lower = article.headline.lower()
            
            # Check for similar headlines (same event)
            for seen_headline in seen_headlines:
                similarity = SequenceMatcher(None, headline_lower, seen_headline).ratio()
                if similarity > 0.7:  # 70% similarity threshold
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                deduplicated.append(article)
                seen_headlines.append(headline_lower)
        
        return deduplicated
    
    def _apply_filters(
        self,
        articles: List[NewsArticle],
        category: str,
        search_query: Optional[str]
    ) -> List[NewsArticle]:
        """Apply category and search filters to articles."""
        filtered = articles
        
        # Category filter
        if category and category != 'all':
            filtered = [a for a in filtered if a.source_category == category]
        
        # Search filter
        if search_query:
            search_lower = search_query.lower()
            filtered = [
                a for a in filtered
                if search_lower in a.headline.lower() or search_lower in a.summary.lower()
            ]
        
        return filtered
    
    def _article_to_dict(self, article: NewsArticle) -> Dict:
        """Convert NewsArticle to dictionary format for API response."""
        return {
            'id': article.id,
            'headline': article.headline,
            'summary': article.summary,
            'source': article.source,
            'url': article.url,
            'image': article.image,
            'publishedAt': article.published_at,
            'category': article.source_category,
            'credibilityScore': article.credibility_score,
            'readingTime': article.reading_time,
            'keywords': article.keywords,
            'priorityScore': article.priority_score
        }
    
    def _extract_keywords(self, headline: str, summary: str) -> List[str]:
        """Extract relevant keywords from headline and summary."""
        text = f"{headline} {summary}".lower()
        
        # Common child safety keywords to look for
        child_safety_keywords = [
            "missing", "child", "children", "kid", "kids", "minor", "minors",
            "safety", "protection", "rescue", "trafficking", "abuse", "kidnapping",
            "police", "government", "unicef", "ncrb", "pib", "wcd",
            "court", "case", "arrest", "investigation", "fir", "pocket",
            "reunited", "found", "recovered", "restored", "family"
        ]
        
        found_keywords = []
        for keyword in child_safety_keywords:
            if keyword in text:
                found_keywords.append(keyword)
        
        return found_keywords[:10]  # Return top 10 keywords
    
    def _calculate_priority_score(self, source: str, category: str, credibility_score: float) -> float:
        """Calculate priority score for article ranking."""
        score = credibility_score
        
        # Boost for official government sources
        official_sources = [
            "Press Information Bureau", "Ministry", "NCPCR", "UNICEF",
            "National Commission", "Government", "Official"
        ]
        if any(official in source for official in official_sources):
            score += 0.3
        
        # Boost for high-priority categories
        high_priority_categories = [
            "missing_children", "rescue_operations", "government"
        ]
        if category in high_priority_categories:
            score += 0.2
        
        # Boost for breaking news keywords
        breaking_keywords = ["breaking", "urgent", "alert", "emergency"]
        source_lower = source.lower()
        if any(keyword in source_lower for keyword in breaking_keywords):
            score += 0.1
        
        return min(score, 1.0)  # Cap at 1.0
    
    # Cache methods
    def _is_news_cache_valid(self, cache_key: str) -> bool:
        """Check if news cache is still valid."""
        if cache_key not in self._news_cache:
            return False
        cached_time, _ = self._news_cache[cache_key]
        return datetime.now() - cached_time < self.news_cache_ttl
    
    def _set_news_cache(self, cache_key: str, data: List[NewsArticle]):
        """Set data in news cache."""
        self._news_cache[cache_key] = (datetime.now(), data)
    
    def _get_news_cache(self, cache_key: str) -> Optional[List[NewsArticle]]:
        """Get data from news cache if valid."""
        if self._is_news_cache_valid(cache_key):
            return self._news_cache[cache_key][1]
        return None
    
    def _is_image_cache_valid(self, cache_key: str) -> bool:
        """Check if image cache is still valid."""
        if cache_key not in self._image_cache:
            return False
        cached_time, _ = self._image_cache[cache_key]
        return datetime.now() - cached_time < self.image_cache_ttl
    
    def _set_image_cache(self, cache_key: str, image_url: Optional[str]):
        """Set data in image cache."""
        self._image_cache[cache_key] = (datetime.now(), image_url)
    
    def _get_image_cache(self, cache_key: str) -> Optional[str]:
        """Get data from image cache if valid."""
        if self._is_image_cache_valid(cache_key):
            return self._image_cache[cache_key][1]
        return None
    
    def clear_cache(self):
        """Clear all caches."""
        self._news_cache.clear()
        self._image_cache.clear()


# Global news service instance
news_service = NewsService()
