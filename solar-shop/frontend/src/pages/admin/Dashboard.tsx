import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiShoppingCart, FiUsers, FiMail, FiArrowRight, FiTrendingUp } from 'react-icons/fi';
import { productApi, orderApi, adminApi } from '../../services/api';
import './Admin.css';

interface DashboardStats {
  products: { total: number; active: number };
  orders: { total: number; pending: number };
  users: { total: number; active: number };
 
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        productApi.getStats(),
        orderApi.getStats(),
        adminApi.getUserStats(),
       
      ]);

      setStats({
        products: { total: productsRes.data.data.total, active: productsRes.data.data.active },
        orders: { total: ordersRes.data.data.total, pending: ordersRes.data.data.pending },
        users: { total: usersRes.data.data.total, active: usersRes.data.data.active },
       
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
    }
   
  ];

  return (
    <div className="admin-page admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's an overview of your store.</p>
        </div>

        <div className="stats-grid-large">
          {statCards.map((card) => (
            <Link key={card.title} to={card.link} className={`stat-card-large stat-${card.color}`}>
              <div className="stat-card-header">
                <div className={`stat-icon-large stat-icon-${card.color}`}>
                  <card.icon />
                </div>
                <FiArrowRight className="stat-arrow" />
              </div>
              <div className="stat-card-body">
                <span className="stat-value-large">{loading ? '...' : card.value}</span>
                <span className="stat-title-large">{card.title}</span>
              </div>
              <div className="stat-card-footer">
                <span className="stat-subtitle-large">
                  <FiTrendingUp /> {card.subtitle}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;