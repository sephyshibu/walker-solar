// import { useEffect } from 'react';

// interface SEOProps {
//   title?: string;
//   description?: string;
//   keywords?: string;
//   image?: string;
//   url?: string;
//   type?: 'website' | 'product' | 'article';
// }

// const SEO: React.FC<SEOProps> = ({
//   title = 'WALKERS - Top Solar & Inverter Dealers in Pathanamthitta',
//   description = 'Looking for the best solar panel dealers in Pathanamthitta? WALKERS offers high-efficiency solar panels, hybrid inverters, lithium batteries, and solar fencing in Kerala.',
//   keywords = 'Best solar panel dealers in Pathanamthitta, Inverter battery shop in Kerala, Solar fencing installers near me, solar pumps Kerala',
//   image = '/walkers_logo.png',
//   url = 'https://www.walkers.org.in', // Make sure to use your actual .org.in domain
// }) => {
//   const fullTitle = title.includes('WALKERS') ? title : `${title} | WALKERS`;
  
//   useEffect(() => {
//     // Update document title
//     document.title = fullTitle;
    
//     // Update or create meta tags
//     const updateMetaTag = (name: string, content: string, isProperty = false) => {
//       const attribute = isProperty ? 'property' : 'name';
//       let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
//       if (!meta) {
//         meta = document.createElement('meta');
//         meta.setAttribute(attribute, name);
//         document.head.appendChild(meta);
//       }
//       meta.setAttribute('content', content);
//     };
    
//     // Primary meta tags
//     updateMetaTag('description', description);
//     updateMetaTag('keywords', keywords);
    
//     // Open Graph tags
//     updateMetaTag('og:type', 'website', true);
//     updateMetaTag('og:url', url, true);
//     updateMetaTag('og:title', fullTitle, true);
//     updateMetaTag('og:description', description, true);
//     updateMetaTag('og:image', image, true);
    
//     // Twitter tags
//     updateMetaTag('twitter:card', 'summary_large_image');
//     updateMetaTag('twitter:url', url);
//     updateMetaTag('twitter:title', fullTitle);
//     updateMetaTag('twitter:description', description);
//     updateMetaTag('twitter:image', image);
    
//     // Update canonical URL
//     let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
//     if (!canonical) {
//       canonical = document.createElement('link');
//       canonical.setAttribute('rel', 'canonical');
//       document.head.appendChild(canonical);
//     }
//     canonical.setAttribute('href', url);
    
//   }, [fullTitle, description, keywords, image, url]);
  
//   // This component doesn't render anything visible
//   return null;
// };

// export default SEO;
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Single source of truth. Your server redirects walkers.org.in -> www,
// so every canonical must use www or you send Google contradictory signals.
export const SITE = 'https://www.walkers.org.in';

const DEFAULT_IMAGE = `${SITE}/walkers_logo.png`;

interface SEOProps {
  title?: string;
  description?: string;
  /** Ignored by Google since 2009. Kept only so existing calls don't break. */
  keywords?: string;
  /** Relative ('/img/x.jpg') or absolute. Converted to absolute automatically. */
  image?: string;
  /**
   * Canonical URL. Leave undefined and it is derived from the current route,
   * which is correct for almost every page. Pass it explicitly only when the
   * canonical differs from the current URL — e.g. a filtered listing that
   * should point at the clean category URL.
   */
  url?: string;
  type?: 'website' | 'product' | 'article';
  /** True for cart, checkout, wishlist, orders, profile, login, register, 404. */
  noindex?: boolean;
  /** Optional schema.org object, injected as JSON-LD. */
  schema?: Record<string, unknown> | null;
}

/** Turn a relative path into an absolute URL. og:image will not work otherwise. */
function absolute(pathOrUrl: string): string {
  if (!pathOrUrl) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

const SEO: React.FC<SEOProps> = ({
  title = 'WALKERS - Top Solar & Inverter Dealers in Pathanamthitta',
  description = 'Looking for the best solar panel dealers in Pathanamthitta? WALKERS offers high-efficiency solar panels, hybrid inverters, lithium batteries, and solar fencing in Kerala.',
  keywords,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
  schema = null,
}) => {
  const { pathname } = useLocation();

  // Derived from the route, NOT hardcoded to the homepage.
  // Note this deliberately drops query strings, so /products?page=3
  // canonicalises to /products. Pass `url` explicitly for category pages.
  const canonicalUrl = url ?? `${SITE}${pathname}`;

  const fullTitle = /walkers/i.test(title) ? title : `${title} | WALKERS`;
  const absoluteImage = absolute(image);

  // Serialised so an inline object literal doesn't retrigger the effect
  // on every single render.
  const schemaKey = schema ? JSON.stringify(schema) : '';

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (key: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // ---------------------------------------------------------------------
    // Every tag is written on EVERY render, never conditionally.
    // This component mutates a shared <head>, so a tag left unwritten keeps
    // the previous page's value. That is how a `noindex` from /cart would
    // silently follow you onto /products.
    // ---------------------------------------------------------------------
    setMeta('description', description);
    setMeta('robots', noindex ? 'noindex, follow' : 'index, follow');

    if (keywords) setMeta('keywords', keywords);

    setMeta('og:type', type, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:image', absoluteImage, true);
    setMeta('og:image:alt', fullTitle, true);
    setMeta('og:site_name', 'WALKERS', true);
    setMeta('og:locale', 'en_IN', true);

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:url', canonicalUrl);
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', absoluteImage);

    // ---- Canonical -------------------------------------------------------
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // ---- JSON-LD ---------------------------------------------------------
    // Tagged with a data attribute so we can remove exactly our own script
    // and leave the LocalBusiness block in index.html untouched.
    const MARKER = 'data-seo-component';
    document.querySelectorAll(`script[${MARKER}]`).forEach((n) => n.remove());

    if (schemaKey) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute(MARKER, 'true');
      script.textContent = schemaKey;
      document.head.appendChild(script);
    }

    // Cleanup matters here: without it, browsing product to product stacks
    // up multiple Product blocks and Google sees conflicting markup.
    return () => {
      document.querySelectorAll(`script[${MARKER}]`).forEach((n) => n.remove());
    };
  }, [
    fullTitle,
    description,
    keywords,
    absoluteImage,
    canonicalUrl,
    type,
    noindex,
    schemaKey,
  ]);

  return null;
};

export default SEO;

// ===========================================================================
// USAGE
// ===========================================================================
//
// --- Home.tsx --------------------------------------------------------------
// <SEO />                       // defaults are already the homepage copy
//
//
// --- ProductDetail.tsx -----------------------------------------------------
// Keep titles under ~60 characters or Google truncates them in results.
//
//   <SEO
//     title={`${product.name} Price in Kerala`}
//     description={`Buy ${product.name} at WALKERS, Pathanamthitta. ${product.shortDescription} Warranty, delivery and installation across Kerala.`}
//     image={product.images?.[0]}
//     type="product"
//     schema={{
//       '@context': 'https://schema.org',
//       '@type': 'Product',
//       name: product.name,
//       description: product.description,
//       image: product.images?.map((i: string) => (i.startsWith('http') ? i : `${SITE}${i}`)),
//       sku: product.sku,
//       brand: { '@type': 'Brand', name: product.brand },
//       offers: {
//         '@type': 'Offer',
//         url: `${SITE}/products/${product.slug}`,
//         priceCurrency: 'INR',
//         price: String(product.price),
//         itemCondition: 'https://schema.org/NewCondition',
//         availability: product.stock > 0
//           ? 'https://schema.org/InStock'
//           : 'https://schema.org/OutOfStock',
//       },
//     }}
//   />
//
// No `url` passed — it resolves to /products/<slug> from the route, which is
// exactly what api/render.ts writes server-side. The two must agree.
//
//
// --- Products.tsx ----------------------------------------------------------
// Here you DO pass url, because ?page=2 must not become its own canonical.
//
//   const [params] = useSearchParams();
//   const category = params.get('category');
//   const page = Number(params.get('page') ?? 1);
//
//   <SEO
//     title={category
//       ? `${label} in Pathanamthitta, Kerala`
//       : 'Solar Panels, Inverters & Batteries'}
//     description={...}
//     url={category ? `${SITE}/products?category=${category}` : `${SITE}/products`}
//     noindex={page > 1}
//   />
//
//
// --- Cart / Checkout / Wishlist / Orders / Profile / Login / Register ------
// <SEO title="Your Cart" description="Review the items in your cart." noindex />
//
// robots.txt Disallow only stops crawling. It does not remove a page that
// is already indexed — you need this noindex too.
//
//
// --- NotFound.tsx ---------------------------------------------------------
// <SEO title="Page Not Found" description="This page does not exist." noindex />