
import { db } from './db';
import { products } from '@shared/schema';

export async function generateSitemap(): Promise<string> {
  const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
  
  // Get all products for sitemap
  const allProducts = await db.select({
    sku: products.sku,
    category: products.category,
    updatedAt: products.updatedAt,
  }).from(products);

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/catalog', priority: '0.9', changefreq: 'daily' },
  ];

  // Generate category pages
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  const categoryPages = categories.map(cat => ({
    url: `/catalog/${encodeURIComponent(cat!)}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  // Generate product pages
  const productPages = allProducts.map(product => ({
    url: `/products/${product.sku}`,
    priority: '0.7',
    changefreq: 'weekly',
    lastmod: product.updatedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
  }));

  const allPages = [...staticPages, ...categoryPages, ...productPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
}
