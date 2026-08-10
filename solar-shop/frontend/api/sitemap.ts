// api/sitemap.ts
//
// Generates sitemap.xml on demand from your live products API, so newly
// added products appear without a redeploy.
//
// SETUP
//   1. npm install --save-dev @vercel/node
//   2. Add an env var in Vercel -> Settings -> Environment Variables:
//        API_URL = https://your-backend-domain.com/api
//      (Your frontend already uses REACT_APP_API_URL; this function reads
//       either one. Use the same value.)
//   3. Add the rewrite in vercel.json so /sitemap.xml hits this function.
//   4. Deploy, then open https://www.walkers.org.in/sitemap.xml to verify.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SITE = 'https://www.walkers.org.in';
const API =  process.env.REACT_APP_API_URL || process.env.API_URL '';

// ---------------------------------------------------------------------------
// Your API's response shape is wrapped (api.get returns axios-style
// { data: { data: [...] } } style payloads from your controllers). This
// digs out the first array it finds so you don't have to tell me the
// exact shape. If the sitemap comes back with only static pages, log
// the raw payload and adjust unwrap().
// ---------------------------------------------------------------------------
function unwrap(payload: unknown, depth = 0): Record<string, any>[] {
  if (depth > 4) return [];
  if (Array.isArray(payload)) return payload as Record<string, any>[];
  if (!payload || typeof payload !== 'object') return [];

  const obj = payload as Record<string, unknown>;
  const candidateKeys = ['data', 'products', 'items', 'results', 'categories', 'docs'];

  for (const key of candidateKeys) {
    if (!(key in obj)) continue;
    const found = unwrap(obj[key], depth + 1);
    if (found.length) return found;
  }
  return [];
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    // Don't let a slow backend hang the whole sitemap request
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res.json();
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface Entry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

function toXml(entries: Entry[]): string {
  const urls = entries.map((e) => {
    const parts = [`    <loc>${xmlEscape(SITE + e.loc)}</loc>`];
    if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
    if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
    if (e.priority) parts.push(`    <priority>${e.priority}</priority>`);
    return `  <url>\n${parts.join('\n')}\n  </url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

function isoDate(value?: unknown): string | undefined {
  if (!value) return undefined;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Static routes worth indexing.
//
// Deliberately EXCLUDED: /login, /register, /cart, /checkout, /orders,
// /profile, /wishlist, /admin/*. These have no search value and some
// leak into "crawled but not indexed" reports.
// ---------------------------------------------------------------------------
const STATIC_ENTRIES: Entry[] = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/products', changefreq: 'daily', priority: '0.9' },
  { loc: '/gallery', changefreq: 'monthly', priority: '0.5' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.6' },
  { loc: '/shipping', changefreq: 'yearly', priority: '0.3' },
  { loc: '/returns', changefreq: 'yearly', priority: '0.3' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.2' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.2' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!API) {
    res.status(500).send('API_URL environment variable is not set');
    return;
  }

  const entries: Entry[] = [...STATIC_ENTRIES];

  // -- Products -------------------------------------------------------------
  // Your controller paginates, so ask for a large page. If you have more
  // than 1000 products one day, loop over pages here.
  try {
    const payload = await getJson(`${API}/products?limit=1000&page=1`);
    const products = unwrap(payload);

    for (const p of products) {
      const slug = p.slug || p.handle;
      if (!slug) continue;

      // Skip products your admin has blocked / deactivated. Adjust these
      // field names to match your schema.
      if (p.isBlocked === true || p.isActive === false || p.status === 'blocked') {
        continue;
      }

      entries.push({
        loc: `/products/${slug}`,
        lastmod: isoDate(p.updatedAt || p.updated_at || p.createdAt),
        changefreq: 'weekly',
        priority: '0.8',
      });
    }
  } catch (err) {
    // Never fail the whole sitemap because of one endpoint. Google gets a
    // valid partial sitemap instead of a 500.
    console.error('sitemap: product fetch failed', err);
  }

  // -- Category listing pages ----------------------------------------------
  // Your Products page reads ?category=<slug>. Clean category URLs are
  // worth indexing; ?page=N variants are not (see vercel.json / robots).
  try {
    const payload = await getJson(`${API}/categories`);
    const categories = unwrap(payload);

    for (const c of categories) {
      const slug = c.slug;
      if (!slug) continue;
      if (c.isActive === false) continue;

      entries.push({
        loc: `/products?category=${encodeURIComponent(slug)}`,
        changefreq: 'weekly',
        priority: '0.7',
      });
    }
  } catch (err) {
    console.error('sitemap: category fetch failed', err);
  }

  // Cache at Vercel's edge for an hour, serve stale while refreshing.
  // Google does not need second-by-second freshness, and this keeps your
  // backend from being hammered by crawlers.
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400'
  );
  res.status(200).send(toXml(entries));
}