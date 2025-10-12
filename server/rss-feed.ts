
import { db } from './db';
import { products } from '@shared/schema';

export async function generateRSSFeed(): Promise<string> {
  const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
  
  const latestProducts = await db.select()
    .from(products)
    .orderBy(products.createdAt)
    .limit(50);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Al Qadi Portal - Latest Products</title>
    <link>${baseUrl}</link>
    <description>Latest products from Al Qadi Portal</description>
    <language>en</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${latestProducts.map(product => `
    <item>
      <title>${product.nameEn} - ${product.sku}</title>
      <link>${baseUrl}/products/${product.sku}</link>
      <description>${product.descriptionEn || product.nameEn}</description>
      <guid isPermaLink="true">${baseUrl}/products/${product.sku}</guid>
      <pubDate>${product.createdAt?.toUTCString() || new Date().toUTCString()}</pubDate>
      ${product.imageUrl ? `<enclosure url="${baseUrl}${product.imageUrl}" type="image/jpeg"/>` : ''}
    </item>`).join('\n')}
  </channel>
</rss>`;

  return rss;
}
