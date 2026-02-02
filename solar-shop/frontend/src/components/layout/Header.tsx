import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiUser, FiMenu, FiX, FiSearch, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuthStore, useCartStore, useWishlistStore, useUIStore } from '../../store';
import { categoryApi } from '../../services/api';
import './Header.css';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const { wishlist } = useWishlistStore();
  const { toggleCart, toggleSidebar, sidebarOpen, closeSidebar } = useUIStore();
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    closeSidebar();
    setUserMenuOpen(false);
  }, [location.pathname]);

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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <img src="/Logo_transaparent.png" alt="Walkers" className="logo-icon" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <div className="nav-dropdown">
            <Link to="/products" className={location.pathname.startsWith('/products') ? 'active' : ''}>
              Products
            </Link>
            <div className="dropdown-menu">
              <Link to="/products">All Products</Link>
              {categories.map((cat) => (
                <Link key={cat.slug} to={`/products?category=${cat.slug}`}>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/gallery" className={location.pathname === '/gallery' ? 'active' : ''}>Gallery</Link>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Contact</Link>
          {isAdmin && (
            <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}>Admin</Link>
          )}
        </nav>

        {/* Actions */}
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <Link to="/wishlist" className="action-btn wishlist-btn">
                <FiHeart />
                {wishlist && wishlist.items.length > 0 && (
                  <span className="badge">{wishlist.items.length}</span>
                )}
              </Link>
              
              <button className="action-btn cart-btn" onClick={toggleCart}>
                <FiShoppingCart />
                {cart && cart.totalItems > 0 && (
                  <span className="badge">{cart.totalItems}</span>
                )}
              </button>

              <div className="user-menu-wrapper">
                <button 
                  className="action-btn user-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <FiUser />
                </button>
                
                {userMenuOpen && (
                  <div className="user-menu">
                    <div className="user-menu-header">
                      <span className="user-name">{user?.firstName} {user?.lastName}</span>
                      <span className="user-email">{user?.email}</span>
                    </div>
                    <div className="user-menu-divider" />
                    <Link to="/profile" className="user-menu-item">
                      <FiUser /> Profile
                    </Link>
                    <Link to="/orders" className="user-menu-item">
                      <FiShoppingCart /> My Orders
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="user-menu-item">
                        <FiSettings /> Admin Panel
                      </Link>
                    )}
                    <div className="user-menu-divider" />
                    <button onClick={handleLogout} className="user-menu-item logout">
                      <FiLogOut /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-btn" 
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className={`nav-mobile ${sidebarOpen ? 'open' : ''}`}>
        {/* Close Button inside mobile menu */}
        <button 
          className="mobile-close-btn" 
          onClick={closeSidebar}
          aria-label="Close menu"
        >
          <FiX />
        </button>

        <div className="mobile-menu-content">
          <Link to="/" onClick={closeSidebar}>Home</Link>
          <Link to="/products" onClick={closeSidebar}>Products</Link>
          {categories.map((cat) => (
            <Link 
              key={cat.slug} 
              to={`/products?category=${cat.slug}`} 
              className="sub-link"
              onClick={closeSidebar}
            >
              {cat.name}
            </Link>
          ))}
          <Link to="/gallery" onClick={closeSidebar}>Gallery</Link>
          <Link to="/contact" onClick={closeSidebar}>Contact</Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={closeSidebar}>My Profile</Link>
              <Link to="/orders" onClick={closeSidebar}>My Orders</Link>
              <Link to="/wishlist" onClick={closeSidebar}>Wishlist</Link>
              {isAdmin && <Link to="/admin" onClick={closeSidebar}>Admin Panel</Link>}
              <button onClick={() => { handleLogout(); closeSidebar(); }} className="logout-btn">
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeSidebar}>Login</Link>
              <Link to="/register" onClick={closeSidebar}>Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* Overlay */}
      {sidebarOpen && <div className="overlay" onClick={closeSidebar} />}
    </header>
  );
};

export default Header;