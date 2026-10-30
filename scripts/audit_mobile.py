"""Audit generated HTML, or set PLAISIR_AUDIT_URL for dynamic pages. Not a browser/layout test."""
from html.parser import HTMLParser
from pathlib import Path
import os
from urllib.request import urlopen
from urllib.parse import urlparse, parse_qs

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

for route, filename, photo_count in [('/', 'index.html', 9), ('/investors', 'investors.html', 3), ('/financials', 'financials.html', 0)]:
    page = Page()
    base = os.environ.get('PLAISIR_AUDIT_URL')
    html = urlopen(base.rstrip('/') + route).read().decode() if base else (Path('.next/server/app') / filename).read_text()
    page.feed(html)
    tags = page.tags
    assert sum(tag == 'h1' for tag, _ in tags) == 1, f'{route}: heading hierarchy'
    assert any(tag == 'main' and attrs.get('id') == 'main' for tag, attrs in tags), f'{route}: skip-link target'
    viewport = next(attrs['content'] for tag, attrs in tags if tag == 'meta' and attrs.get('name') == 'viewport')
    assert 'viewport-fit=cover' in viewport and 'maximum-scale' not in viewport and 'user-scalable=no' not in viewport, f'{route}: zoom/viewport'
    assert not any(tag == 'meta' and attrs.get('name') == 'theme-color' and attrs.get('content') in ['#000000', '#000'] for tag, attrs in tags), f'{route}: forced black chrome'
    images = [attrs for tag, attrs in tags if tag == 'img']
    photos = [attrs for attrs in images if '/_next/image?' in attrs.get('src', '')]
    assert len(photos) == photo_count, f'{route}: expected {photo_count} responsive photos, got {len(photos)}'
    for image in images:
        # Decorative splash artwork correctly uses an explicitly empty alt.
        assert 'alt' in image and image.get('width') and image.get('height'), f'{route}: image description/dimensions'
    for index, photo in enumerate(photos):
        assert photo.get('sizes') and len(photo.get('srcset', '').split(',')) >= 5, f'{route}: image candidates'
        original = parse_qs(urlparse(photo['src']).query)['url'][0]
        assert original.startswith('/media/') or (Path('public') / original.lstrip('/')).is_file(), f'{route}: missing original image'
        if index == 0:
            assert photo.get('loading') == 'eager' and photo.get('fetchpriority') == 'high', f'{route}: hero priority'
        else:
            assert photo.get('loading') == 'lazy', f'{route}: lower photo loading'
    print(f'{route}: PASS — heading, skip target, zoom, viewport, image dimensions and {len(photos)} responsive photos')
print('HTML audit complete. Physical Safari/Chrome layout and animation smoothness are not measured here.')
