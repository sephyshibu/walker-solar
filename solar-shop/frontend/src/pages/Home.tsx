// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { FiArrowRight, FiSun, FiZap, FiBattery, FiSettings, FiShield, FiTruck } from 'react-icons/fi';
// import ProductCard from '../components/product/ProductCard';
// import SEO from '../components/common/SEO';
// import { Product } from '../types';
// import { productApi } from '../services/api';
// import './Home.css';

// const Home: React.FC = () => {
//   const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadFeaturedProducts();
//   }, []);

//   const loadFeaturedProducts = async () => {
//     try {
//       const response = await productApi.getFeatured(8);
//       setFeaturedProducts(response.data.data);
//     } catch (error) {
//       console.error('Failed to load featured products:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const categories = [
//     { name: 'Solar Panels', slug: 'solar_panels', icon: FiSun, desc: 'High-efficiency monocrystalline & polycrystalline panels' },
//     { name: 'Inverters', slug: 'inverters', icon: FiZap, desc: 'Hybrid, on-grid & off-grid inverters' },
//     { name: 'Batteries', slug: 'batteries', icon: FiBattery, desc: 'Lithium & lead-acid storage solutions' },
//     { name: 'Controllers', slug: 'charge_controllers', icon: FiSettings, desc: 'MPPT & PWM charge controllers' },
//   ];

//   const features = [
//     { icon: FiShield, title: 'Quality Guarantee', desc: 'All products come with manufacturer warranty' },
//     { icon: FiTruck, title: 'Fast Delivery', desc: 'Quick shipping across India' },
//     { icon: FiZap, title: 'Expert Support', desc: '24/7 technical assistance available' },
//   ];

//   return (
//     <div className="home-page">
//       <SEO 
//         title="WALKERS - Premium Solar Products | Go Green with Clean Energy"
//         description="Shop premium solar products at WALKERS. High-efficiency solar panels, hybrid inverters, lithium batteries, charge controllers & accessories. Best prices in India with warranty!"
//         keywords="solar panels India, buy solar panels, solar inverters, solar batteries, renewable energy, WALKERS solar shop, clean energy solutions"
//         url="https://walkers.com"
//       />
      
//       {/* Hero Section */}
//       <section className="hero">
//         <div className="hero-bg">
//           <div className="hero-gradient" />
//           <div className="hero-pattern" />
//         </div>
//         <div className="container hero-content">
//           <div className="hero-text">
//             <span className="hero-badge">⚡ WALKERS - Power Solutions</span>
//             <h1>
//               Power Your Future with
//               <span className="highlight"> Clean Energy</span>
//             </h1>
//             <p>
//               Premium solar products for homes and businesses. From high-efficiency panels 
//               to smart inverters and batteries - everything you need for sustainable energy.
//             </p>
//             <div className="hero-actions">
//               <Link to="/products" className="btn btn-primary btn-lg">
//                 Explore Products <FiArrowRight />
//               </Link>
//               <Link to="/contact" className="btn btn-outline btn-lg">
//                 Get Quote
//               </Link>
//             </div>
//             <div className="hero-stats">
//               <div className="stat">
//                 <span className="stat-value">500+</span>
//                 <span className="stat-label">Products</span>
//               </div>
//               <div className="stat">
//                 <span className="stat-value">10K+</span>
//                 <span className="stat-label">Happy Customers</span>
//               </div>
//               <div className="stat">
//                 <span className="stat-value">25+</span>
//                 <span className="stat-label">Years Warranty</span>
//               </div>
//             </div>
//           </div>
//           <div className="hero-image">
//             <div className="hero-image-wrapper">
//               <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800" alt="Solar Panels" />
//               <div className="floating-card card-1">
//                 <FiSun className="card-icon" />
//                 <span>545W Power</span>
//               </div>
//               <div className="floating-card card-2">
//                 <FiZap className="card-icon" />
//                 <span>21% Efficiency</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Categories Section */}
//       <section className="section categories-section">
//         <div className="container">
//           <div className="section-header">
//             <h2 className="section-title">Shop by Category</h2>
//             <p className="section-subtitle">Browse our wide range of solar products</p>
//           </div>
//           <div className="categories-grid">
//             {categories.map((cat) => (
//               <Link key={cat.slug} to={`/products?category=${cat.slug}`} className="category-card">
//                 <div className="category-icon">
//                   <cat.icon />
//                 </div>
//                 <h3>{cat.name}</h3>
//                 <p>{cat.desc}</p>
//                 <span className="category-link">
//                   Shop Now <FiArrowRight />
//                 </span>
//               </Link>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Featured Products Section */}
//       <section className="section featured-section">
//         <div className="container">
//           <div className="section-header">
//             <div>
//               <h2 className="section-title">Featured Products</h2>
//               <p className="section-subtitle">Top picks selected by our experts</p>
//             </div>
//             <Link to="/products" className="btn btn-secondary">
//               View All <FiArrowRight />
//             </Link>
//           </div>
          
//           {loading ? (
//             <div className="loading-grid">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="product-skeleton" />
//               ))}
//             </div>
//           ) : (
//             <div className="products-grid">
//               {featuredProducts.map((product) => (
//                 <ProductCard key={product.id} product={product} />
//               ))}
//             </div>
//           )}
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="section features-section">
//         <div className="container">
//           <div className="features-grid">
//             {features.map((feature, index) => (
//               <div key={index} className="feature-card">
//                 <div className="feature-icon">
//                   <feature.icon />
//                 </div>
//                 <h3>{feature.title}</h3>
//                 <p>{feature.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="section cta-section">
//         <div className="container">
//           <div className="cta-content">
//             <h2>Ready to Switch to Solar?</h2>
//             <p>Get a free consultation and customized quote for your solar needs</p>
//             <div className="cta-actions">
//               <Link to="/contact" className="btn btn-primary btn-lg">
//                 Contact Us <FiArrowRight />
//               </Link>
//               <a href="tel:+919876543210" className="btn btn-outline btn-lg">
//                 Call: +91 98765 43210
//               </a>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default Home;
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiSun, FiZap, FiBattery, FiSettings, FiShield, FiTruck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ProductCard from '../components/product/ProductCard';
import SEO from '../components/common/SEO';
import { Product } from '../types';
import { productApi } from '../services/api';
import './Home.css';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero images for 3D carousel
  const heroImages = [
    {
      url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
      alt: 'Solar Panels Field',
      card1: { icon: 'sun', text: '545W Power' },
      card2: { icon: 'zap', text: '21% Efficiency' },
    },
    {
      url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800',
      alt: 'Rooftop Solar Installation',
      card1: { icon: 'sun', text: 'Rooftop Ready' },
      card2: { icon: 'zap', text: 'Easy Install' },
    },
    {
      url: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800',
      alt: 'Solar Energy Storage',
      card1: { icon: 'battery', text: '10kWh Storage' },
      card2: { icon: 'zap', text: 'Smart Grid' },
    },
    {
      url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800',
      alt: 'Clean Energy Future',
      card1: { icon: 'sun', text: 'Zero Carbon' },
      card2: { icon: 'zap', text: 'Sustainable' },
    },
  ];

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const categories = [
    { name: 'Solar Panels', slug: 'solar_panels', icon: FiSun, desc: 'High-efficiency monocrystalline & polycrystalline panels' },
    { name: 'Inverters', slug: 'inverters', icon: FiZap, desc: 'Hybrid, on-grid & off-grid inverters' },
    { name: 'Batteries', slug: 'batteries', icon: FiBattery, desc: 'Lithium & lead-acid storage solutions' },
    { name: 'Controllers', slug: 'charge_controllers', icon: FiSettings, desc: 'MPPT & PWM charge controllers' },
  ];

  const features = [
    { icon: FiShield, title: 'Quality Guarantee', desc: 'All products come with manufacturer warranty' },
    { icon: FiTruck, title: 'Fast Delivery', desc: 'Quick shipping across India' },
    { icon: FiZap, title: 'Expert Support', desc: '24/7 technical assistance available' },
  ];

  const getCardIcon = (iconName: string) => {
    switch (iconName) {
      case 'sun': return <FiSun className="card-icon" />;
      case 'zap': return <FiZap className="card-icon" />;
      case 'battery': return <FiBattery className="card-icon" />;
      default: return <FiSun className="card-icon" />;
    }
  };

  return (
    <div className="home-page">
      <SEO 
        title="WALKERS - Premium Solar Products | Go Green with Clean Energy"
        description="Shop premium solar products at WALKERS. High-efficiency solar panels, hybrid inverters, lithium batteries, charge controllers & accessories. Best prices in India with warranty!"
        keywords="solar panels India, buy solar panels, solar inverters, solar batteries, renewable energy, WALKERS solar shop, clean energy solutions"
        url="https://walkers.com"
      />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-pattern" />
        </div>
        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-badge">⚡ WALKERS - Power Solutions</span>
            <h1>
              Power Your Future with
              <span className="highlight"> Clean Energy</span>
            </h1>
            <p>
              Premium solar products for homes and businesses. From high-efficiency panels 
              to smart inverters and batteries - everything you need for sustainable energy.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                Explore Products <FiArrowRight />
              </Link>
              <Link to="/contact" className="btn btn-outline btn-lg">
                Get Quote
              </Link>
            </div>
            <div className="hero-stats">
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
            </div>
          </div>

          {/* 3D Image Carousel */}
          <div className="hero-carousel">
            <div className="carousel-scene">
              <div className="carousel-container">
                {heroImages.map((image, index) => {
                  const offset = index - currentSlide;
                  const isActive = index === currentSlide;
                  
                  return (
                    <div
                      key={index}
                      className={`carousel-slide ${isActive ? 'active' : ''}`}
                      style={{
                        '--offset': offset,
                        '--abs-offset': Math.abs(offset),
                      } as React.CSSProperties}
                    >
                      <div className="slide-content">
                        <img src={image.url} alt={image.alt} />
                        
                        {/* Floating Cards */}
                        <div className="floating-card card-1">
                          {getCardIcon(image.card1.icon)}
                          <span>{image.card1.text}</span>
                        </div>
                        <div className="floating-card card-2">
                          {getCardIcon(image.card2.icon)}
                          <span>{image.card2.text}</span>
                        </div>
                        
                        {/* Reflection */}
                        <div className="slide-reflection">
                          <img src={image.url} alt="" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Carousel Controls */}
            <div className="carousel-controls">
              <button className="carousel-btn prev" onClick={prevSlide} aria-label="Previous slide">
                <FiChevronLeft />
              </button>
              <div className="carousel-dots">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              <button className="carousel-btn next" onClick={nextSlide} aria-label="Next slide">
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Browse our wide range of solar products</p>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <Link key={cat.slug} to={`/products?category=${cat.slug}`} className="category-card">
                <div className="category-icon">
                  <cat.icon />
                </div>
                <h3>{cat.name}</h3>
                <p>{cat.desc}</p>
                <span className="category-link">
                  Shop Now <FiArrowRight />
                </span>
              </Link>
            ))}
          </div>
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

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Switch to Solar?</h2>
            <p>Get a free consultation and customized quote for your solar needs</p>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-primary btn-lg">
                Contact Us <FiArrowRight />
              </Link>
              <a href="tel:+919876543210" className="btn btn-outline btn-lg">
                Call: +91 98765 43210
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
