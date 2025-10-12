
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

  // Get products with images for image sitemap
  const productsWithImages = await db.select({
    sku: products.sku,
    imageUrl: products.imageUrl,
    nameEn: products.nameEn,
    nameAr: products.nameAr,
  }).from(products).where(products.imageUrl);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages.map(page => {
    const productImage = productsWithImages.find(p => page.url.includes(p.sku));
    return `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}${productImage && productImage.imageUrl ? `
    <image:image>
      <image:loc>${baseUrl}${productImage.imageUrl}</image:loc>
      <image:title>${productImage.nameEn}</image:title>
      <image:caption>${productImage.nameAr}</image:caption>
    </image:image>` : ''}
  </url>`;
  }).join('\n')}
</urlset>`;

  return sitemap;
}
