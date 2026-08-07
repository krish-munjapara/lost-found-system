import asyncio

import httpx

from app.services.news.config import NewsCategory, NewsSource
from app.services.news.feed_fetcher import FeedFetcher


def test_fetch_all_feeds_skips_failed_source_without_console_noise(monkeypatch, capsys):
    fetcher = FeedFetcher()
    bad_source = NewsSource(
        name="Unavailable Source",
        rss_url="https://example.com/bad-feed.xml",
        category=NewsCategory.GOVERNMENT,
        credibility_score=0.9,
    )
    working_source = NewsSource(
        name="Working Source",
        rss_url="https://example.com/good-feed.xml",
        category=NewsCategory.CHILD_SAFETY,
        credibility_score=0.8,
    )
    fetcher.sources = [bad_source, working_source]

    async def fake_fetch_feed(self, source):
        if source.name == "Unavailable Source":
            raise httpx.HTTPStatusError(
                "403 Forbidden",
                request=httpx.Request("GET", source.rss_url),
                response=httpx.Response(403, request=httpx.Request("GET", source.rss_url)),
            )
        return [{"headline": "Working article"}]

    monkeypatch.setattr(FeedFetcher, "fetch_feed", fake_fetch_feed)

    articles = asyncio.run(fetcher.fetch_all_feeds())

    assert articles == [{"headline": "Working article"}]
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == ""
