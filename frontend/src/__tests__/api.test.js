import { describe, it, expect } from 'vitest';

describe('shareUtils', () => {
  it('builds share URL with child id', async () => {
    const { shareUtils } = await import('../services/api.js');
    const url = shareUtils.getShareUrl('abc123');
    expect(url).toContain('highlight=abc123');
  });
});

describe('getImageUrl', () => {
  it('returns cloud URL when provided', async () => {
    const { getImageUrl } = await import('../services/api.js');
    expect(getImageUrl('a.jpg', 'lost', 'https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
  });

  it('returns local path for local storage', async () => {
    const { getImageUrl } = await import('../services/api.js');
    expect(getImageUrl('photo.jpg', 'lost')).toBe('/uploads/lost/photo.jpg');
  });
});
