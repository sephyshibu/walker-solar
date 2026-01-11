import React, { useEffect, useState } from 'react';
import { FiTruck, FiExternalLink, FiX } from 'react-icons/fi';
import { Order, CourierService as CourierServiceType } from '../../types';
import { orderApi } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [courierServices, setCourierServices] = useState<CourierServiceType[]>([]);
  const [trackingModal, setTrackingModal] = useState<{ show: boolean; orderId: string; orderNumber: string }>({
    show: false,
    orderId: '',
    orderNumber: ''
  });
  const [trackingData, setTrackingData] = useState({ awbNumber: '', courierService: '' });

  useEffect(() => { 
    loadOrders(); 
    loadCourierServices();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderApi.getAll({ page: 1, limit: 50 });
      setOrders(response.data.data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const loadCourierServices = async () => {
    try {
      const response = await orderApi.getCourierServices();
      setCourierServices(response.data.data);
    } catch (error) { console.error(error); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await orderApi.updateStatus(id, status);
      toast.success('Order status updated');
      loadOrders();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const openTrackingModal = (orderId: string, orderNumber: string) => {
    setTrackingModal({ show: true, orderId, orderNumber });
    setTrackingData({ awbNumber: '', courierService: '' });
  };

  const closeTrackingModal = () => {
    setTrackingModal({ show: false, orderId: '', orderNumber: '' });
    setTrackingData({ awbNumber: '', courierService: '' });
  };

  const handleAddTracking = async () => {
    if (!trackingData.awbNumber || !trackingData.courierService) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await orderApi.addTracking(trackingModal.orderId, trackingData.awbNumber, trackingData.courierService);
      toast.success('Tracking information added! Order status changed to Shipped.');
      closeTrackingModal();
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add tracking');
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { pending: 'warning', confirmed: 'info', processing: 'info', shipped: 'primary', delivered: 'success', cancelled: 'error' };
    return colors[status] || 'secondary';
  };

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-toolbar">
          <h1>Orders ({orders.length})</h1>
        </div>
        
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Tracking</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.orderNumber}</strong></td>
                  <td>{order.userName}<br/><small>{order.userEmail}</small></td>
                  <td>{order.totalItems}</td>
                  <td>{formatPrice(order.totalAmount)}</td>
                  <td>
                    <select 
                      value={order.status} 
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="form-input"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    {order.tracking ? (
                      <div className="tracking-info-cell">
                        <span className="tracking-awb-badge">{order.tracking.awbNumber}</span>
                        <a 
                          href={order.tracking.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="tracking-link"
                          title="Track shipment"
                        >
                          <FiExternalLink />
                        </a>
                      </div>
                    ) : (
                      <button 
                        className="btn btn-sm btn-add-tracking"
                        onClick={() => openTrackingModal(order.id, order.orderNumber)}
                        disabled={order.status === 'cancelled' || order.status === 'delivered'}
                      >
                        <FiTruck /> Add AWB
                      </button>
                    )}
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tracking Modal */}
      {trackingModal.show && (
        <div className="modal-overlay" onClick={closeTrackingModal}>
          <div className="modal-content tracking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Tracking Information</h2>
              <button className="modal-close" onClick={closeTrackingModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-order-info">Order: <strong>{trackingModal.orderNumber}</strong></p>
              
              <div className="form-group">
                <label className="form-label">Courier Service *</label>
                <select
                  className="form-input"
                  value={trackingData.courierService}
                  onChange={(e) => setTrackingData({ ...trackingData, courierService: e.target.value })}
                >
                  <option value="">Select courier service</option>
                  {courierServices.map((service) => (
                    <option key={service.value} value={service.value}>
                      {service.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">AWB / Tracking Number *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter AWB number"
                  value={trackingData.awbNumber}
                  onChange={(e) => setTrackingData({ ...trackingData, awbNumber: e.target.value })}
                />
              </div>

              <p className="modal-note">
                <FiTruck /> Adding tracking will automatically change order status to "Shipped"
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeTrackingModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddTracking}>
                Add Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
