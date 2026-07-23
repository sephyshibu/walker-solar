import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage,
  FiExternalLink,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
} from 'react-icons/fi';
import { Order, PaginatedResponse } from '../types';
import { orderApi } from '../services/api';
import './Orders.css';

const PAGE_SIZE = 10;

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadOrders = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getMyOrders({ page: targetPage, limit: PAGE_SIZE });
      const paginated: PaginatedResponse<Order> = response.data.data;
      setOrders(paginated.data);
      setTotal(paginated.total ?? paginated.data.length);
      setTotalPages(Math.max(paginated.totalPages ?? 1, 1));
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError("We couldn't load your orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, loadOrders]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

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

  const getCourierLabel = (service?: string) => {
    if (!service) return '';
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
      other: 'Other',
    };
    return labels[service] || service;
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
    } catch (err) {
      console.error('Failed to download invoice:', err);
      window.open(url, '_blank'); // Fallback: open in new tab
    }
  };

  // Windowed page numbers so this stays sane with hundreds of pages
  const getPageNumbers = (): number[] => {
    const delta = 2;
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <h1>My Orders {total > 0 && <span className="orders-count">({total})</span>}</h1>
        </div>

        {loading ? (
          <div className="orders-loading">
            <div className="spinner" />
            <p>Loading your orders&hellip;</p>
          </div>
        ) : error ? (
          <div className="orders-error">
            <FiAlertCircle className="orders-error-icon" />
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => loadOrders(page)}>
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <FiPackage className="empty-icon" />
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here</p>
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
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
                      <td className="col-order" data-label="Order">
                        <span className="order-number">{order.orderNumber}</span>
                        <span className="order-date">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      <td className="col-items" data-label="Items">
                        {order.totalItems}
                      </td>

                      <td className="col-total" data-label="Total">
                        {formatPrice(order.totalAmount)}
                      </td>

                      <td className="col-status" data-label="Status">
                        <span className={`badge badge-${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      <td className="col-tracking" data-label="Tracking">
                        {order.tracking ? (
                          <a
                            href={order.tracking.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tracking-link"
                            title={getCourierLabel(order.tracking.courierService)}
                          >
                            {order.tracking.awbNumber}
                            <FiExternalLink />
                          </a>
                        ) : (
                          <span className="text-muted">&mdash;</span>
                        )}
                      </td>

                      <td className="col-invoice" data-label="Invoice">
                        {order.invoice ? (
                          <button
                            onClick={() =>
                              downloadInvoice(
                                order.invoice!.url,
                                order.invoice!.originalName || `invoice_${order.orderNumber}.pdf`
                              )
                            }
                            className="btn-invoice"
                          >
                            <FiDownload /> Download
                          </button>
                        ) : (
                          <span className="text-muted">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  <FiChevronLeft />
                </button>

                {pageNumbers[0] > 1 && (
                  <>
                    <button className="pagination-btn" onClick={() => setPage(1)}>
                      1
                    </button>
                    {pageNumbers[0] > 2 && <span className="pagination-ellipsis">&hellip;</span>}
                  </>
                )}

                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    className={`pagination-btn ${num === page ? 'active' : ''}`}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                      <span className="pagination-ellipsis">&hellip;</span>
                    )}
                    <button className="pagination-btn" onClick={() => setPage(totalPages)}>
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;