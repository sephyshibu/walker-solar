import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiPlus, FiTrash2, FiUpload, FiArrowLeft, FiDollarSign, FiImage } from 'react-icons/fi';
import { productApi, categoryApi } from '../../services/api';
import { Product } from '../../types';
import toast from 'react-hot-toast';
import './Admin.css';
import './AddProduct.css';
interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}
const categories = [
  { value: 'solar_panels', label: 'Solar Panels' },
  { value: 'inverters', label: 'Inverters' },
  { value: 'batteries', label: 'Batteries' },
  { value: 'charge_controllers', label: 'Charge Controllers' },
  { value: 'mounting_systems', label: 'Mounting Systems' },
  { value: 'cables_connectors', label: 'Cables & Connectors' },
  { value: 'accessories', label: 'Accessories' },
];

const gstRateOptions = [
  { value: 0, label: 'No GST (0%)' },
  { value: 5, label: 'GST 5%' },
  { value: 12, label: 'GST 12%' },
  { value: 18, label: 'GST 18%' },
  { value: 28, label: 'GST 28%' },
];

interface Specification {
  key: string;
  value: string;
  unit?: string;
}

interface PriceTier {
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
}

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
const [categoriesLoading, setCategoriesLoading] = useState(true);
  // New images to upload
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  
  // Existing images from the product
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: 'solar_panels',
    price: '',
    discountPrice: '',
    gstRate: '18',
    stock: '',
    sku: '',
    brand: '',
    warranty: '',
    isFeatured: false,
  });

  const [specifications, setSpecifications] = useState<Specification[]>([
    { key: '', value: '', unit: '' }
  ]);
  
  const [features, setFeatures] = useState<string[]>(['']);

  // Tiered pricing state
  const [enableTieredPricing, setEnableTieredPricing] = useState(false);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([
    { minQuantity: 10, maxQuantity: 19, price: 0 },
    { minQuantity: 20, maxQuantity: 49, price: 0 },
    { minQuantity: 50, maxQuantity: null, price: 0 }
  ]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch product data on mount
  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Fetch categories on mount
useEffect(() => {
  const loadCategories = async () => {
    try {
      const response = await categoryApi.getActive();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };
  loadCategories();
}, []);

  const fetchProduct = async () => {
    try {
      setFetching(true);
      const response = await productApi.getById(id!);
      const productData: Product = response.data.data;
      setProduct(productData);
      
      // Populate form data
      setFormData({
        name: productData.name,
        description: productData.description,
        shortDescription: productData.shortDescription || '',
        category: productData.category,
        price: productData.price.toString(),
        discountPrice: productData.discountPrice?.toString() || '',
        gstRate: (productData.gstRate ?? 18).toString(),
        stock: productData.stock.toString(),
        sku: productData.sku,
        brand: productData.brand || '',
        warranty: productData.warranty || '',
        isFeatured: productData.isFeatured,
      });

      // Populate existing images
      setExistingImages(productData.images || []);

      // Populate specifications
      if (productData.specifications && productData.specifications.length > 0) {
        setSpecifications(productData.specifications);
      }

      // Populate features
      if (productData.features && productData.features.length > 0) {
        setFeatures(productData.features);
      }

      // Populate price tiers
      if (productData.priceTiers && productData.priceTiers.length > 0) {
        setEnableTieredPricing(true);
        setPriceTiers(productData.priceTiers);
      }
    } catch (error: any) {
      toast.error('Failed to load product');
      navigate('/admin/products');
    } finally {
      setFetching(false);
    }
  };

  const getImageUrl = (image: string) => {
    if (image.startsWith('http')) return image;
    return `${API_URL}${image}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value, type } = e.target;
  if (type === 'checkbox') {
    setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
  } else {
    setFormData({ ...formData, [name]: value });
  }
};

// Add this new function to handle stock changes with auto status update
const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newStock = parseInt(e.target.value) || 0;
  setFormData({ ...formData, stock: e.target.value });
  
  // Auto-convert out_of_stock to active when stock > 0
  if (product && product.status === 'out_of_stock' && newStock > 0) {
    toast.success('Stock added! Product will be set to active.');
  }
};

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length - imagesToDelete.length + newImages.length + files.length;
    
    if (totalImages > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    setNewImages([...newImages, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (imageUrl: string) => {
    setImagesToDelete([...imagesToDelete, imageUrl]);
    setExistingImages(existingImages.filter(img => img !== imageUrl));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const handleSpecificationChange = (index: number, field: keyof Specification, value: string) => {
    const updated = [...specifications];
    updated[index] = { ...updated[index], [field]: value };
    setSpecifications(updated);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '', unit: '' }]);
  };

  const removeSpecification = (index: number) => {
    if (specifications.length > 1) {
      setSpecifications(specifications.filter((_, i) => i !== index));
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index: number) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };

  // Price tier handlers
  const handlePriceTierChange = (index: number, field: keyof PriceTier, value: string) => {
    const updated = [...priceTiers];
    if (field === 'maxQuantity') {
      updated[index] = { ...updated[index], [field]: value === '' ? null : parseInt(value) };
    } else {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    }
    setPriceTiers(updated);
  };

  const addPriceTier = () => {
    const lastTier = priceTiers[priceTiers.length - 1];
    const newMin = lastTier ? (lastTier.maxQuantity || lastTier.minQuantity) + 1 : 1;
    setPriceTiers([...priceTiers, { minQuantity: newMin, maxQuantity: null, price: 0 }]);
  };

  const removePriceTier = (index: number) => {
    if (priceTiers.length > 1) {
      setPriceTiers(priceTiers.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
     if (!formData.name || !formData.description || !formData.price || !formData.stock || !formData.sku) {
    toast.error('Please fill in all required fields');
    return;
  }

  // Validate discount price must be less than retail price
  if (formData.discountPrice) {
    const retailPrice = parseFloat(formData.price);
    const discountPrice = parseFloat(formData.discountPrice);
    
    if (discountPrice >= retailPrice) {
      toast.error('Discount price must be less than retail price');
      return;
    }
  }

  setLoading(true);
    try {
      const submitData = new FormData();
      
      // Add basic fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('shortDescription', formData.shortDescription);
      submitData.append('category', formData.category);
      submitData.append('price', formData.price);
      if (formData.discountPrice) {
      submitData.append('discountPrice', formData.discountPrice);
    } else {
      submitData.append('discountPrice', ''); // Clear discount price if empty
    }
      submitData.append('gstRate', formData.gstRate);
      submitData.append('stock', formData.stock);
      submitData.append('sku', formData.sku.toUpperCase());
      if (formData.brand) submitData.append('brand', formData.brand);
      if (formData.warranty) submitData.append('warranty', formData.warranty);
      submitData.append('isFeatured', String(formData.isFeatured));
      
      const newStock = parseInt(formData.stock) || 0;
    if (product && product.status === 'out_of_stock' && newStock > 0) {
      submitData.append('status', 'active');
    }
      // Add specifications (filter empty ones)
      const validSpecs = specifications.filter(s => s.key && s.value);
      submitData.append('specifications', JSON.stringify(validSpecs));

      // Add features (filter empty ones)
      const validFeatures = features.filter(f => f.trim());
      submitData.append('features', JSON.stringify(validFeatures));

      // Add price tiers if enabled
      if (enableTieredPricing) {
        const validTiers = priceTiers.filter(t => t.minQuantity > 0 && t.price > 0);
        submitData.append('priceTiers', JSON.stringify(validTiers));
      } else {
        submitData.append('priceTiers', JSON.stringify([]));
      }

      // Add existing images that weren't deleted
      const keptImages = existingImages.filter(img => !imagesToDelete.includes(img));
      submitData.append('existingImages', JSON.stringify(keptImages));

      // Add images to delete
      submitData.append('imagesToDelete', JSON.stringify(imagesToDelete));

      // Add new images
      newImages.forEach(image => {
        submitData.append('images', image);
      });

      await productApi.update(id!, submitData);
      
      toast.success('Product updated successfully!');
      navigate('/admin/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="error-state">
            <p>Product not found</p>
            <button className="btn btn-primary" onClick={() => navigate('/admin/products')}>
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-toolbar">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/products')}>
            <FiArrowLeft /> Back to Products
          </button>
          <h1>Edit Product</h1>
        </div>

        <form onSubmit={handleSubmit} className="add-product-form">
          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., 400W Monocrystalline Solar Panel"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                name="category"
                className="form-input"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={categoriesLoading}
              >
                {categoriesLoading ? (
                  <option value="">Loading categories...</option>
                ) : categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map(cat => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))
                )}
              </select>
              </div>
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input
                  type="text"
                  name="sku"
                  className="form-input"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="e.g., SP-MONO-400"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Short Description</label>
              <input
                type="text"
                name="shortDescription"
                className="form-input"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="Brief description for product cards"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Description *</label>
              <textarea
                name="description"
                className="form-input form-textarea"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed product description..."
                rows={5}
                required
              />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="form-section">
            <h2>Pricing & Stock</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Base Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  className="form-input"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Retail Price (₹)</label>
                <input
                  type="number"
                  name="discountPrice"
                  className="form-input"
                  value={formData.discountPrice}
                  onChange={handleChange}
                  placeholder="Leave empty if no discount"
                  min="0"
                  step="0.01"
                />
                {formData.discountPrice && formData.price && parseFloat(formData.discountPrice) >= parseFloat(formData.price) && (
    <small className="error-text">Discount price must be less than retail price</small>
  )}
              </div>
              <div className="form-group">
                <label className="form-label">GST Rate *</label>
                <select
                  name="gstRate"
                  className="form-input"
                  value={formData.gstRate}
                  onChange={handleChange}
                  required
                >
                  {gstRateOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Stock Quantity *</label>
                 <input
                type="number"
                name="stock"
                className="form-input"
                value={formData.stock}
                onChange={handleStockChange}
                placeholder="Available quantity"
                min="0"
                required
              />
              {product && product.status === 'out_of_stock' && parseInt(formData.stock) > 0 && (
                <small className="success-text">✓ Product will be set to active after save</small>
              )}
              </div>
            </div>

            {/* Tiered Pricing Toggle */}
            <div className="form-group checkbox-group" style={{ marginTop: '1.5rem' }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={enableTieredPricing}
                  onChange={(e) => setEnableTieredPricing(e.target.checked)}
                />
                <span className="checkmark"></span>
                <FiDollarSign style={{ marginRight: '0.5rem' }} />
                Enable Quantity-Based Tiered Pricing
              </label>
            </div>

            {/* Tiered Pricing Section */}
            {enableTieredPricing && (
              <div className="tiered-pricing-section">
                <div className="tiered-pricing-header">
                  <h3><FiDollarSign /> Bulk Pricing Tiers</h3>
                  <p className="tiered-pricing-desc">
                    Set different prices based on quantity ordered. Customers will automatically get the best price for their quantity.
                  </p>
                </div>

                <div className="price-tiers-table">
                  <div className="tier-header">
                    <span>Min Qty</span>
                    <span>Max Qty</span>
                    <span>Price (₹)</span>
                    <span>Discount</span>
                    <span></span>
                  </div>
                  
                  {priceTiers.map((tier, index) => {
                    const basePrice = parseFloat(formData.discountPrice || formData.price) || 0;
                    const savings = basePrice > 0 && tier.price > 0 && tier.price < basePrice
                      ? Math.round(((basePrice - tier.price) / basePrice) * 100)
                      : 0;

                    return (
                      <div key={index} className="tier-row">
                        <input
                          type="number"
                          className="form-input tier-input"
                          value={tier.minQuantity || ''}
                          onChange={(e) => handlePriceTierChange(index, 'minQuantity', e.target.value)}
                          placeholder="Min"
                          min="1"
                        />
                        <input
                          type="number"
                          className="form-input tier-input"
                          value={tier.maxQuantity ?? ''}
                          onChange={(e) => handlePriceTierChange(index, 'maxQuantity', e.target.value)}
                          placeholder="∞"
                          min="1"
                        />
                        <input
                          type="number"
                          className="form-input tier-input"
                          value={tier.price || ''}
                          onChange={(e) => handlePriceTierChange(index, 'price', e.target.value)}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                        />
                        <span className={`tier-savings ${savings > 0 ? 'has-savings' : ''}`}>
                          {savings > 0 ? `-${savings}%` : '-'}
                        </span>
                        <button 
                          type="button" 
                          className="btn btn-icon btn-danger"
                          onClick={() => removePriceTier(index)}
                          disabled={priceTiers.length <= 1}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button type="button" className="btn btn-secondary btn-sm" onClick={addPriceTier}>
                  <FiPlus /> Add Price Tier
                </button>

                {/* Preview */}
                {formData.price && (
                  <div className="tier-preview">
                    <h4>Price Preview:</h4>
                    <ul>
                      <li>
                        <span>1-{priceTiers[0]?.minQuantity - 1 || 9} units:</span>
                        <strong>₹{parseFloat(formData.discountPrice || formData.price).toLocaleString()}</strong>
                        <em>(Base price)</em>
                      </li>
                      {priceTiers.filter(t => t.price > 0).map((tier, index) => (
                        <li key={index}>
                          <span>
                            {tier.minQuantity}-{tier.maxQuantity || '∞'} units:
                          </span>
                          <strong>₹{tier.price.toLocaleString()}</strong>
                          {tier.price < parseFloat(formData.discountPrice || formData.price) && (
                            <em className="savings-text">
                              (Save {Math.round(((parseFloat(formData.discountPrice || formData.price) - tier.price) / parseFloat(formData.discountPrice || formData.price)) * 100)}%)
                            </em>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="form-section">
            <h2>Additional Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input
                  type="text"
                  name="brand"
                  className="form-input"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g., Luminous, Tata Power"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Warranty</label>
                <input
                  type="text"
                  name="warranty"
                  className="form-input"
                  value={formData.warranty}
                  onChange={handleChange}
                  placeholder="e.g., 25 years performance warranty"
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                Mark as Featured Product
              </label>
            </div>
          </div>

          {/* Product Images */}
          <div className="form-section">
            <h2>Product Images</h2>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="existing-images-section">
                <h4><FiImage /> Current Images</h4>
                <div className="image-previews">
                  {existingImages.map((image, index) => (
                    <div key={index} className="image-preview existing">
                      <img src={getImageUrl(image)} alt={`Product ${index + 1}`} />
                      <button 
                        type="button" 
                        className="remove-image"
                        onClick={() => removeExistingImage(image)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Upload */}
            <div className="new-images-section">
              <h4><FiUpload /> Add New Images</h4>
              <div className="image-upload-area">
                <input
                  type="file"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={handleNewImageChange}
                  className="file-input"
                />
                <label htmlFor="images" className="upload-label">
                  <FiUpload />
                  <span>Click to upload images</span>
                  <small>Maximum 10 images total, JPG/PNG/WebP</small>
                </label>
              </div>

              {newImagePreviews.length > 0 && (
                <div className="image-previews">
                  {newImagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview new">
                      <img src={preview} alt={`New ${index + 1}`} />
                      <span className="new-badge">NEW</span>
                      <button 
                        type="button" 
                        className="remove-image"
                        onClick={() => removeNewImage(index)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="image-count">
              Total images: {existingImages.length + newImages.length} / 10
            </p>
          </div>

          {/* Specifications */}
          <div className="form-section">
            <h2>Specifications</h2>
            
            {specifications.map((spec, index) => (
              <div key={index} className="spec-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Property (e.g., Power Output)"
                  value={spec.key}
                  onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Value (e.g., 400)"
                  value={spec.value}
                  onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input spec-unit"
                  placeholder="Unit (e.g., W)"
                  value={spec.unit || ''}
                  onChange={(e) => handleSpecificationChange(index, 'unit', e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-icon btn-danger"
                  onClick={() => removeSpecification(index)}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
            
            <button type="button" className="btn btn-secondary btn-sm" onClick={addSpecification}>
              <FiPlus /> Add Specification
            </button>
          </div>

          {/* Features */}
          <div className="form-section">
            <h2>Features</h2>
            
            {features.map((feature, index) => (
              <div key={index} className="feature-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., High efficiency cells with 21% conversion rate"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-icon btn-danger"
                  onClick={() => removeFeature(index)}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
            
            <button type="button" className="btn btn-secondary btn-sm" onClick={addFeature}>
              <FiPlus /> Add Feature
            </button>
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/products')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              <FiSave />
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
