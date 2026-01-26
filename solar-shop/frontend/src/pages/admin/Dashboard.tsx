import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiShoppingCart, FiUsers, FiImage, FiArrowRight } from 'react-icons/fi';
import { productApi, orderApi, adminApi, galleryApi,categoryApi } from '../../services/api';
import './Admin.css';

interface DashboardStats {
  products: { total: number; active: number };
  orders: { total: number; pending: number };
  users: { total: number; active: number };
  gallery: { total: number; active: number };
  category:{total :number, active:number}
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    products: { total: 0, active: 0 },
    orders: { total: 0, pending: 0 },
    users: { total: 0, active: 0 },
    gallery: { total: 0, active: 0 },
    category: { total: 0, active: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Fetch all stats in parallel, but handle each one individually
      const [productsRes, ordersRes, usersRes, galleryRes,categoryRes] = await Promise.allSettled([
        productApi.getStats(),
        orderApi.getStats(),
        adminApi.getUserStats(),
        galleryApi.getStats(),
        categoryApi.getStats()
      ]);

      setStats({
        products: productsRes.status === 'fulfilled' 
          ? { total: productsRes.value.data.data?.total || 0, active: productsRes.value.data.data?.active || 0 }
          : { total: 0, active: 0 },
        orders: ordersRes.status === 'fulfilled' 
          ? { total: ordersRes.value.data.data?.total || 0, pending: ordersRes.value.data.data?.pending || 0 }
          : { total: 0, pending: 0 },
        users: usersRes.status === 'fulfilled' 
          ? { total: usersRes.value.data.data?.total || 0, active: usersRes.value.data.data?.active || 0 }
          : { total: 0, active: 0 },
        gallery: galleryRes.status === 'fulfilled' 
          ? { total: galleryRes.value.data.data?.total || 0, active: galleryRes.value.data.data?.active || 0 }
          : { total: 0, active: 0 },
          category: categoryRes.status === 'fulfilled' 
          ? { total: categoryRes.value.data.data?.total || 0, active: categoryRes.value.data.data?.active || 0 }
          : { total: 0, active: 0 },
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Products',
      value: stats.products.total,
      subtitle: `${stats.products.active} active`,
      icon: FiPackage,
      link: '/admin/products',
      color: 'primary',
    },
    {
      title: 'Orders',
      value: stats.orders.total,
      subtitle: `${stats.orders.pending} pending`,
      icon: FiShoppingCart,
      link: '/admin/orders',
      color: 'success',
    },
    {
      title: 'Users',
      value: stats.users.total,
      subtitle: `${stats.users.active} active`,
      icon: FiUsers,
      link: '/admin/users',
      color: 'info',
    },
    {
      title: 'Gallery',
      value: stats.gallery.total,
      subtitle: `${stats.gallery.active} active`,
      icon: FiImage,
      link: '/admin/gallery',
      color: 'warning',
    },
    {
      title: 'Category',
      value: stats.category.total,
      subtitle: `${stats.category.active} active`,
      icon: FiImage,
      link: '/admin/categories',
      color: 'warning',
    },
  ];

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's an overview of your store.</p>
        </div>

        <div className="stats-grid">
          {statCards.map((card) => (
            <Link key={card.title} to={card.link} className={`stat-card stat-${card.color}`}>
              <div className="stat-icon">
                <card.icon />
              </div>
              <div className="stat-info">
                <span className="stat-value">{loading ? '...' : card.value}</span>
                <span className="stat-title">{card.title}</span>
                <span className="stat-subtitle">{card.subtitle}</span>
              </div>
              <FiArrowRight className="stat-arrow" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;