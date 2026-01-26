import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiImage } from 'react-icons/fi';
import { categoryApi } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  productCount: number;
  createdAt: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getAll({ sortBy: 'sortOrder', sortOrder: 'asc' });
      setCategories(response.data.data.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        sortOrder: category.sortOrder,
      });
      setImagePreview(category.image || '');
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', sortOrder: 0 });
      setImagePreview('');
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', sortOrder: 0 });
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
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('sortOrder', formData.sortOrder.toString());
      
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (editingCategory) {
        await categoryApi.update(editingCategory.id, submitData);
        toast.success('Category updated successfully');
      } else {
        await categoryApi.create(submitData);
        toast.success('Category created successfully');
      }

      handleCloseModal();
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await categoryApi.toggleStatus(id);
      toast.success('Category status updated');
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string, name: string, productCount: number) => {
    if (productCount > 0) {
      toast.error(`Cannot delete "${name}". ${productCount} product(s) are using this category.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await categoryApi.delete(id);
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const getImageUrl = (image: string) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return `${API_URL}${image}`;
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="loading">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-toolbar">
          <h1>Categories ({categories.length})</h1>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <FiPlus /> Add Category
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    {category.image ? (
                      <img 
                        src={getImageUrl(category.image)} 
                        alt={category.name}
                        className="category-thumbnail"
                      />
                    ) : (
                      <div className="category-no-image">
                        <FiImage />
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{category.name}</strong>
                    {category.description && (
                      <small className="category-desc">{category.description}</small>
                    )}
                  </td>
                  <td><code>{category.slug}</code></td>
                  <td>{category.productCount}</td>
                  <td>{category.sortOrder}</td>
                  <td>
                    <span className={`badge badge-${category.status === 'active' ? 'success' : 'error'}`}>
                      {category.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="action-btn edit" 
                      onClick={() => handleOpenModal(category)}
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      className="action-btn" 
                      onClick={() => handleToggleStatus(category.id)}
                      title={category.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {category.status === 'active' ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button 
                      className="action-btn danger" 
                      onClick={() => handleDelete(category.id, category.name, category.productCount)}
                      title="Delete"
                      disabled={category.productCount > 0}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center">
                    No categories found. Create your first category!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button className="modal-close" onClick={handleCloseModal} type="button">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Solar Panels"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the category for SEO and display"
                    rows={3}
                  />
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
                  <small className="form-hint">Lower numbers appear first in the menu</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Category Image</label>
                  <div className="category-image-upload">
                    <input
                      type="file"
                      id="categoryImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input-hidden"
                    />
                    <label htmlFor="categoryImage" className={`image-upload-label ${imagePreview ? 'has-image' : ''}`}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                      ) : (
                        <div className="image-placeholder">
                          <FiImage />
                          <span>Click to upload image</span>
                          <small>PNG, JPG up to 5MB</small>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;