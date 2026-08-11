// api/render.ts
//
// Serves /products/:slug with REAL meta tags baked into the HTML, so
// Google (and WhatsApp, and Facebook) see the product name, description,
// price and canonical URL without executing any JavaScript.
//
// Your React app still boots normally afterwards and takes over — users
// get the identical experience. Only the initial HTML differs, and it
// matches what the page actually shows, so this is not cloaking.
//
// SETUP
//   1. Add to package.json:
//        "scripts": {
//          "build": "react-scripts build",
//          "postbuild": "cp build/index.html build/shell.html"
//        }
//      (On Windows use: "postbuild": "node -e \"require('fs').copyFileSync('build/index.html','build/shell.html')\"")
//
//      Why: this function needs the built HTML shell, but /index.html is
//      what the catch-all rewrite points at. shell.html is an untouched
//      copy it can safely fetch.
//
//   2. Add the rewrite in vercel.json (included).
//   3. Set API_URL in Vercel env vars.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SITE = 'https://www.walkers.org.in';
const API = process.env.API_URL || process.env.REACT_APP_API_URL || '';

function htmlEscape(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Strip HTML and collapse whitespace, then clip to a meta-description length. */
function toDescription(raw: unknown, limit = 155): string {
  const text = String(raw ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : limit)}…`;
}

function absoluteImage(img: unknown): string {
  const s = String(img ?? '');
  if (!s) return `${SITE}/walkers_logo.png`;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `${SITE}${s.startsWith('/') ? '' : '/'}${s}`;
}

/** Pull the product object out of whatever wrapper your controller uses. */
function unwrapProduct(payload: any): Record<string, any> | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [
    payload,
    payload.data,
    payload.data?.data,
    payload.product,
    payload.data?.product,
  ];
  for (const c of candidates) {
    if (c && typeof c === 'object' && !Array.isArray(c) && (c.name || c.title)) {
      return c;
    }
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slugParam = req.query.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  // Fetch the untouched build shell (see postbuild step above).
  const host = (req.headers['x-forwarded-host'] || req.headers.host) as string;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';

  let shell: string;
  try {
    const shellRes = await fetch(`${proto}://${host}/shell.html`, {
      signal: AbortSignal.timeout(8_000),
    });
    shell = await shellRes.text();
  } catch (err) {
    console.error('render: could not load shell.html', err);
    res.status(500).send('Shell unavailable');
    return;
  }

  // ---- Fetch the product ---------------------------------------------------
  let product: Record<string, any> | null = null;
  if (slug && API) {
    try {
      const apiRes = await fetch(`${API}/products/slug/${encodeURIComponent(slug)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8_000),
      });
      if (apiRes.ok) {
        product = unwrapProduct(await apiRes.json());
      }
    } catch (err) {
      console.error('render: product fetch failed', slug, err);
    }
  }

  // ---- Unknown slug: return a real 404 ------------------------------------
  // Important: your current App.tsx redirects unknown routes to "/", which
  // makes every dead URL return HTTP 200 with homepage content. Google
  // calls these "soft 404s" and it damages crawl efficiency. Returning a
  // genuine 404 status here fixes it for product URLs.
  if (!product) {
    const notFound = shell
      .replace(
        /<title>[\s\S]*?<\/title>/,
        '<title>Product not found | WALKERS</title>'
      )
      .replace(
        /<link rel="canonical"[^>]*>/,
        '<meta name="robots" content="noindex, follow" />'
      );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(404).send(notFound);
    return;
  }

  // ---- Build the tags ----------------------------------------------------
  const name: string = product.name || product.title;
  const url = `${SITE}/products/${slug}`;

  const brand = product.brand || product.brandName || '';
  const price = product.salePrice ?? product.price ?? product.mrp;
  const inStock =
    product.inStock ?? (typeof product.stock === 'number' ? product.stock > 0 : true);

  const rawImages: unknown[] = Array.isArray(product.images)
    ? product.images
    : product.image
      ? [product.image]
      : [];
  const images = rawImages
    .map((i: any) => absoluteImage(typeof i === 'string' ? i : i?.url || i?.path))
    .filter(Boolean);

  const title = `${name}${brand && !name.includes(brand) ? ` - ${brand}` : ''} | Price in Pathanamthitta, Kerala | WALKERS`;

  const description =
    toDescription(product.shortDescription || product.description) ||
    `Buy ${name} at WALKERS, Pathanamthitta. Genuine product with warranty, delivery and installation across Kerala.`;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    image: images.length ? images : [`${SITE}/walkers_logo.png`],
  };
  if (product.sku) schema.sku = product.sku;
  if (brand) schema.brand = { '@type': 'Brand', name: brand };
  if (price) {
    schema.offers = {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: String(price),
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Walkers Solar' },
    };
  }

  const injected = `
    <title>${htmlEscape(title)}</title>
    <meta name="description" content="${htmlEscape(description)}" />
    <link rel="canonical" href="${htmlEscape(url)}" />
    <meta name="robots" content="index, follow" />
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${htmlEscape(url)}" />
    <meta property="og:title" content="${htmlEscape(title)}" />
    <meta property="og:description" content="${htmlEscape(description)}" />
    <meta property="og:image" content="${htmlEscape(images[0] || `${SITE}/walkers_logo.png`)}" />
    <meta property="og:site_name" content="WALKERS" />
    <meta property="og:locale" content="en_IN" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${htmlEscape(title)}" />
    <meta name="twitter:description" content="${htmlEscape(description)}" />
    <meta name="twitter:image" content="${htmlEscape(images[0] || `${SITE}/walkers_logo.png`)}" />
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
  `.trim();

  // Replace the shell's homepage defaults with the product-specific tags.
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/, injected)
    .replace(/<meta name="description"[^>]*>/g, '')
    .replace(/<link rel="canonical"[^>]*>/g, '')
    .replace(/<meta name="robots"[^>]*>/g, '')
    .replace(/<meta property="og:(?:type|url|title|description|image)"[^>]*>/g, '')
    .replace(/<meta name="twitter:(?:url|title|description|image)"[^>]*>/g, '');

  // Give crawlers real body text as a fallback, in case JS never runs.
  // Your React app replaces #root's contents on mount, so users never see this.
  const fallback = `
    <div id="seo-fallback" style="position:absolute;left:-9999px;top:-9999px;">
      <h1>${htmlEscape(name)}</h1>
      <p>${htmlEscape(description)}</p>
      ${price ? `<p>Price: Rs. ${htmlEscape(price)}</p>` : ''}
      <p>Walkers Solar, St. Peters Junction, Pathanamthitta, Kerala 689645. Phone +91 6238093603.</p>
    </div>`;
  html = html.replace('<div id="root"></div>', `${fallback}<div id="root"></div>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=600, stale-while-revalidate=86400'
  );
  res.status(200).send(html);
}