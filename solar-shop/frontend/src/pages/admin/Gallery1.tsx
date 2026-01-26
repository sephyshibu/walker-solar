import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiImage, FiFilter } from 'react-icons/fi';
import { galleryApi } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  tags: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const GALLERY_CATEGORIES = [
  { value: 'installations', label: 'Installations' },
  { value: 'products', label: 'Products' },
  { value: 'projects', label: 'Projects' },
  { value: 'team', label: 'Our Team' },
  { value: 'events', label: 'Events' },
];

const Gallery: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'installations',
    tags: '',
    sortOrder: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, [filterCategory]);

  const loadItems = async () => {
    try {
      const params: any = { limit: 100 };
      if (filterCategory) params.category = filterCategory;
      
      const response = await galleryApi.getAll(params);
      setItems(response.data.data.data);
    } catch (error) {
      console.error('Failed to load gallery items:', error);
      toast.error('Failed to load gallery items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: GalleryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        category: item.category,
        tags: item.tags.join(', '),
        sortOrder: item.sortOrder,
      });
      setImagePreview(item.imageUrl);
    } else {
      setEditingItem(null);
      setFormData({ 
        title: '', 
        description: '', 
        category: 'installations',
        tags: '',
        sortOrder: 0 
      });
      setImagePreview('');
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ 
      title: '', 
      description: '', 
      category: 'installations',
      tags: '',
      sortOrder: 0 
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!editingItem && !imageFile) {
      toast.error('Please select an image');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim()).filter(t => t)));
      submitData.append('sortOrder', formData.sortOrder.toString());
      
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (editingItem) {
        await galleryApi.update(editingItem.id, submitData);
        toast.success('Gallery item updated successfully');
      } else {
        await galleryApi.create(submitData);
        toast.success('Gallery item created successfully');
      }

      handleCloseModal();
      loadItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save gallery item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await galleryApi.toggleActive(id);
      toast.success('Gallery item status updated');
      loadItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await galleryApi.delete(id);
      toast.success('Gallery item deleted successfully');
      loadItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete gallery item');
    }
  };

  const getCategoryLabel = (value: string) => {
    return GALLERY_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="loading">Loading gallery...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-toolbar">
          <h1>Gallery ({items.length})</h1>
          <div className="toolbar-actions">
            <div className="filter-select-wrapper">
              <FiFilter />
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {GALLERY_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <FiPlus /> Add Photo
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="gallery-admin-grid">
          {items.map((item) => (
            <div key={item.id} className={`gallery-admin-card ${!item.isActive ? 'inactive' : ''}`}>
              <div className="gallery-admin-image">
                <img src={item.imageUrl} alt={item.title} />
                {!item.isActive && <div className="inactive-overlay">Inactive</div>}
              </div>
              <div className="gallery-admin-info">
                <h3>{item.title}</h3>
                <span className="gallery-category-badge">{getCategoryLabel(item.category)}</span>
                {item.description && <p className="gallery-desc">{item.description}</p>}
              </div>
              <div className="gallery-admin-actions">
                <button 
                  className="action-btn edit" 
                  onClick={() => handleOpenModal(item)}
                  title="Edit"
                >
                  <FiEdit2 />
                </button>
                <button 
                  className="action-btn" 
                  onClick={() => handleToggleActive(item.id)}
                  title={item.isActive ? 'Deactivate' : 'Activate'}
                >
                  {item.isActive ? <FiEyeOff /> : <FiEye />}
                </button>
                <button 
                  className="action-btn danger" 
                  onClick={() => handleDelete(item.id, item.title)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="no-items-message">
              <FiImage size={48} />
              <p>No gallery items found. Add your first photo!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content gallery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Gallery Item' : 'Add New Photo'}</h2>
              <button className="modal-close" onClick={handleCloseModal} type="button">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Photo {!editingItem && '*'}</label>
                  <div className="gallery-image-upload">
                    <input
                      type="file"
                      id="galleryImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input-hidden"
                    />
                    <label htmlFor="galleryImage" className={`image-upload-label ${imagePreview ? 'has-image' : ''}`}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                      ) : (
                        <div className="image-placeholder">
                          <FiImage />
                          <span>Click to upload photo</span>
                          <small>PNG, JPG, WEBP up to 10MB</small>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Commercial Solar Installation"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    {GALLERY_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the photo"
                    rows={2}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tags</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="residential, rooftop"
                    />
                    <small className="form-hint">Comma separated</small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sort Order</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                    />
                    <small className="form-hint">Lower = first</small>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Photo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;