# AI search visibility (GEO / AEO)

How walkers.org.in is made readable and citable by AI answer engines —
ChatGPT, Perplexity, Claude, Google AI Overviews / Gemini, Copilot — and what
still has to happen outside this repo.

## The problem this solves

The site is a client-rendered CRA bundle. The crawlers that feed AI answers do
**not** execute JavaScript:

| Crawler | Engine | Runs JS |
| --- | --- | --- |
| `GPTBot`, `OAI-SearchBot`, `ChatGPT-User` | ChatGPT | no |
| `PerplexityBot`, `Perplexity-User` | Perplexity | no |
| `ClaudeBot`, `Claude-SearchBot` | Claude | no |
| `Google-Extended` | Gemini grounding | no |
| `Applebot-Extended`, `Amazonbot`, `CCBot` | various | no |

Before these changes, `curl -A GPTBot https://www.walkers.org.in/` returned
4,256 bytes containing a `<title>`, some meta tags and `<div id="root"></div>`.
No headings, no products, no address, no prices. There was nothing for an AI
engine to quote, so it quoted competitors instead.

## What changed

### 1. Crawlable HTML on every indexable route

- **`/`** — `public/index.html` now ships real content inside `#root`:
  an `<h1>`, what the business sells, the full NAP block, service areas and six
  FAQ answers. `ReactDOM.createRoot().render()` clears those children, so a
  visitor with JavaScript never sees it. It is a server-rendered fallback, not
  hidden text — the same words are rendered visibly by `src/pages/Home.tsx`.
- **`/products`, `/products?category=…`** — new `api/render-page.js` fetches
  categories and products server-side and emits a real linked list with names,
  brands and prices, plus `ItemList` and `BreadcrumbList` JSON-LD.
- **`/contact`, `/gallery`** — server-rendered NAP, service area and copy.
- **`/shipping`, `/returns`, `/terms`, `/privacy`** — head only. The
  authoritative text lives in `src/data/policies.ts`; duplicating it in the
  function would guarantee drift. These previously served the homepage's
  canonical, which meant they could never be indexed at all.
- **`/products/:slug`** — `api/render.js` already did this. Its body content
  moved out of an off-screen `position:absolute;left:-9999px` div (a cloaking
  signal) into `#root`, where React replaces it.

### 2. Two real bugs fixed along the way

- **Head tags were being stripped after injection.** Both renderers injected a
  canonical, description, robots and OG tags, then ran global
  `.replace(/<link rel="canonical"[^>]*>/g, '')`-style cleanup to remove the
  shell's copies — which deleted the injected ones too. Every product page was
  shipping a `<title>` and nothing else. The cleanup now runs on the shell
  *before* injection.
- **`sitemap.xml` was the static 3-URL file, not the generated one.**
  Vercel checks the filesystem before applying `rewrites`, so
  `public/sitemap.xml` shadowed the `/sitemap.xml → /api/sitemap` rewrite.
  Not one product URL was in the live sitemap. The static file is deleted;
  `api/sitemap.js` now serves.

### 3. `robots.txt`

Every major AI crawler is named explicitly and allowed. `Crawl-delay: 1` is
gone — Googlebot ignores it and it throttles the AI crawlers we want.
`Disallow: /products?*page=` is gone too: it blocked crawlers from ever
discovering the products listed on page 2 onwards.

This opts the site **in** to AI training as well as AI search. For a local
retailer that is the right trade: presence in the answer is the whole point.

### 4. `llms.txt`

`public/llms.txt` — a plain-text summary at
[/llms.txt](https://www.walkers.org.in/llms.txt): who the business is, NAP,
hours, service area, what it sells, and the canonical URL for each key page.
Not yet an official standard, but cheap, and increasingly fetched.

### 5. Structured data

`public/index.html` carries one `@graph` instead of a lone `Store` block, so
nodes cross-reference by `@id` and an engine resolves them into a single
picture of the business: `Organization`, `PostalAddress`,
`Store`+`HomeAndConstructionBusiness` (with `areaServed`, `knowsAbout`,
`hasOfferCatalog`, `geo`, opening hours), `WebSite` (with `SearchAction`),
`WebPage`, and `FAQPage` with eight Q&As.

**No `aggregateRating`, `foundingDate` or award claims.** Do not add them
unless the underlying fact is real and verifiable somewhere a crawler can
reach — a fabricated rating is the fastest way to lose trust with both Google
and the answer engines.

## Verifying a deploy

```bash
curl -sA "GPTBot/1.0" https://www.walkers.org.in/ | wc -c          # want >15000, was 4256
curl -sA "GPTBot/1.0" https://www.walkers.org.in/products | grep -c "<li><a href=\"/products/"
curl -s https://www.walkers.org.in/sitemap.xml | grep -c "<loc>"   # want > 3
curl -sI https://www.walkers.org.in/llms.txt | head -1
```

Add `?seodebug=1` to any route handled by `api/render.js` or
`api/render-page.js` to get the failure notes as an HTML comment in `<head>`.

Then paste the homepage into Google's Rich Results Test and Schema.org's
validator, and re-submit the sitemap in Search Console.

## Editing the FAQ

The FAQ exists in three places that must stay in step:

1. `src/pages/Home.tsx` — the `faqs` array (what visitors read)
2. `public/index.html` — the `FAQPage` JSON-LD (what engines parse)
3. `public/index.html` — the `#root` fallback (what non-JS crawlers read)

A visible answer with no markup, or markup with no visible answer, is worth far
less than the pair. Edit all three.

## Not in this repo — but this is where the remaining wins are

On-site markup gets the site *eligible* to be cited. Which business an AI
actually names is driven mostly by third-party corroboration, because that is
what the models were trained on and what they retrieve at answer time.

1. **Google Business Profile.** Claim and complete it: category
   "Solar energy equipment supplier" plus "Solar energy contractor", every
   product category, real photos, hours, service areas. This feeds Google AI
   Overviews and Gemini directly and is the single highest-value item on this
   list.
2. **Reviews.** Ask every completed installation for a Google review that names
   what was installed and where ("5kW on-grid in Adoor", "solar fencing on a
   rubber plantation"). Answer engines quote review language almost verbatim.
3. **Directory consistency.** IndiaMART, JustDial, Sulekha, Bing Places, Apple
   Business Connect, TradeIndia. The name, address and phone must match this
   site **character for character**.
4. **Fix the phone number split.** The site currently shows three numbers:
   `+91 62380 93603` (homepage, contact, footer), `9745955104` (old JSON-LD)
   and `7356645787` (WhatsApp link in `Contact.tsx`). Everything on-site now
   uses `+91 62380 93603`. Pick one canonical number, use it everywhere
   including every directory, and treat the others as extensions.
5. **Social profiles.** Instagram (`walkers__group`) is now linked from
   `Footer.tsx` and listed in `sameAs` on both the `Organization` and
   `LocalBusiness` nodes. Add Facebook and YouTube in both places once those
   accounts exist — `SOCIALS` in `Footer.tsx` and the two `sameAs` arrays.

   Be clear about what this can and cannot do. Instagram's own robots.txt
   blocks `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Amazonbot`,
   `Applebot-Extended` and `Google-Extended` with `Disallow: /`, so the
   profile can **never** be read or cited by ChatGPT, Claude, Perplexity or
   Gemini grounding. Meta blocks them at source; nothing on our side changes
   that. `Googlebot` *is* allowed on profile pages, and Instagram publishes
   an `ig_seo_profile_sitemap`, so the profile can rank in ordinary Google
   results. The realistic route to an AI answer is indirect: this site says
   the account exists, and this site is crawlable.
6. **Write the pages people actually ask about.** Answer engines cite pages
   that answer a whole question. Highest value for this business, in order:
   - solar subsidy in Kerala / PM Surya Ghar — what you help with, what you don't
   - what a 3kW / 5kW / 10kW system costs in Kerala and what it powers
   - how much a solar system cuts a KSEB bill
   - solar electric fencing for farms: legality, cost, animals it deters
   - LiFePO4 vs lead-acid vs tubular for Kerala's climate
   Each as its own URL with a clear question as the `<h1>`, a direct answer in
   the first 60 words, then the detail. That first-paragraph answer is what
   gets extracted.
7. **Prices on product pages.** Products with a visible INR price and stock
   status get recommended; "call for price" does not.
