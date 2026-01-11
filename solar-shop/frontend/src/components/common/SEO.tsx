import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
}

const SEO: React.FC<SEOProps> = ({
  title = 'WALKERS - Premium Solar Products',
  description = 'Shop premium solar products at WALKERS. High-efficiency solar panels, hybrid inverters, lithium batteries & accessories. Best prices in India with warranty!',
  keywords = 'solar panels, solar inverters, solar batteries, renewable energy, WALKERS solar',
  image = '/walkers_logo.png',
  url = 'https://walkers.com',
}) => {
  const fullTitle = title.includes('WALKERS') ? title : `${title} | WALKERS`;
  
  useEffect(() => {
    // Update document title
    document.title = fullTitle;
    
    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    // Primary meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Open Graph tags
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    
    // Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', url);
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
    
  }, [fullTitle, description, keywords, image, url]);
  
  // This component doesn't render anything visible
  return null;
};

export default SEO;
