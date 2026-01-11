import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiMinus, FiPlus, FiCheck, FiShare2, FiPercent, FiTag } from 'react-icons/fi';
import { Product, getPriceForQuantity, getSavingsPercentage } from '../types';
import { productApi } from '../services/api';
import { useAuthStore, useCartStore, useWishlistStore } from '../store';
import toast from 'react-hot-toast';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const response = await productApi.getBySlug(slug!);
      setProduct(response.data.data);
    } catch (error) {
      console.error('Failed to load product:', error);
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

  const getImageUrl = (image: string) => {
    if (image.startsWith('http')) return image;
    return `${API_URL}${image}`;
  };

  // Calculate current price based on quantity (tiered pricing)
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    return getPriceForQuantity(product, quantity);
  }, [product, quantity]);

  // Calculate base price (without tier discount)
  const basePrice = useMemo(() => {
    if (!product) return 0;
    return product.discountPrice || product.price;
  }, [product]);

  // Calculate tier savings
  const tierSavings = useMemo(() => {
    if (!product) return 0;
    return getSavingsPercentage(product, quantity);
  }, [product, quantity]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return currentPrice * quantity;
  }, [currentPrice, quantity]);

  // Check if product has tiered pricing
  const hasTieredPricing = useMemo(() => {
    return product?.priceTiers && product.priceTiers.length > 0;
  }, [product]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(product!.id, quantity);
      toast.success('Added to cart!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    try {
      if (isInWishlist(product!.id)) {
        await removeFromWishlist(product!.id);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product!.id);
        toast.success('Added to wishlist!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    }
  };

  // Quick quantity buttons for bulk orders
  const quickQuantities = [10, 20, 50, 100];

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="loading-skeleton">
            <div className="skeleton-gallery" />
            <div className="skeleton-info" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="not-found">
            <h2>Product Not Found</h2>
            <p>The product you're looking for doesn't exist.</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discountPercentage = product.discountPrice 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div className="product-detail-page">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`}>
            {product.category.replace(/_/g, ' ')}
          </Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-layout">
          <div className="product-gallery">
            <div className="main-image">
              <img 
                src={product.images[selectedImage] ? getImageUrl(product.images[selectedImage]) : '/placeholder-product.jpg'} 
                alt={product.name} 
              />
              {discountPercentage > 0 && (
                <span className="discount-badge">-{discountPercentage}%</span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="thumbnails">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={getImageUrl(img)} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-info">
            <span className="category-badge">{product.category.replace(/_/g, ' ')}</span>
            <h1>{product.name}</h1>
            
            {product.brand && <p className="brand">By {product.brand}</p>}
            
            {/* Price Section with Tiered Pricing */}
            <div className="price-section">
              <div className="price-main">
                <span className="price-current">{formatPrice(currentPrice)}</span>
                {currentPrice < basePrice && (
                  <span className="price-original">{formatPrice(basePrice)}</span>
                )}
                {product.discountPrice && currentPrice === basePrice && (
                  <span className="price-original">{formatPrice(product.price)}</span>
                )}
                {(tierSavings > 0 || discountPercentage > 0) && (
                  <span className="discount-text">
                    Save {tierSavings > 0 ? tierSavings : discountPercentage}%
                  </span>
                )}
              </div>
              
              {/* Show per-unit and total price */}
              {quantity > 1 && (
                <div className="price-total">
                  <span className="total-label">Total for {quantity} units:</span>
                  <span className="total-amount">{formatPrice(totalPrice)}</span>
                </div>
              )}
            </div>

            {/* Tiered Pricing Table */}
            {hasTieredPricing && (
              <div className="tiered-pricing-info">
                <div className="tiered-pricing-header">
                  <FiTag className="tier-icon" />
                  <span>Bulk Pricing - Buy More, Save More!</span>
                </div>
                <table className="pricing-table">
                  <thead>
                    <tr>
                      <th>Quantity</th>
                      <th>Price per Unit</th>
                      <th>Discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={quantity < (product.priceTiers![0]?.minQuantity || 10) ? 'active-tier' : ''}>
                      <td>1 - {(product.priceTiers![0]?.minQuantity || 10) - 1} units</td>
                      <td>{formatPrice(basePrice)}</td>
                      <td><span className="base-label">Base Price</span></td>
                    </tr>
                    {product.priceTiers!.map((tier, index) => {
                      const savings = Math.round(((basePrice - tier.price) / basePrice) * 100);
                      const isActive = quantity >= tier.minQuantity && 
                        (tier.maxQuantity === null || quantity <= tier.maxQuantity);
                      
                      return (
                        <tr 
                          key={index} 
                          className={isActive ? 'active-tier' : ''}
                          onClick={() => setQuantity(tier.minQuantity)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            {tier.minQuantity} - {tier.maxQuantity || '∞'} units
                          </td>
                          <td className="tier-price-cell">{formatPrice(tier.price)}</td>
                          <td>
                            <span className="tier-discount">-{savings}% OFF</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="tier-hint">💡 Click on a row to select that quantity</p>
              </div>
            )}

            <p className="description">{product.shortDescription || product.description}</p>

            <div className="stock-info">
              {product.stock > 0 ? (
                <span className="in-stock"><FiCheck /> In Stock ({product.stock} available)</span>
              ) : (
                <span className="out-of-stock">Out of Stock</span>
              )}
            </div>

            {product.stock > 0 && (
              <div className="quantity-section">
                <label>Quantity:</label>
                <div className="quantity-control">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <FiMinus />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.min(Math.max(1, val), product.stock));
                    }}
                    min="1"
                    max={product.stock}
                  />
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <FiPlus />
                  </button>
                </div>
                
                {/* Quick quantity buttons for bulk orders */}
                {hasTieredPricing && (
                  <div className="quick-quantities">
                    {quickQuantities.filter(q => q <= product.stock).map(qty => (
                      <button
                        key={qty}
                        className={`quick-qty-btn ${quantity === qty ? 'active' : ''}`}
                        onClick={() => setQuantity(qty)}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="action-buttons">
              <button 
                className="btn btn-primary btn-lg add-to-cart"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <FiShoppingCart />
                {product.stock === 0 ? 'Out of Stock' : `Add to Cart${quantity > 1 ? ` (${quantity})` : ''}`}
              </button>
              <button 
                className={`btn btn-secondary btn-lg wishlist-btn ${inWishlist ? 'active' : ''}`}
                onClick={handleToggleWishlist}
              >
                <FiHeart />
              </button>
            </div>

            {product.warranty && (
              <div className="warranty-info">
                <strong>Warranty:</strong> {product.warranty}
              </div>
            )}

            <div className="sku-info">
              <strong>SKU:</strong> {product.sku}
            </div>
          </div>
        </div>

        <div className="product-tabs">
          <div className="tab-content">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {product.specifications.length > 0 && (
            <div className="tab-content">
              <h3>Specifications</h3>
              <table className="specs-table">
                <tbody>
                  {product.specifications.map((spec, index) => (
                    <tr key={index}>
                      <td>{spec.key}</td>
                      <td>{spec.value} {spec.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {product.features.length > 0 && (
            <div className="tab-content">
              <h3>Features</h3>
              <ul className="features-list">
                {product.features.map((feature, index) => (
                  <li key={index}><FiCheck /> {feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
