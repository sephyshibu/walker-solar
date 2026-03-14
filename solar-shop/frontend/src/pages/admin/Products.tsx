import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiEye, FiEyeOff, FiPlus, FiSearch, FiImage, FiCopy } from 'react-icons/fi';
import { Product } from '../../types';
import { productApi } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';
import './Duplicatemode.css';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const response = await productApi.getAll({ page: 1, limit: 50 });
      setProducts(response.data.data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleBlock = async (id: string, isBlocked: boolean) => {
    try {
      isBlocked ? await productApi.unblock(id) : await productApi.block(id);
      toast.success(isBlocked ? 'Product unblocked' : 'Product blocked');
      loadProducts();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productApi.delete(id);
      toast.success('Product deleted');
      loadProducts();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/products/edit/${id}`);
  };

  const handleCopyListing = (id: string) => {
    navigate(`/admin/products/add?copyFrom=${id}`);
  };

 const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(price);

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-toolbar">
          <h1>Products ({filteredProducts.length})</h1>
          <div className="toolbar-actions">
            <div className="admin-search">
              <FiSearch className="admin-search-icon" />
              <input
                type="text"
                placeholder="Search by name, SKU, or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
            </div>
            <Link to="/admin/products/add" className="btn btn-primary">
              <FiPlus /> Add Product
            </Link>
          </div>
        </div>
        
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="product-thumbnail"
                      />
                    ) : (
                      <div className="product-no-image">
                        <FiImage />
                      </div>
                    )}
                  </td>
                  <td><strong>{product.name}</strong><br/><small>{product.sku}</small></td>
                  <td>{formatPrice(product.discountPrice || product.price)}</td>
                  <td>{product.stock}</td>
                  <td><span className={`badge badge-${product.status === 'active' ? 'success' : 'error'}`}>{product.status}</span></td>
                  <td className="actions">
                    <button className="action-btn edit" onClick={() => handleEdit(product.id)} title="Edit">
                      <FiEdit2 />
                    </button>
                    <button className="action-btn copy" onClick={() => handleCopyListing(product.id)} title="Copy Listing">
                      <FiCopy />
                    </button>
                    <button className="action-btn" onClick={() => handleBlock(product.id, product.status === 'blocked')} title={product.status === 'blocked' ? 'Unblock' : 'Block'}>
                      {product.status === 'blocked' ? <FiEye /> : <FiEyeOff />}
                    </button>
                    <button className="action-btn danger" onClick={() => handleDelete(product.id)} title="Delete">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;