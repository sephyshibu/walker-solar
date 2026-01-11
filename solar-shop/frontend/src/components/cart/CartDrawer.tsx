import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useCartStore, useUIStore } from '../../store';
import toast from 'react-hot-toast';
import './CartDrawer.css';

const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, loading } = useCartStore();
  const { cartOpen, closeCart } = useUIStore();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      await updateQuantity(productId, quantity);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeFromCart(productId);
      toast.success('Item removed from cart');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove item');
    }
  };

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  if (!cartOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={closeCart} />
      <div className="cart-drawer">
        <div className="cart-header">
          <h2>
            <FiShoppingBag />
            Your Cart
            {cart && cart.totalItems > 0 && (
              <span className="cart-count">({cart.totalItems})</span>
            )}
          </h2>
          <button className="close-btn" onClick={closeCart}>
            <FiX />
          </button>
        </div>

        <div className="cart-content">
          {!cart || cart.items.length === 0 ? (
            <div className="cart-empty">
              <FiShoppingBag className="empty-icon" />
              <h3>Your cart is empty</h3>
              <p>Add some products to get started!</p>
              <Link to="/products" className="btn btn-primary" onClick={closeCart}>
                Browse Products
              </Link>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.items.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <div className="item-image">
                      <img 
                        src={getImageUrl(item.productImage)} 
                        alt={item.productName} 
                      />
                    </div>
                    <div className="item-details">
                      <h4>{item.productName}</h4>
                      <p className="item-price">{formatPrice(item.price)}</p>
                      <div className="item-quantity">
                        <button 
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus />
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        >
                          <FiPlus />
                        </button>
                      </div>
                    </div>
                    <div className="item-actions">
                      <span className="item-subtotal">{formatPrice(item.subtotal)}</span>
                      <button 
                        className="remove-btn"
                        onClick={() => handleRemove(item.productId)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(cart.totalAmount)}</span>
                  </div>
                  <div className="summary-row gst-row">
                    <span>GST</span>
                    <span>{formatPrice(cart.totalGST)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Grand Total</span>
                    <span>{formatPrice(cart.grandTotal)}</span>
                  </div>
                </div>
                <button 
                  className="btn btn-primary btn-lg checkout-btn"
                  onClick={handleCheckout}
                >
                  Checkout - {formatPrice(cart.grandTotal)}
                </button>
                <button 
                  className="btn btn-secondary continue-btn"
                  onClick={closeCart}
                >
                  Continue Shopping
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
