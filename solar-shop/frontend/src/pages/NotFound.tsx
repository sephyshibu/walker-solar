import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

/**
 * Replaces `<Route path="*" element={<Navigate to="/" replace />} />`.
 *
 * The old redirect made every unknown URL return HTTP 200 with homepage
 * content. Google treats those as soft 404s, and they pile up whenever a
 * product is removed or a URL is mistyped.
 *
 * A client-side route can't send a real 404 status — that needs the server.
 * `api/render.ts` already returns a genuine 404 for unknown /products/:slug,
 * which is where dead URLs actually come from. For everything else, the
 * `noindex` below is the signal Google needs.
 */
const NotFound: React.FC = () => (
  <>
    <SEO
      title="Page Not Found"
      description="The page you are looking for does not exist. Browse our solar panels, inverters and lithium batteries instead."
      noindex
    />

    <section
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem 1.5rem',
        gap: '1rem',
      }}
    >
      <p
        style={{
          fontSize: '0.8rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          opacity: 0.6,
          margin: 0,
        }}
      >
        Error 404
      </p>

      <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', margin: 0 }}>
        We couldn't find that page
      </h1>

      <p style={{ maxWidth: '46ch', opacity: 0.75, margin: 0 }}>
        The link may be broken, or the product may no longer be available.
        Everything we stock is one click away.
      </p>

      {/* Real anchors, so this page also feeds crawl paths back into the site */}
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '0.5rem',
        }}
      >
        <Link
          to="/products"
          style={{
            padding: '0.7rem 1.4rem',
            borderRadius: '999px',
            background: '#f59e0b',
            color: '#111',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Browse all products
        </Link>
        <Link
          to="/contact"
          style={{
            padding: '0.7rem 1.4rem',
            borderRadius: '999px',
            border: '1px solid currentColor',
            textDecoration: 'none',
          }}
        >
          Contact us
        </Link>
      </nav>

      <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '1.5rem' }}>
        Or call us on{' '}
        <a href="tel:+916238093603" style={{ color: 'inherit' }}>
          +91 62380 93603
        </a>
      </p>
    </section>
  </>
);

export default NotFound;