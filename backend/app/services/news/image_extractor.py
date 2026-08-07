"""
Guardian-Link Image Extractor
─────────────────────────────────────────────────
Advanced image extraction service with multi-source validation and fallback strategies.
"""

import aiohttp
from bs4 import BeautifulSoup
from typing import Optional, List, Tuple
import json
from urllib.parse import urljoin, urlparse
import re

from .config import IMAGE_CONFIG


class ImageExtractor:
    """Extracts and validates article images from web pages."""
    
    def __init__(self):
        self.config = IMAGE_CONFIG
        self.invalid_patterns = self._load_invalid_patterns()
    
    def _load_invalid_patterns(self) -> List[str]:
        """Load patterns that indicate invalid images (logos, favicons, etc.)."""
        return [
            'logo', 'favicon', 'icon', 'branding',
            'header', 'footer', 'banner', 'avatar',
            'profile', 'userpic', 'gravatar', 'placeholder',
            'google.com/logos', 'google.com/images', 'news.google.com',
            'gstatic.com/images', 'static', 'sprite', 'background',
            'pattern', 'texture', 'watermark', 'overlay'
        ]
    
    async def extract_image(self, url: str, article_url: str) -> Optional[str]:
        """
        Extract the best available image from an article page.
        
        Args:
            url: The article URL to scrape
            article_url: The base article URL for resolving relative URLs
            
        Returns:
            The best valid image URL, or None if no valid image found
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=15)
            ) as session:
                async with session.get(url, headers=headers, allow_redirects=True) as response:
                    if response.status != 200:
                        return None
                    
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Collect all potential images with their sources
                    potential_images = self._collect_potential_images(soup, article_url)
                    
                    # Validate and return the first valid image
                    for source, image_url in potential_images:
                        if self._is_valid_image(image_url, article_url):
                            return image_url
                    
                    # If no valid image found, try to find any reasonable image as last resort
                    fallback_image = self._find_fallback_image(soup, article_url)
                    if fallback_image:
                        return fallback_image
                    
                    return None
                    
        except Exception as e:
            print(f"Error extracting image from {url}: {e}")
            return None
    
    def _collect_potential_images(self, soup: BeautifulSoup, base_url: str) -> List[Tuple[str, str]]:
        """Collect all potential images from the page in priority order."""
        potential_images = []
        
        # Priority 1: Open Graph image
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            potential_images.append(('og:image', self._resolve_url(og_image.get('content'), base_url)))
        
        # Priority 2: Twitter image
        twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
        if twitter_image and twitter_image.get('content'):
            potential_images.append(('twitter:image', self._resolve_url(twitter_image.get('content'), base_url)))
        
        # Priority 3: Schema.org structured data
        schema_images = self._extract_schema_images(soup)
        potential_images.extend(schema_images)
        
        # Priority 4: Article tag images
        article = soup.find('article')
        if article:
            article_images = self._extract_article_images(article, base_url)
            potential_images.extend(article_images)
        
        # Priority 5: Large images from the page
        large_images = self._extract_large_images(soup, base_url)
        potential_images.extend(large_images)
        
        # Priority 6: Fallback to first reasonable image
        fallback_images = self._extract_fallback_images(soup, base_url)
        potential_images.extend(fallback_images)
        
        return potential_images
    
    def _extract_schema_images(self, soup: BeautifulSoup) -> List[Tuple[str, str]]:
        """Extract images from Schema.org structured data."""
        images = []
        
        # Try JSON-LD
        schema_script = soup.find('script', type='application/ld+json')
        if schema_script:
            try:
                schema_data = json.loads(schema_script.string)
                extracted = self._parse_schema_for_images(schema_data)
                images.extend(extracted)
            except (json.JSONDecodeError, KeyError):
                pass
        
        # Try microdata
        for item in soup.find_all(itemscope=True):
            image_elem = item.find(itemprop='image')
            if image_elem:
                if image_elem.name == 'img' and image_elem.get('src'):
                    images.append(('microdata', image_elem.get('src')))
                elif image_elem.get('content'):
                    images.append(('microdata', image_elem.get('content')))
        
        return images
    
    def _parse_schema_for_images(self, schema_data) -> List[Tuple[str, str]]:
        """Parse schema data for image URLs."""
        images = []
        
        if isinstance(schema_data, dict):
            if 'image' in schema_data:
                image = schema_data['image']
                if isinstance(image, list):
                    images.extend([('schema', img) for img in image])
                else:
                    images.append(('schema', image))
            
            # Check for nested objects
            for key, value in schema_data.items():
                if isinstance(value, (dict, list)):
                    images.extend(self._parse_schema_for_images(value))
        
        elif isinstance(schema_data, list):
            for item in schema_data:
                images.extend(self._parse_schema_for_images(item))
        
        return images
    
    def _extract_article_images(self, article: BeautifulSoup, base_url: str) -> List[Tuple[str, str]]:
        """Extract images from article tag."""
        images = []
        
        # Find all images in article
        for img in article.find_all('img'):
            src = img.get('src')
            if src:
                images.append(('article', self._resolve_url(src, base_url)))
        
        return images
    
    def _extract_large_images(self, soup: BeautifulSoup, base_url: str) -> List[Tuple[str, str]]:
        """Extract large images from the page."""
        images = []
        
        for img in soup.find_all('img'):
            src = img.get('src')
            if not src or src.startswith('data:'):
                continue
            
            # Check dimensions
            width = img.get('width')
            height = img.get('height')
            
            if width and height:
                try:
                    w, h = int(width), int(height)
                    if w >= self.config['min_width'] and h >= self.config['min_height']:
                        images.append(('large', self._resolve_url(src, base_url)))
                except ValueError:
                    pass
        
        return images
    
    def _extract_fallback_images(self, soup: BeautifulSoup, base_url: str) -> List[Tuple[str, str]]:
        """Extract fallback images (first reasonable image)."""
        images = []
        
        for img in soup.find_all('img'):
            src = img.get('src')
            if src and not src.startswith('data:'):
                url = self._resolve_url(src, base_url)
                if self._is_reasonable_image(url):
                    images.append(('fallback', url))
                    break  # Only take the first one
        
        return images
    
    def _resolve_url(self, url: str, base_url: str) -> str:
        """Resolve relative URLs to absolute URLs."""
        if url.startswith(('http://', 'https://')):
            return url
        return urljoin(base_url, url)
    
    def _is_valid_image(self, image_url: str, article_url: str) -> bool:
        """Validate that the image URL is acceptable."""
        if not image_url:
            return False
        
        # Check URL length
        if len(image_url) < 10:
            return False
        
        # Check for invalid patterns
        image_url_lower = image_url.lower()
        for pattern in self.invalid_patterns:
            if pattern in image_url_lower:
                return False
        
        # Check for valid image extension
        valid_extensions = self.config['preferred_formats']
        has_valid_ext = any(f'.{ext}' in image_url_lower for ext in valid_extensions)
        
        # If URL has extension, it must be valid
        if '.' in image_url_lower and not has_valid_ext:
            return False
        
        # Check if URL is from same domain as article (good sign)
        article_domain = urlparse(article_url).netloc
        image_domain = urlparse(image_url).netloc
        
        # Allow same domain or common CDNs
        if image_domain == article_domain:
            return True
        
        # Common CDN domains
        cdn_domains = [
            'cloudinary.com', 'cloudfront.net', 'cdn.com',
            'akamaihd.net', 'fastly.net', 'imgix.net'
        ]
        
        if any(cdn in image_domain for cdn in cdn_domains):
            return True
        
        return True
    
    def _is_reasonable_image(self, image_url: str) -> bool:
        """Quick check if image might be reasonable."""
        if not image_url:
            return False
        
        # Quick pattern check
        image_url_lower = image_url.lower()
        
        # Skip obvious non-images
        skip_patterns = ['logo', 'icon', 'favicon', 'sprite', 'background']
        if any(pattern in image_url_lower for pattern in skip_patterns):
            return False
        
        return True
    
    def _find_fallback_image(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        """Find any reasonable image as last resort."""
        images = soup.find_all('img')
        for img in images:
            src = img.get('src')
            if src and not src.startswith('data:'):
                url = self._resolve_url(src, base_url)
                # Very basic check - just ensure it's not obviously a logo
                if 'logo' not in url.lower() and 'icon' not in url.lower():
                    return url
        return None
