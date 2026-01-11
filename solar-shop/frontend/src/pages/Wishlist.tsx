import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { useWishlistStore, useCartStore, useAuthStore } from '../store';
import toast from 'react-hot-toast';
import './Wishlist.css';

const Wishlist: React.FC = () => {
  const { wishlist, removeFromWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

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

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId);
      toast.success('Added to cart!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      toast.success('Removed from wishlist');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove');
    }
  };

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <h1>My Wishlist</h1>
          <div className="empty-wishlist">
            <FiHeart className="empty-icon" />
            <h3>Your wishlist is empty</h3>
            <p>Save products you love for later</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <h1>My Wishlist ({wishlist.items.length} items)</h1>

        <div className="wishlist-grid">
          {wishlist.items.map((item) => (
            <div key={item.productId} className="wishlist-item">
              <Link to={`/products/${item.productId}`} className="item-image">
                <img src={getImageUrl(item.productImage)} alt={item.productName} />
              </Link>
              <div className="item-info">
                <Link to={`/products/${item.productId}`}>
                  <h3>{item.productName}</h3>
                </Link>
                <p className="item-price">{formatPrice(item.price)}</p>
                <div className="item-actions">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAddToCart(item.productId)}
                  >
                    <FiShoppingCart /> Add to Cart
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm remove-btn"
                    onClick={() => handleRemove(item.productId)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
