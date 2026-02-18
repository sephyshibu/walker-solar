import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSave, FiPlus, FiTrash2, FiUpload, FiArrowLeft, FiDollarSign, FiMove, FiCopy, FiAlertCircle } from 'react-icons/fi';
import { productApi, categoryApi } from '../../services/api';
import { Product } from '../../types';
import toast from 'react-hot-toast';
import ImageCropModal from './imageCropModal';
import './Admin.css';
import './AddProduct.css';
import './DraggableImages.css';
import './Duplicatemode.css';

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
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Copy listing mode
  const searchParams = new URLSearchParams(location.search);
  const copyFromId = searchParams.get('copyFrom');
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [nameChanged, setNameChanged] = useState(false);
  const [skuChanged, setSkuChanged] = useState(false);
  const [originalName, setOriginalName] = useState('');
  const [originalSku, setOriginalSku] = useState('');

  // Image crop state
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [currentCropFile, setCurrentCropFile] = useState<File | null>(null);

  // Drag reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
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

  // Load product data when in copy mode
  useEffect(() => {
    if (copyFromId) {
      loadCopyProduct();
    }
  }, [copyFromId]);

  const loadCopyProduct = async () => {
    if (!copyFromId) return;
    setCopyLoading(true);
    try {
      const response = await productApi.getById(copyFromId);
      const p: Product = response.data.data;
      
      setIsCopyMode(true);
      setOriginalName(p.name);
      setOriginalSku(p.sku);

      setFormData({
        name: `${p.name} (Copy)`,
        description: p.description,
        shortDescription: p.shortDescription || '',
        category: p.category,
        price: p.price.toString(),
        discountPrice: p.discountPrice?.toString() || '',
        gstRate: (p.gstRate ?? 18).toString(),
        stock: p.stock.toString(),
        sku: '',
        brand: p.brand || '',
        warranty: p.warranty || '',
        isFeatured: p.isFeatured,
      });

      if (p.specifications && p.specifications.length > 0) {
        setSpecifications(p.specifications);
      }
      if (p.features && p.features.length > 0) {
        setFeatures(p.features);
      }
      if (p.priceTiers && p.priceTiers.length > 0) {
        setEnableTieredPricing(true);
        setPriceTiers(p.priceTiers);
      }

      toast.success(`Product data loaded from "${p.name}". Change the Name and SKU before saving.`);
    } catch (error) {
      console.error('Failed to load source product:', error);
      toast.error('Failed to load product for copying');
    } finally {
      setCopyLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Track name/SKU changes in copy mode
    if (isCopyMode) {
      if (name === 'name') {
        setNameChanged(value.trim() !== '' && value.trim() !== `${originalName} (Copy)` && value.trim() !== originalName);
      }
      if (name === 'sku') {
        setSkuChanged(value.trim() !== '' && value.trim().toUpperCase() !== originalSku.toUpperCase());
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }
    if (files.length > 0) {
      setCropQueue(files.slice(1));
      setCurrentCropFile(files[0]);
    }
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile: File) => {
    setImages(prev => [...prev, croppedFile]);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(croppedFile);
    if (cropQueue.length > 0) {
      setCurrentCropFile(cropQueue[0]);
      setCropQueue(prev => prev.slice(1));
    } else {
      setCurrentCropFile(null);
    }
  };

  const handleCropCancel = () => {
    if (cropQueue.length > 0) {
      setCurrentCropFile(cropQueue[0]);
      setCropQueue(prev => prev.slice(1));
    } else {
      setCurrentCropFile(null);
    }
  };

  // Drag reorder handlers
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const ri = [...images]; const rp = [...imagePreviews];
      const [mi] = ri.splice(dragIndex, 1); ri.splice(dragOverIndex, 0, mi);
      const [mp] = rp.splice(dragIndex, 1); rp.splice(dragOverIndex, 0, mp);
      setImages(ri); setImagePreviews(rp);
    }
    setDragIndex(null); setDragOverIndex(null);
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
    
    // 0. Copy mode validation: must change name and SKU
    if (isCopyMode) {
      if (!nameChanged) {
        toast.error('Please change the Product Name before saving the copy.');
        return;
      }
      if (!skuChanged) {
        toast.error('Please enter a new unique SKU before saving the copy.');
        return;
      }
    }

    // 1. Standard Validation
    if (!formData.name || !formData.description || !formData.price || !formData.stock || !formData.sku) {
      toast.error('Please fill in all required fields');
      return;
    }

    // 2. Discount Price Validation
    if (formData.discountPrice) {
      const retailPrice = parseFloat(formData.price);
      const discountPrice = parseFloat(formData.discountPrice);
      
      if (discountPrice >= retailPrice) {
        toast.error('Discount price must be less than retail price');
        return;
      }
    }

    // 3. STRICT TIERED PRICING VALIDATION
    if (enableTieredPricing) {
      if (priceTiers.length === 0) {
        toast.error('Please add at least one pricing tier');
        return;
      }

      for (let i = 0; i < priceTiers.length; i++) {
        const tier = priceTiers[i];
        const tierNum = i + 1;

        // Check A: Price is required
        if (tier.price === undefined || tier.price <= 0) {
          toast.error(`Tier ${tierNum}: Please enter a valid price.`);
          return; 
        }

        // Check B: Min Quantity is required
        if (!tier.minQuantity || tier.minQuantity < 1) {
          toast.error(`Tier ${tierNum}: Please enter a valid Min Quantity.`);
          return; 
        }

        // Check C: Max Quantity is NOW MANDATORY for ALL tiers
        if (!tier.maxQuantity) {
          toast.error(`Tier ${tierNum}: Max Quantity is required.`);
          return; 
        }

        // Check D: Logic (Max > Min)
        if (tier.maxQuantity <= tier.minQuantity) {
          toast.error(`Tier ${tierNum}: Max Quantity must be greater than Min Quantity.`);
          return; 
        }
      }
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Append basic fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('shortDescription', formData.shortDescription);
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

      // Append Tiers
      if (enableTieredPricing) {
        submitData.append('priceTiers', JSON.stringify(priceTiers));
      }

      // Append Images
      images.forEach(image => {
        submitData.append('images', image);
      });

      await productApi.create(submitData);
      
      toast.success(isCopyMode ? 'Product duplicated successfully!' : 'Product created successfully!');
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
          <h1>{isCopyMode ? <><FiCopy /> Copy Listing</> : 'Add New Product'}</h1>
        </div>

        {/* Copy Mode Banner */}
        {isCopyMode && (
          <div className="copy-mode-banner">
            <div className="copy-banner-icon"><FiCopy /></div>
            <div className="copy-banner-content">
              <strong>Duplicating: {originalName}</strong>
              <p>All product details have been copied. You <em>must</em> change the <strong>Product Name</strong> and <strong>SKU</strong> before saving.</p>
              <div className="copy-checklist">
                <span className={`copy-check-item ${nameChanged ? 'done' : 'pending'}`}>
                  {nameChanged ? '✓' : '!'} Product Name {nameChanged ? 'changed' : 'needs change'}
                </span>
                <span className={`copy-check-item ${skuChanged ? 'done' : 'pending'}`}>
                  {skuChanged ? '✓' : '!'} SKU {skuChanged ? 'changed' : 'needs change'}
                </span>
              </div>
            </div>
          </div>
        )}

        {copyLoading ? (
          <div className="loading-state"><div className="spinner"></div><p>Loading product data...</p></div>
        ) : (

        <form onSubmit={handleSubmit} className="add-product-form">
          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className={`form-group ${isCopyMode && !nameChanged ? 'copy-highlight' : ''}`}>
              <label className="form-label">Product Name * {isCopyMode && !nameChanged && <span className="copy-field-warning"><FiAlertCircle /> Must change</span>}</label>
              <input
                type="text"
                name="name"
                className={`form-input ${isCopyMode && !nameChanged ? 'copy-input-warning' : ''}`}
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
              <div className={`form-group ${isCopyMode && !skuChanged ? 'copy-highlight' : ''}`}>
                <label className="form-label">SKU * {isCopyMode && !skuChanged && <span className="copy-field-warning"><FiAlertCircle /> Must change</span>}</label>
                <input
                  type="text"
                  name="sku"
                  className={`form-input ${isCopyMode && !skuChanged ? 'copy-input-warning' : ''}`}
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder={isCopyMode ? 'Enter a new unique SKU' : 'e.g., SP-MONO-400'}
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
                          placeholder="Max" // <--- CHANGED from "No Limit" to "Max"
                          min={tier.minQuantity}
                          required // <--- Added HTML5 required attribute for visual cues
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
                  <div 
                    key={index} 
                    className={`image-preview draggable ${dragIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={() => setDragOverIndex(null)}
                  >
                    <div className="drag-handle" title="Drag to reorder"><FiMove /></div>
                    <span className="image-order-badge">{index + 1}</span>
                    {index === 0 && <span className="primary-badge">Primary</span>}
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button type="button" className="remove-image" onClick={() => removeImage(index)}><FiTrash2 /></button>
                  </div>
                ))}
              </div>
            )}
            {imagePreviews.length > 1 && (
              <p className="drag-hint">💡 Drag images to reorder. First image will be the main product photo.</p>
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
            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              disabled={loading || (isCopyMode && (!nameChanged || !skuChanged))}
            >
              {isCopyMode ? <FiCopy /> : <FiSave />}
              {loading ? (isCopyMode ? 'Duplicating...' : 'Creating...') : (isCopyMode ? 'Create Duplicate' : 'Create Product')}
            </button>
          </div>
        </form>
        )}

        {/* Image Crop Modal */}
        {currentCropFile && (
          <ImageCropModal
            imageFile={currentCropFile}
            aspectWidth={1}
            aspectHeight={1}
            outputWidth={800}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
      </div>
    </div>
  );
};

export default AddProduct;