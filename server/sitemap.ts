import { db } from './db';
import { products } from '@shared/schema';
import { isNotNull } from 'drizzle-orm';

export async function generateSitemap(): Promise<string> {
  const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
  
  // Get all products for sitemap
  const allProducts = await db.select({
    sku: products.sku,
    name: products.name,
    category: products.category,
    mainCategory: products.mainCategory,
  }).from(products);

  const staticPages: Array<{ url: string; priority: string; changefreq: string; lastmod?: string }> = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/catalog', priority: '0.9', changefreq: 'daily' },
  ];

  // Generate category pages
  const categorySet = new Set<string>();
  allProducts.forEach(p => {
    if (p.category) categorySet.add(p.category);
  });
  const categories = Array.from(categorySet);
  const categoryPages: Array<{ url: string; priority: string; changefreq: string; lastmod?: string }> = categories.map(cat => ({
    url: `/catalog/${encodeURIComponent(cat)}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  // Generate product pages
  const productPages: Array<{ url: string; priority: string; changefreq: string; lastmod?: string }> = allProducts.map(product => {
    return {
      url: `/products/${encodeURIComponent(product.sku)}`,
      priority: '0.7',
      changefreq: 'weekly',
      lastmod: new Date().toISOString().split('T')[0],
    };
  });

  const allPages: Array<{ url: string; priority: string; changefreq: string; lastmod?: string }> = [...staticPages, ...categoryPages, ...productPages];

  // Get products with images for image sitemap
  const productsWithImages = await db.select({
    sku: products.sku,
    name: products.name,
    imageUrl: products.imageUrl,
  }).from(products).where(isNotNull(products.imageUrl));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages.map(page => {
    const productImage = productsWithImages.find(p => {
      // Match by SKU instead of slugified name
      return page.url.includes(encodeURIComponent(p.sku));
    });
    return `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}${productImage && productImage.imageUrl ? `
    <image:image>
      <image:loc>${baseUrl}${productImage.imageUrl}</image:loc>
      <image:title>${productImage.name || 'Product'}</image:title>
    </image:image>` : ''}
  </url>`;
  }).join('\n')}
</urlset>`;

  return sitemap;
}
