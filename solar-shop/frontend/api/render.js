// api/render.js
//
// Plain CommonJS. No TypeScript compilation, so no ESM/CJS mismatch.
// DELETE api/render.ts before deploying, or you will have two functions
// competing for the same route.
//
// Add ?seodebug=1 to any product URL to see failures as an HTML comment.

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

function htmlEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toDescription(raw, limit) {
  const max = limit || 155;
  const text = String(raw == null ? '' : raw)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const clipped = text.slice(0, max);
  const lastSpace = clipped.lastIndexOf(' ');
  return clipped.slice(0, lastSpace > 80 ? lastSpace : max) + '…';
}

function absoluteImage(img) {
  const s = String(img == null ? '' : img);
  if (!s) return SITE + '/walkers_logo.png';
  if (/^https?:\/\//i.test(s)) return s;
  return SITE + (s.charAt(0) === '/' ? '' : '/') + s;
}

function unwrapProduct(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [
    payload,
    payload.data,
    payload.data && payload.data.data,
    payload.product,
    payload.data && payload.data.product,
  ];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (c && typeof c === 'object' && !Array.isArray(c) && (c.name || c.title)) {
      return c;
    }
  }
  return null;
}

// Replacer function, not a string: $ sequences ($&, $1) in a replacement
// string are interpreted, so a description containing "$&" would corrupt output.
function replaceOnce(haystack, pattern, replacement) {
  return haystack.replace(pattern, function () {
    return replacement;
  });
}

async function loadShell(origin) {
  const errors = [];
  const paths = ['/shell.html', '/index.html'];

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    try {
      const res = await fetchWithTimeout(origin + path, 8000);
      if (!res.ok) {
        errors.push(path + ' -> ' + res.status);
        continue;
      }
      const text = await res.text();
      if (text.indexOf('id="root"') !== -1) return text;
      errors.push(path + ' -> no #root in response');
    } catch (err) {
      errors.push(path + ' -> ' + err.message);
    }
  }

  throw new Error('could not load shell (' + errors.join('; ') + ')');
}

module.exports = async function handler(req, res) {
  const debug = req.query.seodebug === '1';
  const notes = [];
  let shell = '';

  try {
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const origin = proto + '://' + rawHost;

    shell = await loadShell(origin);

    const slugParam = req.query.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

    if (!slug) throw new Error('no slug in query — check the rewrite in vercel.json');
    if (!API) throw new Error('API_URL / REACT_APP_API_URL env var is not set');

    let product = null;
    const endpoint = API + '/products/slug/' + encodeURIComponent(slug);

    const apiRes = await fetchWithTimeout(endpoint, 8000, {
      headers: { Accept: 'application/json' },
    });

    if (!apiRes.ok) {
      notes.push('API ' + endpoint + ' -> ' + apiRes.status);
    } else {
      const json = await apiRes.json();
      product = unwrapProduct(json);
      if (!product) {
        notes.push(
          'API responded 200 but no product in payload. Top-level keys: ' +
            Object.keys(json || {}).join(', ')
        );
      }
    }

    // ---- Unknown slug: real 404 -------------------------------------------
    if (!product) {
      let notFound = replaceOnce(
        shell,
        /<title>[\s\S]*?<\/title>/,
        '<title>Product not found | WALKERS</title>'
      );
      notFound = notFound.replace(/<link rel="canonical"[^>]*>/g, '');
      notFound = notFound.replace(
        /<meta name="robots"[^>]*>/g,
        '<meta name="robots" content="noindex, follow" />'
      );
      // Without this the 404 body is whatever the shell carries, i.e. the
      // homepage copy served under a 404 status. Say what actually happened.
      const gone = /<div id="root"[^>]*>[\s\S]*?<\/div>(?=\s*<\/body>)/;
      if (gone.test(notFound)) {
        notFound = replaceOnce(
          notFound,
          gone,
          '<div id="root"><main><h1>Product not found</h1>' +
            '<p>This product is no longer listed. ' +
            '<a href="/products">Browse the full Walkers Solar catalogue</a> or call ' +
            '<a href="tel:+916238093603">+91 62380 93603</a>.</p></main></div>'
        );
      }
      if (debug) {
        notFound = replaceOnce(
          notFound,
          /<\/head>/,
          '<!-- SEO DEBUG: ' + htmlEscape(notes.join(' | ')) + ' --></head>'
        );
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(debug ? 200 : 404).send(notFound);
      return;
    }

    // ---- Build tags -------------------------------------------------------
    const name = product.name || product.title;
    const url = SITE + '/products/' + slug;
    const brand = product.brand || product.brandName || '';
    const price =
      product.salePrice != null
        ? product.salePrice
        : product.price != null
          ? product.price
          : product.mrp;
    const inStock =
      product.inStock != null
        ? product.inStock
        : typeof product.stock === 'number'
          ? product.stock > 0
          : true;

    const rawImages = Array.isArray(product.images)
      ? product.images
      : product.image
        ? [product.image]
        : [];
    const images = rawImages
      .map(function (i) {
        return absoluteImage(typeof i === 'string' ? i : i && (i.url || i.path));
      })
      .filter(Boolean);
    const primaryImage = images[0] || SITE + '/walkers_logo.png';

    const title =
      name +
      (brand && name.indexOf(brand) === -1 ? ' - ' + brand : '') +
      ' | WALKERS Pathanamthitta';

    const description =
      toDescription(product.shortDescription || product.description) ||
      'Buy ' +
        name +
        ' at WALKERS, Pathanamthitta. Genuine product with warranty, delivery and installation across Kerala.';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: name,
      description: description,
      url: url,
      image: images.length ? images : [primaryImage],
    };
    if (product.sku) schema.sku = product.sku;
    if (brand) schema.brand = { '@type': 'Brand', name: brand };
    if (price) {
      schema.offers = {
        '@type': 'Offer',
        url: url,
        priceCurrency: 'INR',
        price: String(price),
        itemCondition: 'https://schema.org/NewCondition',
        availability: inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: 'Walkers Solar' },
      };
    }

    const injected = [
      '<title>' + htmlEscape(title) + '</title>',
      '<meta name="description" content="' + htmlEscape(description) + '" />',
      '<link rel="canonical" href="' + htmlEscape(url) + '" />',
      '<meta name="robots" content="index, follow" />',
      '<meta property="og:type" content="product" />',
      '<meta property="og:url" content="' + htmlEscape(url) + '" />',
      '<meta property="og:title" content="' + htmlEscape(title) + '" />',
      '<meta property="og:description" content="' + htmlEscape(description) + '" />',
      '<meta property="og:image" content="' + htmlEscape(primaryImage) + '" />',
      '<meta property="og:site_name" content="WALKERS" />',
      '<meta property="og:locale" content="en_IN" />',
      '<meta name="twitter:card" content="summary_large_image" />',
      '<meta name="twitter:title" content="' + htmlEscape(title) + '" />',
      '<meta name="twitter:description" content="' + htmlEscape(description) + '" />',
      '<meta name="twitter:image" content="' + htmlEscape(primaryImage) + '" />',
      '<script type="application/ld+json">' + JSON.stringify(schema) + '</script>',
    ].join('\n    ');

    // Strip the shell's homepage tags BEFORE injecting, not after. Doing it
    // in the other order deletes the tags we have just written — the global
    // regexes cannot tell the injected canonical from the shell's own — and
    // the page ends up with a <title> and nothing else.
    //
    // The LocalBusiness/FAQ @graph in index.html is deliberately left alone:
    // it describes the business, not the page, and is valid on every URL.
    const cleaned = shell
      .replace(/<meta name="title"[^>]*>/g, '')
      .replace(/<meta name="description"[^>]*>/g, '')
      .replace(/<link rel="canonical"[^>]*>/g, '')
      .replace(/<meta name="robots"[^>]*>/g, '')
      .replace(/<meta property="og:(?:type|url|title|description|image)"[^>]*>/g, '')
      .replace(/<meta name="twitter:(?:url|title|description|image)"[^>]*>/g, '');

    let html = replaceOnce(cleaned, /<title>[\s\S]*?<\/title>/, injected);

    // ---- Crawlable body content -------------------------------------------
    // Written between the <!--PRERENDER--> markers that public/index.html
    // places inside #root. ReactDOM.createRoot().render() clears those
    // children, so a real visitor never sees this markup — but GPTBot,
    // OAI-SearchBot, PerplexityBot, ClaudeBot and Google-Extended do not run
    // JavaScript, and without it they receive a blank page.
    //
    // Deliberately NOT positioned off-screen. Hidden text that a user can
    // never reach is a cloaking signal; content React is about to replace
    // is just a server-rendered fallback.
    const specs = [];
    if (product.capacity) specs.push('Capacity: ' + htmlEscape(product.capacity));
    if (product.warranty) specs.push('Warranty: ' + htmlEscape(product.warranty));
    if (product.sku) specs.push('SKU: ' + htmlEscape(product.sku));

    const fallback = [
      '<main>',
      '<nav><a href="/">Home</a> &rsaquo; <a href="/products">Products</a> &rsaquo; ' +
        htmlEscape(name) +
        '</nav>',
      '<h1>' + htmlEscape(name) + '</h1>',
      brand ? '<p>Brand: ' + htmlEscape(brand) + '</p>' : '',
      price
        ? '<p>Price: Rs. ' +
          htmlEscape(price) +
          ' (INR). ' +
          (inStock ? 'In stock.' : 'Currently out of stock.') +
          '</p>'
        : '',
      '<p>' + htmlEscape(description) + '</p>',
      specs.length ? '<ul><li>' + specs.join('</li><li>') + '</li></ul>' : '',
      '<p>Sold and installed by Walkers Solar, Pathanamthitta. Every product carries the ' +
        "manufacturer's warranty. Delivery and installation across Kerala; shipping across India.</p>",
      '<p><a href="/products">See all solar panels, inverters, lithium batteries and solar ' +
        'fencing products</a></p>',
      '<h2>Contact Walkers Solar</h2>',
      '<address><strong>Walkers Solar</strong><br />' +
        "Walkers Building, St. Peter's Junction, Pathanamthitta Ring Road, Chittoor<br />" +
        'Pathanamthitta, Kerala 689645, India<br />' +
        'Phone: <a href="tel:+916238093603">+91 62380 93603</a><br />' +
        'Email: <a href="mailto:walkersgroup@gmail.com">walkersgroup@gmail.com</a>' +
        '</address>',
      '<p>Open Monday to Saturday, 9:00 am to 6:00 pm. Quotes are free.</p>',
      '</main>',
    ]
      .filter(Boolean)
      .join('\n');

    // Replace everything inside #root. Anchored on the element, not an HTML
    // comment: CRA minifies the build with removeComments:true, so any
    // <!--MARKER--> in public/index.html never reaches build/index.html. The
    // lookahead pins the closing tag to the one just before </body>, which is
    // #root's, so nested elements in the fallback are handled correctly.
    const ROOT = /<div id="root"[^>]*>[\s\S]*?<\/div>(?=\s*<\/body>)/;
    if (ROOT.test(html)) {
      html = replaceOnce(html, ROOT, '<div id="root">' + fallback + '</div>');
    } else {
      notes.push('#root container not found in shell — no crawlable body rendered');
    }

    if (debug && notes.length) {
      html = replaceOnce(
        html,
        /<\/head>/,
        '<!-- SEO DEBUG: ' + htmlEscape(notes.join(' | ')) + ' --></head>'
      );
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch (err) {
    // An SEO bug must never break the page. Serve the plain shell so React
    // still boots and the customer sees a working product page.
    const message = err && err.message ? err.message : String(err);
    console.error('api/render failed:', message, err);

    if (!shell) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res
        .status(200)
        .send(
          '<!doctype html><html><head><meta http-equiv="refresh" content="0;url=/">' +
            (debug ? '<!-- SEO ERROR: ' + htmlEscape(message) + ' -->' : '') +
            '</head><body>Loading…</body></html>'
        );
      return;
    }

    const out = debug
      ? replaceOnce(
          shell,
          /<\/head>/,
          '<!-- SEO ERROR: ' + htmlEscape(message) + ' --></head>'
        )
      : shell;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(out);
  }
};