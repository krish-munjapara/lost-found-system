"""
Guardian-Link News Services
─────────────────────────────────────────────────
Modular news service architecture for fetching, processing, and serving news.
"""

from .news_service import news_service, NewsService
from .config import NEWS_SOURCES, NewsCategory, CACHE_CONFIG
from .image_extractor import ImageExtractor
from .feed_fetcher import FeedFetcher

__all__ = [
    'news_service',
    'NewsService',
    'NEWS_SOURCES',
    'NewsCategory',
    'CACHE_CONFIG',
    'ImageExtractor',
    'FeedFetcher',
]
