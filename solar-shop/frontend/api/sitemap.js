// api/sitemap.js
//
// Plain CommonJS. DELETE api/sitemap.ts before deploying.
//
// Generates sitemap.xml live from your products API, so new products appear
// without a redeploy.

const SITE = 'https://www.walkers.org.in';
const API = process.env.API_URL || process.env.REACT_APP_API_URL || '';

async function fetchWithTimeout(url, ms, init) {
  if (typeof fetch !== 'function') {
    throw new Error(
      'global fetch unavailable — set Node.js 20.x in Vercel project settings'
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, Object.assign({}, init, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Digs the first array out of whatever wrapper your controller returns, so
 * you don't have to tell me the exact response shape.
 */
function unwrap(payload, depth) {
  const d = depth || 0;
  if (d > 4) return [];
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const keys = ['data', 'products', 'items', 'results', 'categories', 'docs'];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!(key in payload)) continue;
    const found = unwrap(payload[key], d + 1);
    if (found.length) return found;
  }
  return [];
}

async function getJson(url) {
  const res = await fetchWithTimeout(url, 10000, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(url + ' responded ' + res.status);
  return res.json();
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

function toXml(entries) {
  const urls = entries.map(function (e) {
    const parts = ['    <loc>' + xmlEscape(SITE + e.loc) + '</loc>'];
    if (e.lastmod) parts.push('    <lastmod>' + e.lastmod + '</lastmod>');
    if (e.changefreq) parts.push('    <changefreq>' + e.changefreq + '</changefreq>');
    if (e.priority) parts.push('    <priority>' + e.priority + '</priority>');
    return '  <url>\n' + parts.join('\n') + '\n  </url>';
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ]
    .concat(urls)
    .concat(['</urlset>', ''])
    .join('\n');
}

// Deliberately excluded: /login, /register, /checkout, /orders, /profile,
// /wishlist, /admin/*. No search value.
const STATIC_ENTRIES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/products', changefreq: 'daily', priority: '0.9' },
  { loc: '/gallery', changefreq: 'monthly', priority: '0.5' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.6' },
  { loc: '/shipping', changefreq: 'yearly', priority: '0.3' },
  { loc: '/returns', changefreq: 'yearly', priority: '0.3' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.2' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.2' },
];

module.exports = async function handler(req, res) {
  const debug = req.query && req.query.seodebug === '1';
  const notes = [];

  if (!API) {
    res.status(500).send('API_URL environment variable is not set');
    return;
  }

  const entries = STATIC_ENTRIES.slice();

  // ---- Products -----------------------------------------------------------
  try {
    const payload = await getJson(API + '/products?limit=1000&page=1');
    const products = unwrap(payload);
    notes.push('products found: ' + products.length);

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const slug = p.slug || p.handle;
      if (!slug) continue;

      // Skip blocked / inactive products. Adjust to match your schema.
      if (p.isBlocked === true || p.isActive === false || p.status === 'blocked') {
        continue;
      }

      entries.push({
        loc: '/products/' + slug,
        lastmod: isoDate(p.updatedAt || p.updated_at || p.createdAt),
        changefreq: 'weekly',
        priority: '0.8',
      });
    }
  } catch (err) {
    // A partial sitemap beats a 500.
    console.error('sitemap: product fetch failed', err);
    notes.push('product fetch failed: ' + (err && err.message));
  }

  // ---- Category listings --------------------------------------------------
  try {
    const payload = await getJson(API + '/categories');
    const categories = unwrap(payload);
    notes.push('categories found: ' + categories.length);

    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      if (!c.slug || c.isActive === false) continue;
      entries.push({
        loc: '/products?category=' + encodeURIComponent(c.slug),
        changefreq: 'weekly',
        priority: '0.7',
      });
    }
  } catch (err) {
    console.error('sitemap: category fetch failed', err);
    notes.push('category fetch failed: ' + (err && err.message));
  }

  let xml = toXml(entries);
  if (debug) {
    xml = xml.replace(
      '<urlset',
      '<!-- ' + xmlEscape(notes.join(' | ')) + ' -->\n<urlset'
    );
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
};