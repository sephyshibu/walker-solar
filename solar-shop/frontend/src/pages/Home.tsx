import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiSun, FiZap, FiBattery, FiSettings, FiShield, FiTruck, FiBox, FiCpu, FiGrid } from 'react-icons/fi';
import ProductCard from '../components/product/ProductCard';
import SEO from '../components/common/SEO';
import { Product } from '../types';
import { productApi, categoryApi } from '../services/api';
import './Home.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

// Icon mapping for categories based on slug keywords
const getCategoryIcon = (slug: string) => {
  const slugLower = slug.toLowerCase();
  if (slugLower.includes('panel') || slugLower.includes('solar')) return FiSun;
  if (slugLower.includes('inverter')) return FiZap;
  if (slugLower.includes('battery') || slugLower.includes('batteries')) return FiBattery;
  if (slugLower.includes('controller') || slugLower.includes('charge')) return FiSettings;
  if (slugLower.includes('cable') || slugLower.includes('connector')) return FiCpu;
  if (slugLower.includes('mount') || slugLower.includes('structure')) return FiGrid;
  return FiBox; // Default icon
};

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
    loadCategories();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const response = await productApi.getFeatured(8);
      setFeaturedProducts(response.data.data);
    } catch (error) {
      console.error('Failed to load featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getActive();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Kept deliberately in sync with the <!--PRERENDER--> block in
  // public/index.html and the FAQPage JSON-LD in the same file. AI answer
  // engines quote these answers directly, so if you edit one copy, edit all
  // three — a visible answer with no markup, or markup with no visible
  // answer, is worth much less than the pair.
  const faqs = [
    {
      q: 'What does Walkers Solar sell?',
      a: 'High-efficiency monocrystalline solar panels, on-grid and off-grid solar systems, hybrid and smart inverters, LiFePO4 lithium batteries,earth power, inverter batteries, solar lights, solar water pumps, charge controllers, mounting structures and solar electric fencing.',
    },
    {
      q: 'Which areas does Walkers Solar serve?',
      a: 'Pathanamthitta and the rest of Kerala, including the neighbouring Alappuzha, Kottayam, Kollam and Idukki districts. Products can be shipped anywhere in India.',
    },
    {
      q: 'What is the difference between on-grid and off-grid solar?',
      a: 'An on-grid system is tied to the KSEB grid and reduces your bill by exporting surplus generation, but it stops working during a power cut. An off-grid system stores generation in batteries and keeps running through an outage, so it suits places with an unreliable supply. A hybrid inverter combines both. We supply all three and can advise which fits your load and site.',
    },
    {
      q: 'Why choose a lithium LiFePO4 battery over lead-acid?',
      a: 'LiFePO4 batteries last several times more charge cycles than lead-acid, allow a much deeper usable discharge, charge faster, weigh far less for the same usable capacity and need no topping up with water. They cost more up front, but the cost per usable kWh over the life of the battery is normally lower.',
    },
    {
      q: 'Do your products come with a warranty?',
      a: "Yes. Every product carries the manufacturer's warranty, and the applicable period is listed on each product page.",
    },
    {
      q: 'How do I get a quote?',
      a: 'Consultations and quotes are free. Call or WhatsApp +91 62380 93603, email walkersgroup@gmail.com, or use the contact form and tell us your location and roughly what you want to power.',
    },
  ];

  const features = [
    { icon: FiShield, title: 'Quality Guarantee', desc: 'All products come with manufacturer warranty' },
    { icon: FiTruck, title: 'Fast Delivery', desc: 'Quick shipping across India' },
    { icon: FiZap, title: 'Expert Support', desc: '24/7 technical assistance available' },
  ];

 return (
    <div className="home-page">
      <SEO 
        title="WALKERS - Solar Panels, Inverters,Lithium Batteries,Solar Lights,Batteries,Off-Grid,On-Grid Solar Electric Fencing in Pathanamthitta"
        description="Best solar panel dealers in Pathanamthitta. We provide premium solar energy systems, lithium batteries, and solar electric fencing across Kerala."
        keywords="Best solar panel dealers in Pathanamthitta, Inverter battery shop in Kerala, Solar fencing installers near me"
        url="https://www.walkers.org.in"
      />
      
     {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-pattern" />
        </div>
        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-badge">⚡ Top Rated in Pathanamthitta, Kerala</span>
            <h1>
              Smart
               <span className="highlight"> Solar Energy</span> & Advanced 
              <span className="highlight"> Electric Fencing </span>
              Solutions
            </h1>
            <p>
              At Walkers Solar, we provide premium solar energy systems 
              and high-security solar electric fencing for residential and commercial
               properties. Beyond robust perimeter protection, we specialize in 
               advanced power backup solutions utilizing the latest 
               lithium battery technology (LiFePO4). From high-efficiency monocrystalline 
               panels and smart inverters to long-lasting energy storage, we deliver sustainable,
              cost-effective power that keeps your home or business running 24/7
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                Explore Products <FiArrowRight />
              </Link>
              <Link to="/contact" className="btn btn-outline btn-lg">
                Get Quote
              </Link>
            </div>
            {/* <div className="hero-stats">
              <div className="stat">
                <span className="stat-value">500+</span>
                <span className="stat-label">Products</span>
              </div>
              <div className="stat">
                <span className="stat-value">10K+</span>
                <span className="stat-label">Happy Customers</span>
              </div>
              <div className="stat">
                <span className="stat-value">25+</span>
                <span className="stat-label">Years Warranty</span>
              </div>
            </div> */}
          </div>
          <div className="hero-image">
            <div className="hero-image-wrapper">
              <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800" alt="Solar Panels" />
              
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>

          </div>
          {categoriesLoading ? (
            <div className="categories-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="category-card category-skeleton" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="categories-grid">
              {categories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.slug);
                return (
                  <Link key={cat.slug} to={`/products?category=${cat.slug}`} className="category-card">
                    {cat.image ? (
                      <div className="category-icon category-icon-image">
                        <img src={cat.image} alt={cat.name} />
                      </div>
                    ) : (
                      <div className="category-icon">
                        <IconComponent />
                      </div>
                    )}
                    <h3>{cat.name}</h3>
                    <p>{cat.description || `Browse our ${cat.name.toLowerCase()} collection`}</p>
                    <span className="category-link">
                      Shop Now <FiArrowRight />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="no-categories">
              <p>No categories available</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="section featured-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">Top picks selected by our experts</p>
            </div>
            <Link to="/products" className="btn btn-secondary">
              View All <FiArrowRight />
            </Link>
          </div>
          
          {loading ? (
            <div className="loading-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="product-skeleton" />
              ))}
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="section features-section">
        <div className="container">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <feature.icon />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section — also the source of the FAQPage structured data. */}
      <section className="section faq-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-subtitle">
                Solar, batteries and solar fencing in Pathanamthitta and across Kerala
              </p>
            </div>
          </div>
          <div className="faq-list">
            {faqs.map((item, index) => (
              <details key={index} className="faq-item" open={index === 0}>
                <summary className="faq-question">{item.q}</summary>
                <p className="faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

     {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Secure Your Property & Cut KSEB Bills Today</h2>
            <p>Get a free consultation and customized quote for your home or farm in Kerala.</p>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-primary btn-lg">
                Contact Us <FiArrowRight />
              </Link>
              <a href="tel:+916238093603" className="btn btn-outline btn-lg">
                Call: +91 62380 93603
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;