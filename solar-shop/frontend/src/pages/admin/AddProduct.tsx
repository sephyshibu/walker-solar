import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiPlus, FiTrash2, FiUpload, FiArrowLeft, FiDollarSign } from 'react-icons/fi';
import { productApi, categoryApi } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';
import './AddProduct.css';

interface Category {
  id: string; // Ensure your backend sends 'id' or '_id'
  name: string;
  slug: string;
}

// Keep static options for things that don't come from DB
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

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: '', // Initialize empty, will be set after categories load
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

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getActive();
        const categoryList = response.data.data;
        setCategories(categoryList);
        
        // FIX 1: Set default category to the first available ID (not slug)
        if (categoryList.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            category: categoryList[0].id 
          }));
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    setImages([...images, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
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
 // Price tier handlers
const handlePriceTierChange = (index: number, field: keyof PriceTier, value: string) => {
  const updated = [...priceTiers];

  if (field === 'price') {
    updated[index].price = parseFloat(value) || 0;
  } 
  else if (field === 'minQuantity') {
    // Only allow changing min quantity for the very first tier
    if (index === 0) {
      updated[index].minQuantity = parseInt(value) || 1;
    }
  } 
  else if (field === 'maxQuantity') {
    const newVal = value === '' ? null : parseInt(value);
    updated[index].maxQuantity = newVal;

    // AUTOMATION: If we change Max, automatically set the Next Tier's Min to Max + 1
    if (index < updated.length - 1 && newVal !== null) {
      updated[index + 1].minQuantity = newVal + 1;
    }
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

    // Validate discount price
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
      
      // Append basic fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('shortDescription', formData.shortDescription);
      
      // CRITICAL: This now sends the ID, not the slug/name
      submitData.append('category', formData.category);
      
      submitData.append('price', formData.price);
      if (formData.discountPrice) submitData.append('discountPrice', formData.discountPrice);
      submitData.append('gstRate', formData.gstRate);
      submitData.append('stock', formData.stock);
      submitData.append('sku', formData.sku.toUpperCase());
      if (formData.brand) submitData.append('brand', formData.brand);
      if (formData.warranty) submitData.append('warranty', formData.warranty);
      submitData.append('isFeatured', String(formData.isFeatured));

      // Append JSON fields
      const validSpecs = specifications.filter(s => s.key && s.value);
      submitData.append('specifications', JSON.stringify(validSpecs));

      const validFeatures = features.filter(f => f.trim());
      submitData.append('features', JSON.stringify(validFeatures));

      if (enableTieredPricing) {
        const validTiers = priceTiers.filter(t => t.minQuantity > 0 && t.price > 0);
        submitData.append('priceTiers', JSON.stringify(validTiers));
      }

      // Append Images
      images.forEach(image => {
        submitData.append('images', image);
      });

      await productApi.create(submitData);
      
      toast.success('Product created successfully!');
      navigate('/admin/products');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-toolbar">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/products')}>
            <FiArrowLeft /> Back to Products
          </button>
          <h1>Add New Product</h1>
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
                      /* FIX 2: Use cat.id as the value. 
                         Ensure your Category interface matches API response (id vs _id) */
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
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
                <label className="form-label">MRP (₹) *</label>
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
              <label className="form-label">Retail Price</label>
              <input
                type="number"
                name="discountPrice"
                className="form-input"
                value={formData.discountPrice}
                onChange={handleChange}
                placeholder="Sale price (must be less than retail)"
                min="0"
                step="0.01"
              />
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
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  required
                />
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
                    Set different prices based on quantity ordered.
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
                    const savings = basePrice > 0 && tier.price > 0 
                      ? Math.round(((basePrice - tier.price) / basePrice) * 100) 
                      : 0;
                    
                    return (
                      <div key={index} className="tier-row">
                        <input
                          type="number"
                          className="form-input tier-input"
                          value={tier.minQuantity}
                          onChange={(e) => handlePriceTierChange(index, 'minQuantity', e.target.value)}
                          placeholder="Min"
                          min="1"
                        />
                        <input
                          type="number"
                          className="form-input tier-input"
                          value={tier.maxQuantity || ''}
                          onChange={(e) => handlePriceTierChange(index, 'maxQuantity', e.target.value)}
                          placeholder="No limit"
                          min={tier.minQuantity}
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
            
            <div className="image-upload-area">
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="file-input"
              />
              <label htmlFor="images" className="upload-label">
                <FiUpload />
                <span>Click to upload images</span>
                <small>Maximum 10 images, JPG/PNG/WebP</small>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button 
                      type="button" 
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="form-section">
            <h2>Specifications</h2>
            
            {specifications.map((spec, index) => (
              <div key={index} className="spec-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Property"
                  value={spec.key}
                  onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Value"
                  value={spec.value}
                  onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input spec-unit"
                  placeholder="Unit"
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
                  placeholder="e.g., High efficiency cells"
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
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;