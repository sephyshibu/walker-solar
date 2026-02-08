import React, { useEffect, useState } from 'react';
import { 
  FiPackage, 
  FiShoppingCart, 
  FiUsers, 
  FiImage, 
  FiGrid, 
  FiMenu,
  FiX
} from 'react-icons/fi';
// Import your actual APIs
import { productApi, orderApi, adminApi, galleryApi, categoryApi } from '../../services/api';
import './Admin.css';

// --- IMPORT YOUR REAL COMPONENTS HERE ---
import Products from './Products';
import Orders from './Orders';
import Categories from './Categories';
import Users from './Users';
import Gallery from './Gallery1';
// etc...

interface DashboardStats {
  products: { total: number; active: number };
  orders: { total: number; pending: number };
  users: { total: number; active: number };
  gallery: { total: number; active: number };
  category: { total: number; active: number };
}

const Dashboard: React.FC = () => {
  // 1. Set default tab to 'products' as requested
  const [activeTab, setActiveTab] = useState<string>('products');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState<DashboardStats>({
    products: { total: 0, active: 0 },
    orders: { total: 0, pending: 0 },
    users: { total: 0, active: 0 },
    gallery: { total: 0, active: 0 },
    category: { total: 0, active: 0 },
  });

  useEffect(() => {
    loadStats();
    // Check screen size for sidebar responsive behavior
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  const loadStats = async () => {
    try {
      const [productsRes, ordersRes, usersRes, galleryRes, categoryRes] = await Promise.allSettled([
        productApi.getStats(),
        orderApi.getStats(),
        adminApi.getUserStats(),
        galleryApi.getStats(),
        categoryApi.getStats()
      ]);

      setStats({
        products: productsRes.status === 'fulfilled' ? { total: productsRes.value.data.data?.total || 0, active: productsRes.value.data.data?.active || 0 } : { total: 0, active: 0 },
        orders: ordersRes.status === 'fulfilled' ? { total: ordersRes.value.data.data?.total || 0, pending: ordersRes.value.data.data?.pending || 0 } : { total: 0, pending: 0 },
        users: usersRes.status === 'fulfilled' ? { total: usersRes.value.data.data?.total || 0, active: usersRes.value.data.data?.active || 0 } : { total: 0, active: 0 },
        gallery: galleryRes.status === 'fulfilled' ? { total: galleryRes.value.data.data?.total || 0, active: galleryRes.value.data.data?.active || 0 } : { total: 0, active: 0 },
        category: categoryRes.status === 'fulfilled' ? { total: categoryRes.value.data.data?.total || 0, active: categoryRes.value.data.data?.active || 0 } : { total: 0, active: 0 },
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Define the Navigation Tabs
  const menuItems = [
    { 
      id: 'products', 
      label: 'Products', 
      icon: FiPackage, 
      count: stats.products.total,
      color: 'var(--color-primary)' 
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: FiShoppingCart, 
      count: stats.orders.pending, // Show pending count for urgency
      badge: stats.orders.pending > 0, // Show red dot if pending > 0
      color: 'var(--color-success)' 
    },
    { 
      id: 'categories', 
      label: 'Categories', 
      icon: FiGrid, 
      count: stats.category.total,
      color: 'var(--color-warning)' 
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: FiUsers, 
      count: stats.users.total,
      color: 'var(--color-info)' 
    },
    { 
      id: 'gallery', 
      label: 'Gallery', 
      icon: FiImage, 
      count: stats.gallery.total,
      color: '#ec4899' 
    },
  ];

  // 3. Switcher Logic
  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <Products />; // REPLACE with <Products />
      case 'orders':
        return <Orders />;   // REPLACE with <Orders />
      case 'categories':
        return <Categories />; // REPLACE with <Categories />
      case 'users':
        return <Users />;    // REPLACE with <Users />
      case 'gallery':
        return <Gallery />;  // REPLACE with <Gallery />
      default:
        return <Products />;
    }
  };

  return (
    <div className="admin-layout">
      {/* Mobile Toggle */}
      <div className="mobile-nav-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? <FiX /> : <FiMenu />}
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Walkers Admin</h2>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if(window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              style={{ '--item-color': item.color } as React.CSSProperties}
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              
              {/* Counter Badge */}
              {!loading && (
                <span className={`nav-badge ${item.badge ? 'urgent' : ''}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        <header className="content-header">
          <h1>{menuItems.find(i => i.id === activeTab)?.label}</h1>
          <div className="header-user">Admin Status: <span className="status-dot"></span> Online</div>
        </header>

        <div className="content-body fade-in-up">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// --- PLACEHOLDER COMPONENTS (Remove these once you connect your real ones) ---
const ProductsPlaceholder = () => <div className="p-4 bg-[var(--bg-card)] rounded-lg"><h2>Products Management Component</h2><p>List of products goes here...</p></div>;
const OrdersPlaceholder = () => <div className="p-4 bg-[var(--bg-card)] rounded-lg"><h2>Orders Management Component</h2><p>Order tables goes here...</p></div>;
const CategoriesPlaceholder = () => <div className="p-4 bg-[var(--bg-card)] rounded-lg"><h2>Category Management Component</h2><p>Category grid goes here...</p></div>;
const UsersPlaceholder = () => <div className="p-4 bg-[var(--bg-card)] rounded-lg"><h2>User Management Component</h2><p>User list goes here...</p></div>;
const GalleryPlaceholder = () => <div className="p-4 bg-[var(--bg-card)] rounded-lg"><h2>Gallery Management Component</h2><p>Image grid goes here...</p></div>;

export default Dashboard;