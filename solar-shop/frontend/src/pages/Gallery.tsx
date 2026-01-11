import React, { useEffect, useState } from 'react';
import { GalleryItem, GalleryCategory } from '../types';
import { galleryApi } from '../services/api';
import './Gallery.css';

const categoryLabels: Record<string, string> = {
  installations: 'Installations',
  products: 'Products',
  projects: 'Projects',
  team: 'Our Team',
  events: 'Events',
};

const Gallery: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadGallery();
  }, [activeCategory]);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, limit: 50, isActive: true };
      if (activeCategory !== 'all') {
        params.category = activeCategory;
      }
      const response = await galleryApi.getAll(params);
      setItems(response.data.data.data);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image: string) => {
    if (image.startsWith('http')) return image;
    return `${API_URL}${image}`;
  };

  return (
    <div className="gallery-page">
      <div className="container">
        <div className="gallery-header">
          <h1>Our Gallery</h1>
          <p>Explore our solar installations and projects</p>
        </div>

        <div className="gallery-filters">
          <button
            className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              className={`filter-btn ${activeCategory === key ? 'active' : ''}`}
              onClick={() => setActiveCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="gallery-loading">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="gallery-skeleton" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="no-items">
            <h3>No images found</h3>
            <p>Check back later for more content</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {items.map((item) => (
              <div
                key={item.id}
                className="gallery-item"
                onClick={() => setSelectedItem(item)}
              >
                <img src={getImageUrl(item.imageUrl)} alt={item.title} />
                <div className="item-overlay">
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedItem && (
          <div className="lightbox" onClick={() => setSelectedItem(null)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img src={getImageUrl(selectedItem.imageUrl)} alt={selectedItem.title} />
              <div className="lightbox-info">
                <h3>{selectedItem.title}</h3>
                {selectedItem.description && <p>{selectedItem.description}</p>}
              </div>
              <button className="close-btn" onClick={() => setSelectedItem(null)}>×</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
