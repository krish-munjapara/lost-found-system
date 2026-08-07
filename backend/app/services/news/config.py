"""
Guardian-Link News Configuration
─────────────────────────────────────────────────
Centralized configuration for news sources, categories, and filtering rules.
"""

from dataclasses import dataclass
from typing import List, Dict
from enum import Enum

class NewsCategory(Enum):
    """News categories for filtering and organization."""
    ALL = "all"
    MISSING_CHILDREN = "missing_children"
    CHILD_SAFETY = "child_safety"
    RESCUE_OPERATIONS = "rescue_operations"
    CHILD_PROTECTION = "child_protection"
    GOVERNMENT = "government"
    INTERNATIONAL = "international"
    TRAFFICKING = "trafficking"
    REUNIFICATION = "reunification"
    LEGAL = "legal"

@dataclass
class NewsSource:
    """Configuration for a single news source."""
    name: str
    rss_url: str
    category: NewsCategory
    credibility_score: float  # 0.0 to 1.0
    language: str = "en"
    region: str = "IN"
    enabled: bool = True

# News sources configuration - Focused on Child Safety only
NEWS_SOURCES: List[NewsSource] = [
    # Google News RSS Feeds - Child Safety specific
    NewsSource(
        name="Google News - Missing Children India",
        rss_url="https://news.google.com/rss/search?q=missing+children+india&hl=en-IN&gl=IN&ceid=IN:en",
        category=NewsCategory.MISSING_CHILDREN,
        credibility_score=0.8,
        language="en",
        region="IN"
    ),
    NewsSource(
        name="Google News - Child Safety India",
        rss_url="https://news.google.com/rss/search?q=child+safety+india&hl=en-IN&gl=IN&ceid=IN:en",
        category=NewsCategory.CHILD_SAFETY,
        credibility_score=0.8,
        language="en",
        region="IN"
    ),
    NewsSource(
        name="Google News - Child Protection India",
        rss_url="https://news.google.com/rss/search?q=child+protection+india&hl=en-IN&gl=IN&ceid=IN:en",
        category=NewsCategory.CHILD_PROTECTION,
        credibility_score=0.8,
        language="en",
        region="IN"
    ),
    NewsSource(
        name="Google News - Child Trafficking India",
        rss_url="https://news.google.com/rss/search?q=child+trafficking+india&hl=en-IN&gl=IN&ceid=IN:en",
        category=NewsCategory.TRAFFICKING,
        credibility_score=0.8,
        language="en",
        region="IN"
    ),
    NewsSource(
        name="Google News - POCSO India",
        rss_url="https://news.google.com/rss/search?q=POCSO+india&hl=en-IN&gl=IN&ceid=IN:en",
        category=NewsCategory.LEGAL,
        credibility_score=0.8,
        language="en",
        region="IN"
    ),
    NewsSource(
        name="Google News - Child Abuse India",
        rss_url="https://news.google.com/rss/search?q=child+abuse+india&hl=en-IN&gl=IN&ceid=IN:en",
        category=NewsCategory.CHILD_PROTECTION,
        credibility_score=0.8,
        language="en",
        region="IN"
    ),
    
    # Official Government Sources
    NewsSource(
        name="Press Information Bureau - Women and Child Development",
        rss_url="https://pib.gov.in/RssMain.aspx?Id=1732",
        category=NewsCategory.GOVERNMENT,
        credibility_score=1.0,
        language="en",
        region="IN"
    ),
    NewsSource(
        name="Ministry of Home Affairs",
        rss_url="https://mha.gov.in/en/rss-feed",
        category=NewsCategory.GOVERNMENT,
        credibility_score=1.0,
        language="en",
        region="IN"
    ),
    NewsSource(
        name="National Commission for Protection of Child Rights (NCPCR)",
        rss_url="https://ncpcr.gov.in/rss",
        category=NewsCategory.GOVERNMENT,
        credibility_score=1.0,
        language="en",
        region="IN"
    ),
    
    # Child Safety Organizations
    NewsSource(
        name="UNICEF India",
        rss_url="https://www.unicef.org/india/feed.xml",
        category=NewsCategory.CHILD_PROTECTION,
        credibility_score=0.95,
        language="en",
        region="IN"
    ),
    NewsSource(
        name="Save the Children India",
        rss_url="https://www.savethechildren.in/rss.xml",
        category=NewsCategory.CHILD_PROTECTION,
        credibility_score=0.9,
        language="en",
        region="IN"
    ),
    NewsSource(
        name="Child Rights and You (CRY)",
        rss_url="https://www.cry.org/feed/",
        category=NewsCategory.CHILD_PROTECTION,
        credibility_score=0.85,
        language="en",
        region="IN"
    ),
    
    # Indian News - Child Safety sections only
    NewsSource(
        name="The Hindu - Child Safety",
        rss_url="https://www.thehindu.com/news/cities/chennai/feeder/default.rss",
        category=NewsCategory.CHILD_SAFETY,
        credibility_score=0.9,
        language="en",
        region="IN"
    ),
    NewsSource(
        name="NDTV - Crime News",
        rss_url="https://feeds.feedburner.com/ndtv-crime",
        category=NewsCategory.RESCUE_OPERATIONS,
        credibility_score=0.85,
        language="en",
        region="IN"
    ),
]

# Keywords for relevance filtering
RELEVANT_KEYWORDS: Dict[NewsCategory, List[str]] = {
    NewsCategory.ALL: [
        "child", "children", "kid", "kids", "minor", "minors",
        "safety", "protection", "welfare", "rights", "development"
    ],
    NewsCategory.MISSING_CHILDREN: [
        "missing child", "missing children", "lost child", "lost children",
        "child missing", "children missing", "disappeared child", "disappeared children",
        "untraceable child", "untraceable children", "runaway child", "runaway children"
    ],
    NewsCategory.CHILD_SAFETY: [
        "child safety", "children safety", "kid safety", "kids safety",
        "safe child", "safe children", "child security", "children security",
        "child protection", "children protection", "protecting children", "protecting child"
    ],
    NewsCategory.RESCUE_OPERATIONS: [
        "child rescue", "children rescue", "rescue child", "rescue children",
        "police rescue", "police operation", "rescued child", "rescued children",
        "saved child", "saved children", "operation rescue", "rescue mission"
    ],
    NewsCategory.CHILD_PROTECTION: [
        "child protection", "children protection", "protect child", "protect children",
        "child welfare", "children welfare", "child rights", "children rights",
        "child care", "children care", "child services", "children services"
    ],
    NewsCategory.GOVERNMENT: [
        "government", "ministry", "department", "official", "policy",
        "law", "legislation", "scheme", "program", "initiative",
        "women and child development", "wcd", "ministry of home affairs"
    ],
    NewsCategory.INTERNATIONAL: [
        "international", "global", "world", "united nations", "unicef",
        "who", "world health organization", "interpol", "cross-border"
    ],
    NewsCategory.TRAFFICKING: [
        "child trafficking", "children trafficking", "human trafficking",
        "trafficking", "smuggling", "illegal trade", "child trade",
        "forced labor", "child labor", "exploitation"
    ],
    NewsCategory.REUNIFICATION: [
        "reunited", "reunion", "reunification", "found child", "found children",
        "recovered child", "recovered children", "restored child", "restored children",
        "family reunion", "child returned", "children returned"
    ],
    NewsCategory.LEGAL: [
        "court", "judgment", "verdict", "case", "trial", "legal",
        "lawyer", "advocate", "justice", "police case", "fir",
        "investigation", "evidence", "arrest", "charge"
    ],
}

# Keywords to reject (unwanted content)
REJECT_KEYWORDS: List[str] = [
    # Sports
    "football", "cricket", "tennis", "golf", "basketball", "hockey",
    "sports", "match", "tournament", "championship", "world cup",
    "player", "team", "score", "goal", "victory", "defeat",
    
    # Politics
    "election", "politics", "politician", "vote", "campaign",
    "parliament", "assembly", "minister", "government policy",
    "political party", "opposition", "rally", "protest",
    
    # Entertainment
    "movie", "film", "actor", "actress", "celebrity", "bollywood",
    "hollywood", "entertainment", "music", "concert", "show",
    "award", "oscar", "filmfare", "release", "trailer",
    
    # Business/Economy
    "stock market", "share", "investment", "trading", "crypto",
    "business", "economy", "gdp", "inflation", "market",
    "company", "corporate", "startup", "funding", "ipo",
    
    # Technology (unless child safety related)
    "smartphone", "iphone", "android", "tech", "gadget",
    "software", "app", "update", "launch", "review",
    
    # Lifestyle
    "recipe", "cooking", "food", "restaurant", "cafe",
    "fashion", "style", "trend", "lifestyle", "travel",
    "vacation", "holiday", "tourism",
    
    # General news
    "weather", "climate", "temperature", "rain", "flood",
    "general", "world news", "international news", "global news",
    
    # Unwanted content types
    "donation", "fund", "charity", "fundraising", "crowdfunding",
    "csr", "corporate social responsibility", "sponsorship",
    "opinion", "editorial", "op-ed", "column", "blog", "personal blog",
    "marketing", "advertisement", "ad", "promo", "promotional",
    "sale", "discount", "offer", "deal", "buy", "purchase",
    "review", "rating", "top 10", "best", "worst",
    
    # Specific non-child-safety topics
    "nri", "non-resident indian", "diaspora",
    "visa", "immigration", "passport",
    "real estate", "property", "housing", "apartment", "flat",
]

# Cache configuration
CACHE_CONFIG = {
    "news_cache_ttl_minutes": 30,  # Cache news articles for 30 minutes
    "metadata_cache_ttl_minutes": 60,  # Cache image metadata for 60 minutes
    "max_cache_size": 1000,  # Maximum number of cached items
}

# Rate limiting configuration
RATE_LIMIT_CONFIG = {
    "max_requests_per_minute": 60,  # Maximum requests per minute
    "max_concurrent_scrapes": 5,  # Maximum concurrent image scrapes
}

# Image extraction configuration
IMAGE_CONFIG = {
    "min_width": 300,  # Minimum image width in pixels
    "min_height": 200,  # Minimum image height in pixels
    "max_file_size_mb": 5,  # Maximum image file size in MB
    "preferred_formats": ["jpg", "jpeg", "png", "webp"],
    "timeout_seconds": 10,  # Image fetch timeout
}

# Pagination configuration
PAGINATION_CONFIG = {
    "default_limit": 20,
    "max_limit": 100,
    "min_limit": 1,
}
