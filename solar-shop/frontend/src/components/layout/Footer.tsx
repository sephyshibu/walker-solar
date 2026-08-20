import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiInstagram } from 'react-icons/fi';
import './Footer.css';
import { categoryApi } from '../../services/api';

// Real profiles only. An <a href="#"> is a dead link to a visitor and a dead
// end to a crawler, and Google will not connect a profile to this business
// unless something links to it. Add Facebook and YouTube here once those
// accounts exist, and mirror them in the `sameAs` array of the Organization
// node in public/index.html — that pair is what ties the accounts to the
// business as one entity.
//
// URLs are stored clean: an ?igsh= suffix is Instagram share tracking, not
// part of the profile address, and passing it around splits the signal.
const SOCIALS: { href: string; label: string; Icon: typeof FiInstagram }[] = [
  {
    href: 'https://www.instagram.com/walkers__group/',
    label: 'Walkers Group on Instagram',
    Icon: FiInstagram,
  },
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getActive();
        setCategories(response.data.data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-brand">
              <Link to="/" className="footer-logo">
                <img src="/Logo_transaparent.png" alt="Walkers" className="footer-logo-img" />
              </Link>
              <p className="footer-desc">
                Your trusted partner for premium solar products. Powering homes and businesses with
                clean, renewable energy.
              </p>
              <div className="social-links">
                {SOCIALS.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="me noopener noreferrer"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/products">All Products</Link></li>
                <li><Link to="/gallery">Gallery</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div className="footer-section">
              <h4>Categories</h4>
              <ul>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link to={`/products?category=${cat.slug}`}>{cat.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="footer-section">
              <h4>Contact Us</h4>
              <ul className="contact-list">
                <li>
                  <FiMapPin />
                  <span>Walkers Building </span>
                </li>
                <li>
                  <FiPhone />
                  <a href="tel:+916238093603">+91 62380 93603</a>
                </li>
                <li>
                  <FiMail />
                  <a href="mailto:walkersgroup@gmail.com">walkersgroup@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {currentYear} WALKERS. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/shipping">Shipping Policy</Link>
            <Link to="/returns">Return Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;