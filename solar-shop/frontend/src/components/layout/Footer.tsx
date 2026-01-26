import React ,{useState,useEffect}from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiInstagram, FiYoutube } from 'react-icons/fi';
import './Footer.css';
import { categoryApi } from '../../services/api';

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
                {/* <span>WALKERS</span> */}
              </Link>
              <p className="footer-desc">
                Your trusted partner for premium solar products. Powering homes and businesses with clean, renewable energy.
              </p>
              <div className="social-links">
                <a href="#" aria-label="Facebook"><FiFacebook /></a>
                <a href="#" aria-label="Twitter"><FiTwitter /></a>
                <a href="#" aria-label="Instagram"><FiInstagram /></a>
                <a href="#" aria-label="YouTube"><FiYoutube /></a>
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
                  <span>123 Solar Street, Green City, India - 600001</span>
                </li>
                <li>
                  <FiPhone />
                  <a href="tel:+919876543210">+91 98765 43210</a>
                </li>
                <li>
                  <FiMail />
                  <a href="mailto:info@walkers.com">info@walkers.com</a>
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
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/shipping">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
