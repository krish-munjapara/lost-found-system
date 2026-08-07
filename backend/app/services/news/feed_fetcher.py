"""
Guardian-Link Feed Fetcher
─────────────────────────────────────────────────
RSS feed fetching and parsing service with error handling and retry logic.
"""

import logging
import os
import feedparser
import httpx
from typing import List, Dict, Optional
from datetime import datetime
import re
from dateutil import parser

from .config import NEWS_SOURCES, RELEVANT_KEYWORDS, REJECT_KEYWORDS, NewsCategory

logger = logging.getLogger(__name__)


class FeedFetcher:
    """Fetches and parses RSS feeds from configured news sources."""
    
    def __init__(self):
        self.sources = [s for s in NEWS_SOURCES if s.enabled]

    def _should_log_warning(self) -> bool:
        environment = os.getenv("ENVIRONMENT", "development").lower()
        return environment in {"development", "dev", "test"}

    def _log_source_warning(self, source_name: str, reason: str) -> None:
        if self._should_log_warning():
            logger.warning("Skipping news source %s: %s", source_name, reason)

    async def fetch_all_feeds(self) -> List[Dict]:
        """Fetch articles from all enabled news sources."""
        all_articles = []
        
        for source in self.sources:
            try:
                articles = await self.fetch_feed(source)
                all_articles.extend(articles)
            except Exception as exc:
                self._log_source_warning(source.name, str(exc) or "unavailable")
                continue
        
        return all_articles
    
    async def fetch_feed(self, source) -> List[Dict]:
        """Fetch and parse a single RSS feed."""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            
            async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
                response = await client.get(source.rss_url, headers=headers)
                response.raise_for_status()
                
                feed = feedparser.parse(response.content)
                
                articles = []
                for entry in feed.entries[:20]:  # Limit to 20 articles per feed
                    article = self._parse_entry(entry, source)
                    if article and self._is_relevant(article):
                        articles.append(article)
                
                return articles
                
        except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError, ValueError, feedparser.ParseError) as exc:
            self._log_source_warning(source.name, "feed unavailable")
            return []
        except Exception as exc:
            self._log_source_warning(source.name, str(exc) or "unavailable")
            return []
    
    def _parse_entry(self, entry, source) -> Optional[Dict]:
        """Parse a single RSS feed entry into a standardized article format."""
        try:
            title = entry.get('title', '')
            description = entry.get('description', entry.get('summary', ''))
            link = entry.get('link', '')
            
            if not title or not link:
                return None
            
            # Clean HTML from title and description
            clean_title = self._clean_html(title)
            clean_description = self._clean_html(description)
            
            # Truncate description to first 60 words
            clean_description = ' '.join(clean_description.split()[:60])
            
            return {
                'id': entry.get('id', link),
                'headline': clean_title,
                'summary': clean_description,
                'source': source.name,
                'source_category': source.category.value,
                'credibility_score': source.credibility_score,
                'url': link,
                'published_at': self._parse_date(entry.get('published')),
                'fetched_at': datetime.now().isoformat(),
            }
            
        except Exception:
            return None
    
    def _clean_html(self, text: str) -> str:
        """Remove HTML tags and entities from text."""
        if not text:
            return ""
        
        # Remove HTML tags
        text = re.sub('<[^<]+?>', '', text)
        # Remove HTML entities
        text = re.sub(r'&[a-zA-Z0-9#]+;', ' ', text)
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text
    
    def _parse_date(self, date_str) -> Optional[str]:
        """Parse date string to ISO format."""
        if not date_str:
            return None
        
        try:
            # Try parsing with feedparser's parsed date
            if hasattr(date_str, 'isoformat'):
                return date_str.isoformat()
            
            # Try parsing as string
            parsed = parser.parse(date_str)
            return parsed.isoformat()
        except Exception:
            return None
    
    def _is_relevant(self, article: Dict) -> bool:
        """Check if article is relevant to child safety."""
        text = f"{article['headline']} {article['summary']}".lower()
        
        # Check for reject keywords
        if any(keyword in text for keyword in REJECT_KEYWORDS):
            return False
        
        # Check for relevant keywords based on category
        category = article.get('source_category', 'all')
        relevant_keywords = RELEVANT_KEYWORDS.get(
            NewsCategory(category),
            RELEVANT_KEYWORDS[NewsCategory.ALL]
        )
        
        return any(keyword in text for keyword in relevant_keywords)
