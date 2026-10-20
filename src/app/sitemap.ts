import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  // Individual listings are intentionally NOT listed: they expire quickly and this keeps stale URLs out of search indexes.
  return ['', '/rentals', '/share', '/roommates', '/looking', '/help', '/privacy', '/terms', '/contact'].map((p) => ({ url: `${base}${p}` }));
}
