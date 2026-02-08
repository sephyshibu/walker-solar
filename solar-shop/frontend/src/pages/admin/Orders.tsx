import React, { useEffect, useState, useRef } from 'react';
import { FiTruck, FiExternalLink, FiX, FiUpload, FiFileText, FiDownload, FiTrash2 } from 'react-icons/fi';
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
  
  // Invoice upload state
  const [invoiceModal, setInvoiceModal] = useState<{ show: boolean; orderId: string; orderNumber: string }>({
    show: false,
    orderId: '',
    orderNumber: ''
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      window.open(url, '_blank');
    }
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

  // Invoice functions
  const openInvoiceModal = (orderId: string, orderNumber: string) => {
    setInvoiceModal({ show: true, orderId, orderNumber });
    setInvoiceFile(null);
  };

  const closeInvoiceModal = () => {
    setInvoiceModal({ show: false, orderId: '', orderNumber: '' });
    setInvoiceFile(null);
  };

  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF, JPG, or PNG file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setInvoiceFile(file);
    }
  };

  const handleUploadInvoice = async () => {
    if (!invoiceFile) {
      toast.error('Please select a file');
      return;
    }

    setUploadingInvoice(true);
    try {
      const formData = new FormData();
      formData.append('invoice', invoiceFile);
      
      await orderApi.uploadInvoice(invoiceModal.orderId, formData);
      toast.success('Invoice uploaded successfully!');
      closeInvoiceModal();
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload invoice');
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleDeleteInvoice = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await orderApi.deleteInvoice(orderId);
      toast.success('Invoice deleted');
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { pending: 'warning', confirmed: 'info', processing: 'info', shipped: 'primary', delivered: 'success', cancelled: 'error' };
    return colors[status] || 'secondary';
  };
// Status flow order (forward only)
const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const getAvailableStatuses = (currentStatus: string) => {
  // If cancelled, no changes allowed
  if (currentStatus === 'cancelled') {
    return [{ value: 'cancelled', label: 'Cancelled' }];
  }
  
  // If delivered, no changes allowed
  if (currentStatus === 'delivered') {
    return [{ value: 'delivered', label: 'Delivered' }];
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const availableStatuses = [];

  // Add current status
  availableStatuses.push({ 
    value: currentStatus, 
    label: currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1) 
  });

  // Add all forward statuses
  for (let i = currentIndex + 1; i < STATUS_ORDER.length; i++) {
    availableStatuses.push({ 
      value: STATUS_ORDER[i], 
      label: STATUS_ORDER[i].charAt(0).toUpperCase() + STATUS_ORDER[i].slice(1) 
    });
  }

  // Always allow cancellation (except for delivered)
  availableStatuses.push({ value: 'cancelled', label: 'Cancelled' });

  return availableStatuses;
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
                <th>Customer Number</th>
                <th>Shipping Address</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Tracking</th>
                <th>Invoice</th>
              
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
<tr key={order.id}>
  {/* 1. Existing Order Number Code */}
  <td><strong>{order.orderNumber}</strong><br/><small>{new Date(order.createdAt).toLocaleDateString()}</small></td>
  
  {/* 2. Existing Customer Name Code */}
  <td>{order.userName}<br/><small>{order.userEmail}</small></td>
  
  {/* 3. FIX: Add style={{ whiteSpace: 'nowrap' }} to keep phone number on one line */}
  <td style={{ whiteSpace: 'nowrap' }}>{order.shippingAddress.phone}</td>
  
  {/* 4. Existing Address Code */}
  <td>{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</td>
  
  {/* 5. Existing Items & Total Code */}
  <td>{order.totalItems}</td>
  <td>{formatPrice(order.totalAmount)}</td>
  
  {/* 6. FIX: Remove the inline 'style' prop from select to restore normal size */}
  <td>
    <select 
      value={order.status} 
      onChange={(e) => handleStatusChange(order.id, e.target.value)}
      className="form-input status-select" // Added a class 'status-select' for specific styling if needed
      // REMOVED THE INLINE STYLE HERE
      disabled={order.status === 'cancelled' || order.status === 'delivered'}
    >
      {getAvailableStatuses(order.status).map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
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
                  <td>
                    {order.tracking ? (
                      order.invoice ? (
                        <div className="invoice-actions">
                          {/* <a 
                            href={order.invoice.url}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-invoice-view"
                            title="View Invoice"
                          >
                            <FiFileText />
                          </a> */}
                          <button 
                            onClick={() => downloadInvoice(
                              order.invoice!.url, 
                              order.invoice!.originalName || `invoice_${order.orderNumber}.pdf`
                            )}
                            className="btn btn-sm btn-invoice-download"
                            title="Download Invoice"
                          >
                            <FiDownload />
                          </button>
                          <button 
                            className="btn btn-sm btn-invoice-delete"
                            onClick={() => handleDeleteInvoice(order.id)}
                            title="Delete Invoice"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-sm btn-upload-invoice"
                          onClick={() => openInvoiceModal(order.id, order.orderNumber)}
                          title="Upload Invoice"
                        >
                          <FiUpload /> Upload
                        </button>
                      )
                    ) : (
                      <span className="invoice-na">-</span>
                    )}
                  </td>
                  {/* <td>{new Date(order.createdAt).toLocaleDateString()}</td> */}
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

      {/* Invoice Upload Modal */}
      {invoiceModal.show && (
        <div className="modal-overlay" onClick={closeInvoiceModal}>
          <div className="modal-content invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Invoice</h2>
              <button className="modal-close" onClick={closeInvoiceModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-order-info">Order: <strong>{invoiceModal.orderNumber}</strong></p>
              
              <div className="invoice-upload-area">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleInvoiceFileChange}
                  className="file-input-hidden"
                  id="invoice-file"
                />
                <label htmlFor="invoice-file" className="invoice-upload-label">
                  {invoiceFile ? (
                    <div className="file-selected">
                      <FiFileText size={24} />
                      <span>{invoiceFile.name}</span>
                      <small>{(invoiceFile.size / 1024).toFixed(1)} KB</small>
                    </div>
                  ) : (
                    <div className="file-placeholder">
                      <FiUpload size={32} />
                      <span>Click to select invoice file</span>
                      <small>PDF, JPG, or PNG (max 10MB)</small>
                    </div>
                  )}
                </label>
              </div>

              <p className="modal-note">
                <FiFileText /> Upload an invoice or bill for the customer to download
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeInvoiceModal}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUploadInvoice}
                disabled={!invoiceFile || uploadingInvoice}
              >
                {uploadingInvoice ? 'Uploading...' : 'Upload Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;