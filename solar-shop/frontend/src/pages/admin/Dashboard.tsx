import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiShoppingCart, FiUsers, FiMail, FiArrowRight } from 'react-icons/fi';
import { productApi, orderApi, adminApi, contactApi } from '../../services/api';
import './Admin.css';

interface DashboardStats {
  products: { total: number; active: number };
  orders: { total: number; pending: number };
  users: { total: number; active: number };
  contacts: { total: number; new: number };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [productsRes, ordersRes, usersRes, contactsRes] = await Promise.all([
        productApi.getStats(),
        orderApi.getStats(),
        adminApi.getUserStats(),
        contactApi.getStats(),
      ]);

      setStats({
        products: { total: productsRes.data.data.total, active: productsRes.data.data.active },
        orders: { total: ordersRes.data.data.total, pending: ordersRes.data.data.pending },
        users: { total: usersRes.data.data.total, active: usersRes.data.data.active },
        contacts: { total: contactsRes.data.data.total, new: contactsRes.data.data.new },
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
      value: stats?.products.total || 0,
      subtitle: `${stats?.products.active || 0} active`,
      icon: FiPackage,
      link: '/admin/products',
      color: 'primary',
    },
    {
      title: 'Orders',
      value: stats?.orders.total || 0,
      subtitle: `${stats?.orders.pending || 0} pending`,
      icon: FiShoppingCart,
      link: '/admin/orders',
      color: 'success',
    },
    {
      title: 'Users',
      value: stats?.users.total || 0,
      subtitle: `${stats?.users.active || 0} active`,
      icon: FiUsers,
      link: '/admin/users',
      color: 'info',
    },
    {
      title: 'Contacts',
      value: stats?.contacts.total || 0,
      subtitle: `${stats?.contacts.new || 0} new`,
      icon: FiMail,
      link: '/admin/contacts',
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

        <div className="admin-nav">
          <h2>Quick Actions</h2>
          <div className="nav-grid">
            <Link to="/admin/products" className="nav-card">
              <FiPackage />
              <span>Manage Products</span>
            </Link>
            <Link to="/admin/orders" className="nav-card">
              <FiShoppingCart />
              <span>Manage Orders</span>
            </Link>
            <Link to="/admin/users" className="nav-card">
              <FiUsers />
              <span>Manage Users</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
