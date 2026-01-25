import React, { useState,useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck ,FiAlertTriangle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useCartStore, useAuthStore } from '../store';
import { orderApi,productApi } from '../services/api';
import { ShippingAddress } from '../types';
import toast from 'react-hot-toast';
import './Checkout.css';

interface BlockedProduct {
  productId: string;
  productName: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cart, clearCart ,removeFromCart  } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [blockedProducts, setBlockedProducts] = useState<BlockedProduct[]>([]);
  const [validating, setValidating] = useState(true);

  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || 'India',
  });
  const [notes, setNotes] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

   useEffect(() => {
    if (cart && cart.items.length > 0) {
      validateCartItems();
    } else {
      setValidating(false);
    }
  }, [cart]);

    const validateCartItems = async () => {
    setValidating(true);
    const blocked: BlockedProduct[] = [];

    try {
      // Check each product in cart
      for (const item of cart!.items) {
        try {
          const response = await productApi.getById(item.productId);
          const product = response.data.data;
          
          // Check if product is blocked or out of stock
          if (product.status === 'blocked' || product.status === 'out_of_stock') {
            blocked.push({
              productId: item.productId,
              productName: item.productName,
            });
          }
        } catch (error: any) {
          // Product might be deleted
          if (error.response?.status === 404) {
            blocked.push({
              productId: item.productId,
              productName: item.productName,
            });
          }
        }
      }

      setBlockedProducts(blocked);
      
      if (blocked.length > 0) {
        toast.error(`${blocked.length} product(s) in your cart are unavailable`);
      }
    } catch (error) {
      console.error('Error validating cart:', error);
    } finally {
      setValidating(false);
    }
  };
   const handleRemoveBlockedProduct = async (productId: string) => {
    await removeFromCart (productId);
    setBlockedProducts(blockedProducts.filter(p => p.productId !== productId));
    toast.success('Item removed from cart');
  };

  const handleRemoveAllBlocked = async () => {
    for (const product of blockedProducts) {
      await removeFromCart (product.productId);
    }
    setBlockedProducts([]);
    toast.success('All unavailable items removed');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getImageUrl = (image: string) => {
    if (image.startsWith('http')) return image;
    return `${API_URL}${image}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'notes') {
      setNotes(value);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

      // Check for blocked products before submitting
    if (blockedProducts.length > 0) {
      toast.error('Please remove unavailable products from your cart before checkout');
      return;
    }

    setLoading(true);

    try {
      const response = await orderApi.create({
        shippingAddress: formData,
        notes,
      });
      
      const { order, whatsappUrl } = response.data.data;
      setOrderNumber(order.orderNumber);
      setWhatsappUrl(whatsappUrl);
      setOrderComplete(true);
   
      toast.success('Order placed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = async () => {
    window.open(whatsappUrl, '_blank');
       await clearCart()
  };
   if (validating) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="validating-cart">
            <div className="spinner"></div>
            <p>Validating cart items...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-cart">
            <h2>Your cart is empty</h2>
            <p>Add some products before checkout</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="order-success">
            <div className="success-icon">
              <FiCheck />
            </div>
            <h1>Order Placed Successfully!</h1>
            <p>Your order number is: <strong>{orderNumber}</strong></p>
            <p className="whatsapp-info">
              Click the button below to send your order details directly to our WhatsApp.
              This helps us process your order quickly!
            </p>
            <button 
              className="btn btn-whatsapp btn-lg"
              onClick={handleWhatsAppClick}
            >
              <FaWhatsapp />
              Send Order via WhatsApp
            </button>
            <div className="success-actions">
              <Link to="/orders" className="btn btn-secondary">View My Orders</Link>
              <Link to="/products" className="btn btn-outline">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <Link to="/products" className="back-link">
          <FiArrowLeft /> Continue Shopping
        </Link>

        <h1>Checkout</h1>

              {/* Blocked Products Warning */}
        {blockedProducts.length > 0 && (
          <div className="blocked-products-warning">
            <div className="warning-header">
              <FiAlertTriangle />
              <h3>Some products are unavailable</h3>
            </div>
            <p>The following products are not available at the moment. Please remove them and proceed to checkout.</p>
            <ul className="blocked-products-list">
              {blockedProducts.map((product) => (
                <li key={product.productId}>
                  <span>{product.productName}</span>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveBlockedProduct(product.productId)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {blockedProducts.length > 1 && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleRemoveAllBlocked}
              >
                Remove All Unavailable Items
              </button>
            )}
          </div>
        )}

        <div className="checkout-layout">
          <form onSubmit={handleSubmit} className="checkout-form">
            <h2>Shipping Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  className="form-input"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Street Address *</label>
              <input
                type="text"
                name="street"
                className="form-input"
                value={formData.street}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input
                  type="text"
                  name="state"
                  className="form-input"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">ZIP Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  className="form-input"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Country *</label>
                <input
                  type="text"
                  name="country"
                  className="form-input"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Order Notes (Optional)</label>
              <textarea
                name="notes"
                className="form-input form-textarea"
                value={notes}
                onChange={handleChange}
                placeholder="Any special instructions for your order..."
              />
            </div>
          </form>

          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cart.items.map((item) => (
                <div key={item.productId} className="summary-item">
                  <img src={getImageUrl(item.productImage)} alt={item.productName} />
                  <div className="item-info">
                    <h4>{item.productName}</h4>
                    <p>Qty: {item.quantity} × {formatPrice(item.price)}</p>
                    {item.gstRate > 0 && (
                      <p className="item-gst">GST {item.gstRate}%: {formatPrice(item.gstAmount)}</p>
                    )}
                  </div>
                  <span className="item-total">{formatPrice(item.subtotal + item.gstAmount)}</span>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(cart.totalAmount)}</span>
              </div>
              <div className="summary-row gst-row">
                <span>GST</span>
                <span>{formatPrice(cart.totalGST)}</span>
              </div>
              {/* <div className="summary-row">
                <span>Shipping</span>
                <span className="free-shipping">FREE</span>
              </div> */}
              <div className="summary-row total">
                <span>Grand Total</span>
                <span>{formatPrice(cart.grandTotal)}</span>
              </div>
            </div>

            <button 
              type="submit"
              className="btn btn-primary btn-lg place-order-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Placing Order...' : `Place Order - ${formatPrice(cart.grandTotal)}`}
            </button>

            <p className="whatsapp-note">
              <FaWhatsapp />
              After placing your order, you'll be able to send it directly to our WhatsApp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
