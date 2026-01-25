import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiTruck, FiExternalLink, FiFileText, FiDownload } from 'react-icons/fi';
import { Order } from '../types';
import { orderApi } from '../services/api';
import './Orders.css';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderApi.getMyOrders({ page: 1, limit: 20 });
      setOrders(response.data.data.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'secondary';
  };

  const downloadInvoice = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const getCourierLabel = (service: string) => {
    const labels: Record<string, string> = {
      delhivery: 'Delhivery',
      bluedart: 'Blue Dart',
      dtdc: 'DTDC',
      ecom_express: 'Ecom Express',
      xpressbees: 'XpressBees',
      shadowfax: 'Shadowfax',
      india_post: 'India Post',
      professional_courier: 'Professional Courier',
      fedex: 'FedEx',
      dhl: 'DHL',
      other: 'Other'
    };
    return labels[service] || service;
  };

  return (
    <div className="orders-page">
      <div className="container">
        <h1>My Orders</h1>

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <FiPackage className="empty-icon" />
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    <span className="order-number">{order.orderNumber}</span>
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`badge badge-${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-items">
                  {order.items.slice(0, 3).map((item, index) => (
                    <span key={index}>{item.productName}</span>
                  ))}
                  {order.items.length > 3 && (
                    <span>+{order.items.length - 3} more</span>
                  )}
                </div>
                
                {/* Tracking Info */}
                {order.tracking && (
                  <div className="order-tracking">
                    <FiTruck className="tracking-icon" />
                    <div className="tracking-details">
                      <span className="tracking-courier">{getCourierLabel(order.tracking.courierService)}</span>
                      <span className="tracking-awb">AWB: {order.tracking.awbNumber}</span>
                    </div>
                    <a 
                      href={order.tracking.trackingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-track"
                    >
                      <FiExternalLink />
                      Track Order
                    </a>
                  </div>
                )}

                {/* Invoice Download */}
                {order.invoice && (
                  <div className="order-invoice">
                    <FiFileText className="invoice-icon" />
                    <span className="invoice-label">Invoice Available</span>
                    <button 
                      onClick={() => downloadInvoice(
                        order.invoice!.url, 
                        order.invoice!.originalName || `invoice_${order.orderNumber}.pdf`
                      )}
                      className="btn btn-sm btn-download-invoice"
                    >
                      <FiDownload />
                      Download Invoice
                    </button>
                  </div>
                )}

                <div className="order-footer">
                  <span className="order-total">{formatPrice(order.totalAmount)}</span>
                  <span className="order-items-count">{order.totalItems} items</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
