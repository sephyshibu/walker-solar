import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX, FiChevronDown, FiGrid, FiList } from 'react-icons/fi';
import ProductCard from '../components/product/ProductCard';
import SEO from '../components/common/SEO';
import { Product, ProductCategory, PaginatedResponse } from '../types';
import { productApi } from '../services/api';
import './Products.css';

const categoryLabels: Record<string, string> = {
  solar_panels: 'Solar Panels',
  inverters: 'Inverters',
  batteries: 'Batteries',
  charge_controllers: 'Charge Controllers',
  mounting_systems: 'Mounting Systems',
  cables_connectors: 'Cables & Connectors',
  accessories: 'Accessories',
};

const categoryDescriptions: Record<string, string> = {
  solar_panels: 'High-efficiency monocrystalline and polycrystalline solar panels. Best prices with 25-year warranty.',
  inverters: 'Hybrid, on-grid and off-grid solar inverters from top brands. Smart monitoring included.',
  batteries: 'Lithium-ion and lead-acid solar batteries for reliable energy storage.',
  charge_controllers: 'MPPT and PWM charge controllers for optimal solar charging.',
  mounting_systems: 'Rooftop and ground mounting solutions for solar panels.',
  cables_connectors: 'Solar cables, MC4 connectors and wiring accessories.',
  accessories: 'Solar accessories, tools and maintenance equipment.',
};

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  // SEO title and description
  const seoTitle = category 
    ? `${categoryLabels[category]} - Buy Online at Best Prices | WALKERS`
    : search 
    ? `Search Results for "${search}" | WALKERS`
    : 'Solar Products - Panels, Inverters, Batteries | WALKERS';
  
  const seoDescription = category
    ? categoryDescriptions[category] || `Shop ${categoryLabels[category]} at WALKERS. Best prices with warranty.`
    : 'Browse our complete range of solar products. Solar panels, inverters, batteries, charge controllers and accessories at best prices.';

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
      
      if (category) params.category = category;
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
        keywords={`${category ? categoryLabels[category] + ', ' : ''}solar products, buy solar online, WALKERS`}
        url={`https://walkers.com/products${category ? '?category=' + category : ''}`}
      />
      
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1>
              {category ? categoryLabels[category] || 'Products' : 
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
            
            <select 
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', newSortBy);
                handleFilterChange('sortOrder', newSortOrder);
              }}
              className="sort-select"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="viewCount-desc">Most Popular</option>
            </select>
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
                    checked={!category}
                    onChange={() => handleFilterChange('category', '')}
                  />
                  <span>All Categories</span>
                </label>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <label key={key} className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      checked={category === key}
                      onChange={() => handleFilterChange('category', key)}
                    />
                    <span>{label}</span>
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

            {(category || search || minPrice || maxPrice) && (
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
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
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
