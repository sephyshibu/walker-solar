// api/render-page.js
//
// Plain CommonJS, same conventions as api/render.js — no TypeScript, so no
// ESM/CJS mismatch. Do not add a .ts twin: two functions would compete for
// the same route.
//
// WHY THIS EXISTS
// ---------------
// The site is a client-rendered CRA bundle. The AI answer engines we want to
// be cited by — GPTBot / OAI-SearchBot (ChatGPT), PerplexityBot, ClaudeBot,
// Google-Extended (Gemini grounding), Applebot — do not execute JavaScript.
// api/render.js already fixes /products/:slug. This function does the same for
// the remaining indexable routes, which otherwise ship an empty #root plus a
// canonical pointing at the homepage.
//
// Add ?seodebug=1 to any handled URL to see failures as an HTML comment.

const SITE = 'https://www.walkers.org.in';
const API = process.env.API_URL || process.env.REACT_APP_API_URL || '';

const PHONE_DISPLAY = '+91 62380 93603';
const PHONE_TEL = '+916238093603';
const EMAIL = 'walkersgroup@gmail.com';

const NAP =
  '<address><strong>Walkers Solar</strong><br />' +
  "Walkers Building, St. Peter's Junction, Pathanamthitta Ring Road, Chittoor<br />" +
  'Pathanamthitta, Kerala 689645, India<br />' +
  'Phone: <a href="tel:' + PHONE_TEL + '">' + PHONE_DISPLAY + '</a><br />' +
  'Email: <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>' +
  '</address>' +
  '<p>Open Monday to Saturday, 9:00 am to 6:00 pm. Consultations and quotes are free.</p>';

// ---------------------------------------------------------------------------
// Helpers (intentionally self-contained — see api/render.js for the twins)
// ---------------------------------------------------------------------------

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

// Replacer function, not a string: $& and $1 inside a replacement string are
// interpreted, so a product name containing "$&" would corrupt the output.
function replaceOnce(haystack, pattern, replacement) {
  return haystack.replace(pattern, function () {
    return replacement;
  });
}

// Digs the first array out of whatever wrapper the controller returns.
function unwrapList(payload, depth) {
  const d = depth || 0;
  if (d > 4) return [];
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const keys = ['data', 'products', 'items', 'results', 'categories', 'docs'];
  for (let i = 0; i < keys.length; i++) {
    if (!(keys[i] in payload)) continue;
    const found = unwrapList(payload[keys[i]], d + 1);
    if (found.length) return found;
  }
  return [];
}

async function getJson(url) {
  const res = await fetchWithTimeout(url, 8000, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(url + ' responded ' + res.status);
  return res.json();
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

function priceOf(p) {
  if (p.salePrice != null) return p.salePrice;
  if (p.price != null) return p.price;
  return p.mrp;
}

function breadcrumb(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(function (item, i) {
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: SITE + item.path,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Page builders
//
// Each returns { title, description, canonical, noindex, body, schema[] }.
// `body` replaces everything between the <!--PRERENDER--> markers that
// public/index.html puts inside #root. React clears those children on mount,
// so a real visitor never sees this markup — keep the wording honest and
// aligned with what the corresponding React page actually renders.
// ---------------------------------------------------------------------------

const CATEGORY_BLURB =
  'Walkers Solar stocks high-efficiency monocrystalline solar panels, on-grid and ' +
  'off-grid solar systems, hybrid and smart inverters, LiFePO4 lithium batteries, ' +
  'inverter batteries, solar lights, solar water pumps, charge controllers, mounting ' +
  'structures and solar electric fencing. Prices are in Indian Rupees and every item ' +
  "carries the manufacturer's warranty.";

async function buildProducts(query, notes) {
  const categorySlug = typeof query.category === 'string' ? query.category : '';
  const search = typeof query.search === 'string' ? query.search : '';
  const page = parseInt(query.page || '1', 10) || 1;

  let categories = [];
  let products = [];

  if (API) {
    try {
      categories = unwrapList(await getJson(API + '/categories'));
      notes.push('categories: ' + categories.length);
    } catch (err) {
      notes.push('category fetch failed: ' + (err && err.message));
    }
    try {
      products = unwrapList(await getJson(API + '/products?limit=100&page=1'));
      notes.push('products: ' + products.length);
    } catch (err) {
      notes.push('product fetch failed: ' + (err && err.message));
    }
  } else {
    notes.push('API_URL not set — rendering catalogue copy without live products');
  }

  const matched = categories.filter(function (c) {
    return c.slug === categorySlug;
  })[0];
  const label = matched ? matched.name : categorySlug;

  // A filtered or paginated view must not compete with the clean listing.
  const canonical = matched ? SITE + '/products?category=' + encodeURIComponent(categorySlug) : SITE + '/products';
  const noindex = Boolean(search) || page > 1;

  const title = matched
    ? label + ' — Price in Pathanamthitta, Kerala | Walkers Solar'
    : 'Solar Panels, Inverters, Lithium Batteries & Solar Fencing — Prices in Kerala | Walkers Solar';

  const description = matched
    ? (matched.description ||
        'Buy ' + label + ' at Walkers Solar, Pathanamthitta. Genuine products with ' +
          "manufacturer's warranty, delivery and installation across Kerala.")
    : 'Full catalogue of solar panels, hybrid inverters, LiFePO4 lithium batteries, ' +
      'inverter batteries, solar lights, solar pumps and solar electric fencing from ' +
      'Walkers Solar, Pathanamthitta. Current prices in INR, delivery and installation ' +
      'across Kerala.';

  const listed = products
    .filter(function (p) {
      if (p.isBlocked === true || p.isActive === false || p.status === 'blocked') return false;
      return Boolean(p.slug || p.handle);
    })
    .slice(0, 100);

  const rows = listed.map(function (p) {
    const slug = p.slug || p.handle;
    const nm = p.name || p.title || slug;
    const price = priceOf(p);
    const brand = p.brand || p.brandName || '';
    return (
      '<li><a href="/products/' + htmlEscape(slug) + '">' + htmlEscape(nm) + '</a>' +
      (brand ? ' — ' + htmlEscape(brand) : '') +
      (price ? ' — Rs. ' + htmlEscape(price) : '') +
      '</li>'
    );
  });

  const catLinks = categories
    .filter(function (c) {
      return c.slug && c.isActive !== false;
    })
    .map(function (c) {
      return (
        '<li><a href="/products?category=' + htmlEscape(c.slug) + '">' +
        htmlEscape(c.name || c.slug) +
        '</a></li>'
      );
    });

  const body = [
    '<main>',
    '<nav><a href="/">Home</a> &rsaquo; <a href="/products">Products</a>' +
      (matched ? ' &rsaquo; ' + htmlEscape(label) : '') +
      '</nav>',
    '<h1>' + htmlEscape(matched ? label + ' in Pathanamthitta, Kerala' : 'Solar products, inverters and batteries') + '</h1>',
    '<p>' + htmlEscape(description) + '</p>',
    matched ? '' : '<p>' + htmlEscape(CATEGORY_BLURB) + '</p>',
    catLinks.length ? '<h2>Shop by category</h2><ul>' + catLinks.join('') + '</ul>' : '',
    rows.length
      ? '<h2>' + (matched ? htmlEscape(label) : 'Products') + '</h2><ul>' + rows.join('') + '</ul>'
      : '<p>Call ' + PHONE_DISPLAY + ' for current stock and prices.</p>',
    '<h2>Buying from Walkers Solar</h2>',
    NAP,
    '<p>Installation and service cover Pathanamthitta and the rest of Kerala, including ' +
      'the Alappuzha, Kottayam, Kollam and Idukki districts. Products ship across India.</p>',
    '</main>',
  ]
    .filter(Boolean)
    .join('\n');

  const schema = [
    breadcrumb(
      matched
        ? [
            { name: 'Home', path: '/' },
            { name: 'Products', path: '/products' },
            { name: label, path: '/products?category=' + encodeURIComponent(categorySlug) },
          ]
        : [
            { name: 'Home', path: '/' },
            { name: 'Products', path: '/products' },
          ]
    ),
  ];

  if (rows.length) {
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: matched ? label : 'Walkers Solar product catalogue',
      itemListOrder: 'https://schema.org/ItemListUnordered',
      numberOfItems: listed.length,
      itemListElement: listed.map(function (p, i) {
        const slug = p.slug || p.handle;
        const price = priceOf(p);
        const item = {
          '@type': 'Product',
          name: p.name || p.title || slug,
          url: SITE + '/products/' + slug,
        };
        if (price) {
          item.offers = {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: String(price),
            url: SITE + '/products/' + slug,
          };
        }
        return { '@type': 'ListItem', position: i + 1, item: item };
      }),
    });
  }

  return { title: title, description: description, canonical: canonical, noindex: noindex, body: body, schema: schema };
}

function buildContact() {
  const description =
    'Contact Walkers Solar in Pathanamthitta, Kerala. Call ' + PHONE_DISPLAY + ', email ' +
    EMAIL + ', or visit Walkers Building, St. Peter’s Junction, Pathanamthitta Ring ' +
    'Road. Open Monday to Saturday, 9 am to 6 pm. Free quotes for solar and solar fencing.';

  const body = [
    '<main>',
    '<nav><a href="/">Home</a> &rsaquo; <a href="/contact">Contact</a></nav>',
    '<h1>Contact Walkers Solar, Pathanamthitta</h1>',
    '<p>Have questions about solar panels, inverters, lithium batteries or solar electric ' +
      'fencing? Tell us your location and roughly what you want to power, and we will ' +
      'quote for it. Consultations and quotes are free.</p>',
    NAP,
    '<p>You can also message us on WhatsApp using the same number, or use the enquiry ' +
      'form on this page.</p>',
    '<h2>Where to find us</h2>',
    '<p>We are at St. Peter&#39;s Junction on the Pathanamthitta Ring Road, Chittoor, ' +
      'Pathanamthitta, Kerala 689645. ' +
      '<a href="https://maps.app.goo.gl/8yRZKp29cDhgW6RFA" rel="noopener">Open in Google Maps</a>.</p>',
    '<h2>Areas we serve</h2>',
    '<p>Installation and after-sales service cover Pathanamthitta and the rest of Kerala, ' +
      'including the Alappuzha, Kottayam, Kollam and Idukki districts. Products can be ' +
      'shipped anywhere in India.</p>',
    '<p><a href="/products">Browse the product catalogue</a></p>',
    '</main>',
  ].join('\n');

  return {
    title: 'Contact Walkers Solar — Pathanamthitta, Kerala | Phone, Address & Free Quote',
    description: description,
    canonical: SITE + '/contact',
    noindex: false,
    body: body,
    schema: [
      breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Contact', path: '/contact' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        url: SITE + '/contact',
        mainEntity: { '@id': SITE + '/#localbusiness' },
      },
    ],
  };
}

function buildGallery() {
  const description =
    'Photographs of solar panel, inverter, lithium battery and solar electric fencing ' +
    'installations completed by Walkers Solar for homes, farms and businesses across ' +
    'Pathanamthitta and Kerala.';

  const body = [
    '<main>',
    '<nav><a href="/">Home</a> &rsaquo; <a href="/gallery">Gallery</a></nav>',
    '<h1>Walkers Solar installation gallery</h1>',
    '<p>' + htmlEscape(description) + '</p>',
    '<p>Work shown includes rooftop solar for houses and commercial buildings, off-grid ' +
      'systems with lithium battery backup, and solar electric fencing around farms and ' +
      'plantations in Kerala.</p>',
    '<p><a href="/products">Browse products</a> or <a href="/contact">request a quote</a>.</p>',
    NAP,
    '</main>',
  ].join('\n');

  return {
    title: 'Installation Gallery — Solar & Solar Fencing Projects in Kerala | Walkers Solar',
    description: description,
    canonical: SITE + '/gallery',
    noindex: false,
    body: body,
    schema: [
      breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Gallery', path: '/gallery' },
      ]),
    ],
  };
}

// Policy pages: the authoritative text lives in src/data/policies.ts and is
// rendered by React. Duplicating it here would guarantee the two drift apart,
// so we only correct the head — a right title and a self-referencing canonical
// instead of one pointing at the homepage — and blank the prerender block so
// these URLs do not serve a copy of the homepage body.
const POLICIES = {
  '/shipping': ['Shipping & Delivery Policy', 'How Walkers Solar ships and delivers solar panels, inverters and batteries across Kerala and India, including timelines and charges.'],
  '/returns': ['Return & Refund Policy', 'Walkers Solar return, replacement and refund policy for solar panels, inverters, batteries and solar fencing equipment.'],
  '/terms': ['Terms & Conditions', 'The terms and conditions that apply when you buy solar products from Walkers Solar, Pathanamthitta.'],
  '/privacy': ['Privacy Policy', 'How Walkers Solar collects, uses and protects the personal information you share with us.'],
};

function buildPolicy(path) {
  const entry = POLICIES[path];
  return {
    title: entry[0] + ' | Walkers Solar',
    description: entry[1],
    canonical: SITE + path,
    noindex: false,
    body: '',
    schema: [
      breadcrumb([
        { name: 'Home', path: '/' },
        { name: entry[0], path: path },
      ]),
    ],
  };
}

// ---------------------------------------------------------------------------
// Head rewriting
// ---------------------------------------------------------------------------

function applyHead(shell, page) {
  const injected = [
    '<title>' + htmlEscape(page.title) + '</title>',
    '<meta name="description" content="' + htmlEscape(page.description) + '" />',
    '<link rel="canonical" href="' + htmlEscape(page.canonical) + '" />',
    '<meta name="robots" content="' +
      (page.noindex
        ? 'noindex, follow'
        : 'index, follow, max-snippet:-1, max-image-preview:large') +
      '" />',
    '<meta property="og:type" content="website" />',
    '<meta property="og:url" content="' + htmlEscape(page.canonical) + '" />',
    '<meta property="og:title" content="' + htmlEscape(page.title) + '" />',
    '<meta property="og:description" content="' + htmlEscape(page.description) + '" />',
    '<meta name="twitter:title" content="' + htmlEscape(page.title) + '" />',
    '<meta name="twitter:description" content="' + htmlEscape(page.description) + '" />',
  ]
    .concat(
      (page.schema || []).map(function (s) {
        return '<script type="application/ld+json">' + JSON.stringify(s) + '</script>';
      })
    )
    .join('\n    ');

  // Strip the shell's homepage tags BEFORE injecting, never after: the global
  // regexes cannot tell our freshly injected canonical from the shell's own,
  // so cleaning up afterwards deletes both and leaves a bare <title>.
  //
  // The LocalBusiness/FAQ @graph in index.html is deliberately left in place:
  // it describes the business, not the page, and is valid on every URL.
  const cleaned = shell
    .replace(/<meta name="title"[^>]*>/g, '')
    .replace(/<meta name="description"[^>]*>/g, '')
    .replace(/<link rel="canonical"[^>]*>/g, '')
    .replace(/<meta name="robots"[^>]*>/g, '')
    .replace(/<meta property="og:(?:type|url|title|description)"[^>]*>/g, '')
    .replace(/<meta name="twitter:(?:url|title|description)"[^>]*>/g, '');

  return replaceOnce(cleaned, /<title>[\s\S]*?<\/title>/, injected);
}

// Replaces everything inside <div id="root"> with server-rendered markup.
//
// Anchored on the #root element rather than an HTML comment: CRA runs the
// build through html-minifier with removeComments:true, so any <!--MARKER-->
// left in public/index.html is gone from build/index.html. The lookahead
// pins the closing tag to the one immediately before </body>, which is
// #root's, so nested elements in the fallback are handled correctly.
function applyBody(html, body, notes) {
  const ROOT = /<div id="root"[^>]*>[\s\S]*?<\/div>(?=\s*<\/body>)/;
  if (ROOT.test(html)) {
    return replaceOnce(html, ROOT, '<div id="root">' + body + '</div>');
  }
  notes.push('#root container not found in shell — no crawlable body rendered');
  return html;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = async function handler(req, res) {
  const debug = req.query && req.query.seodebug === '1';
  const notes = [];
  let shell = '';

  // The rewrite in vercel.json passes the original route through as ?path=.
  const rawPath = req.query && req.query.path;
  const path = (Array.isArray(rawPath) ? rawPath[0] : rawPath) || '/';

  try {
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    shell = await loadShell(proto + '://' + rawHost);

    let page;
    if (path === '/products') {
      page = await buildProducts(req.query || {}, notes);
    } else if (path === '/contact') {
      page = buildContact();
    } else if (path === '/gallery') {
      page = buildGallery();
    } else if (POLICIES[path]) {
      page = buildPolicy(path);
    } else {
      throw new Error('unhandled path "' + path + '" — check the rewrites in vercel.json');
    }

    let html = applyHead(shell, page);
    html = applyBody(html, page.body, notes);

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
    // An SEO bug must never take a page down. Serve the plain shell so React
    // still boots and the customer sees a working site.
    const message = err && err.message ? err.message : String(err);
    console.error('api/render-page failed for ' + path + ':', message, err);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    if (!shell) {
      res
        .status(200)
        .send(
          '<!doctype html><html><head><meta http-equiv="refresh" content="0;url=/">' +
            (debug ? '<!-- SEO ERROR: ' + htmlEscape(message) + ' -->' : '') +
            '</head><body>Loading…</body></html>'
        );
      return;
    }

    res
      .status(200)
      .send(
        debug
          ? replaceOnce(shell, /<\/head>/, '<!-- SEO ERROR: ' + htmlEscape(message) + ' --></head>')
          : shell
      );
  }
};
