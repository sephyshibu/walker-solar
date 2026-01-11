import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiEye } from 'react-icons/fi';
import { Product } from '../../types';
import { useAuthStore, useCartStore, useWishlistStore } from '../../store';
import toast from 'react-hot-toast';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  
  const inWishlist = isInWishlist(product.id);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(product.id);
      toast.success('Added to cart!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    try {
      if (inWishlist) {
        await removeFromWishlist(product.id);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product.id);
        toast.success('Added to wishlist!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    }
  };

  const getImageUrl = (image: string) => {
    if (image.startsWith('http')) return image;
    return `${API_URL}${image}`;
  };

  const discountPercentage = product.discountPrice 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      <div className="product-image">
        <img 
          src={product.images[0] ? getImageUrl(product.images[0]) : '/placeholder-product.jpg'} 
          alt={product.name}
          loading="lazy"
        />
        
        {discountPercentage > 0 && (
          <span className="discount-badge">-{discountPercentage}%</span>
        )}
        
        {product.stock === 0 && (
          <div className="out-of-stock-overlay">
            <span>Out of Stock</span>
          </div>
        )}

        <div className="product-actions">
          <button 
            className={`action-btn ${inWishlist ? 'active' : ''}`}
            onClick={handleToggleWishlist}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <FiHeart />
          </button>
          <button 
            className="action-btn"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            title="Add to cart"
          >
            <FiShoppingCart />
          </button>
          <Link 
            to={`/products/${product.slug}`}
            className="action-btn"
            title="View details"
          >
            <FiEye />
          </Link>
        </div>
      </div>

      <div className="product-info">
        <span className="product-category">
          {product.category.replace(/_/g, ' ')}
        </span>
        <h3 className="product-name">{product.name}</h3>
        
        {product.brand && (
          <span className="product-brand">{product.brand}</span>
        )}

        <div className="product-price">
          {product.discountPrice ? (
            <>
              <span className="price-current">{formatPrice(product.discountPrice)}</span>
              <span className="price-original">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="price-current">{formatPrice(product.price)}</span>
          )}
        </div>

        {product.stock > 0 && product.stock <= 10 && (
          <span className="stock-warning">Only {product.stock} left!</span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
