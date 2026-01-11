import { Router, Request, Response } from 'express';
import { MongoProductRepository } from '../../infrastructure/database/repositories';

const router = Router();
const productRepository = new MongoProductRepository();

// Generate dynamic sitemap.xml
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://walkers.com';
    
    // Get all active products
    const products = await productRepository.findAll(
      { page: 1, limit: 1000 },
      { status: 'active' as any }
    );

    const currentDate = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/products</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/gallery</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Category Pages -->
  <url>
    <loc>${baseUrl}/products?category=solar_panels</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/products?category=inverters</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/products?category=batteries</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/products?category=charge_controllers</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/products?category=accessories</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Product Pages -->`;

    // Add dynamic product pages
    for (const product of products.data) {
      const productJson = product.toJSON();
      const lastMod = productJson.updatedAt 
        ? new Date(productJson.updatedAt).toISOString().split('T')[0] 
        : currentDate;
      
      sitemap += `
  <url>
    <loc>${baseUrl}/products/${productJson.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>`;
      
      // Add product images
      if (productJson.images && productJson.images.length > 0) {
        for (const image of productJson.images) {
          const imageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
          sitemap += `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${productJson.name}</image:title>
    </image:image>`;
        }
      }
      
      sitemap += `
  </url>`;
    }

    sitemap += `
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Generate robots.txt dynamically
router.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://walkers.com';
  
  const robotsTxt = `# Robots.txt for WALKERS Solar Shop
# ${baseUrl}

User-agent: *
Allow: /
Allow: /products
Allow: /products/*
Allow: /gallery
Allow: /contact

# Disallow admin and private pages
Disallow: /admin
Disallow: /admin/*
Disallow: /profile
Disallow: /orders
Disallow: /checkout
Disallow: /wishlist
Disallow: /cart
Disallow: /login
Disallow: /register

# Disallow API routes
Disallow: /api/

# Crawl delay for politeness
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/api/sitemap.xml
`;

  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

export default router;
