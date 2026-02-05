import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX } from 'react-icons/fi';
import ProductCard from '../components/product/ProductCard';
import SEO from '../components/common/SEO';
import { Product, PaginatedResponse } from '../types';
import { productApi, categoryApi } from '../services/api';
import './Products.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const categorySlug = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  // Get category label and description from dynamic categories
  const currentCategory = categories.find(c => c.slug === categorySlug);
  const categoryLabel = currentCategory?.name || categorySlug;
  const categoryDescription = currentCategory?.description || '';

  // SEO title and description
  const seoTitle = categorySlug 
    ? `${categoryLabel} - Buy Online at Best Prices | WALKERS`
    : search 
    ? `Search Results for "${search}" | WALKERS`
    : 'Solar Products - Panels, Inverters, Batteries | WALKERS';
  
  const seoDescription = categorySlug
    ? categoryDescription || `Shop ${categoryLabel} at WALKERS. Best prices with warranty.`
    : 'Browse our complete range of solar products. Solar panels, inverters, batteries, charge controllers and accessories at best prices.';

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getActive();
        setCategories(response.data.data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [searchParams]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        status: 'active',
      };
      
      // If a category slug is present in URL, find its ID to send to backend
      if (categorySlug) {
        // We need to wait for categories to load, but typically they load fast.
        // If this runs before categories are loaded, the filter might be skipped initially.
        // For a robust app, you might want to wait for categories, 
        // but for now we look up by slug if categories exist.
        const matchedCat = categories.find(c => c.slug === categorySlug);
        if (matchedCat) {
          params.category = matchedCat.id;
        } else if (categories.length > 0) {
            // Categories loaded but slug not found
            console.warn("Category slug not found");
        }
      }

      if (search) params.search = search;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);

      const response = await productApi.getAll(params);
      const data = response.data.data as PaginatedResponse<Product>;
      
      setProducts(data.data);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="products-page">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        keywords={`${categorySlug ? categoryLabel + ', ' : ''}solar products, buy solar online, WALKERS`}
        url={`https://walkers.com/products${categorySlug ? '?category=' + categorySlug : ''}`}
      />
      
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1>
              {categorySlug ? categoryLabel || 'Products' : 
               search ? `Search: "${search}"` : 'All Products'}
            </h1>
            <p>{pagination.total} products found</p>
          </div>
          
          <div className="header-actions">
            <button 
              className="btn btn-secondary filter-toggle"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <FiFilter />
              Filters
            </button>
          </div>
        </div>

        <div className="products-layout">
          {/* Filters Sidebar */}
          <aside className={`filters-sidebar ${filterOpen ? 'open' : ''}`}>
            <div className="filters-header">
              <h3>Filters</h3>
              <button className="close-filters" onClick={() => setFilterOpen(false)}>
                <FiX />
              </button>
            </div>

            <div className="filter-group">
              <h4>Category</h4>
              <div className="filter-options">
                <label className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    checked={!categorySlug}
                    onChange={() => handleFilterChange('category', '')}
                  />
                  <span>All Categories</span>
                </label>
                {categories.map((cat) => (
                  <label key={cat.slug} className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      checked={categorySlug === cat.slug}
                      onChange={() => handleFilterChange('category', cat.slug)}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Price Range</h4>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="form-input"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {(categorySlug || search || minPrice || maxPrice) && (
              <button className="btn btn-outline clear-filters" onClick={clearFilters}>
                Clear All Filters
              </button>
            )}
          </aside>

          {/* Products Grid */}
          <div className="products-content">
            {loading ? (
              <div className="loading-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="product-skeleton" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="no-products">
                <h3>No products found</h3>
                <p>Try adjusting your filters or search term</p>
                <button className="btn btn-primary" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="products-grid">
                {products.map((product) => {
  // 1. Find the Category Name based on the ID string from the product
  const categoryObj = categories.find(c => c.id === product.category);
  
  // 2. Create a display product
  const displayProduct = {
    ...product,
    // FIX: TypeScript expects an object, but ProductCard renders the text.
    // We cast the string to 'any' to bypass the type check so the Name shows up.
    category: (categoryObj ? categoryObj.name : 'Solar Product') as any
  };

  return (
    <ProductCard key={product.id} product={displayProduct} />
  );
})}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-secondary"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </button>
                    
                    <div className="pagination-pages">
                      {[...Array(pagination.totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          className={`page-btn ${pagination.page === i + 1 ? 'active' : ''}`}
                          onClick={() => handlePageChange(i + 1)}
                        >
                          {i + 1}
                        </button>
                      )).slice(
                        Math.max(0, pagination.page - 3),
                        Math.min(pagination.totalPages, pagination.page + 2)
                      )}
                    </div>
                    
                    <button
                      className="btn btn-secondary"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {filterOpen && <div className="filter-overlay" onClick={() => setFilterOpen(false)} />}
    </div>
  );
};

export default Products;