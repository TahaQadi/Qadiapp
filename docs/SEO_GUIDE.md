
# SEO Implementation Guide

## Overview
This application now includes comprehensive SEO optimization with:
- Dynamic meta tags for all pages
- Structured data (Schema.org) markup
- Sitemap generation
- Robots.txt configuration
- Open Graph and Twitter Cards
- Bilingual support (Arabic/English)

## Key Features

### 1. Meta Tags
- **Dynamic titles and descriptions** on every page
- **Keywords optimization** for search engines
- **Canonical URLs** to prevent duplicate content
- **Alternate language links** for bilingual SEO

### 2. Structured Data
- **Organization schema** on landing page
- **Product schema** on product detail pages
- **Breadcrumb navigation** for better indexing

### 3. Sitemap & Robots
- **Auto-generated sitemap** at `/sitemap.xml`
- **Robots.txt** at `/robots.txt`
- Protects admin routes from indexing
- Allows public catalog and product pages

### 4. Social Media Optimization
- **Open Graph tags** for Facebook/LinkedIn
- **Twitter Cards** for Twitter sharing
- **Custom images** for social previews

## How to Use

### Adding SEO to New Pages
```tsx
import { SEO } from "@/components/SEO";

export default function MyPage() {
  return (
    <>
      <SEO
        title="Page Title"
        description="Page description"
        keywords="keyword1, keyword2"
        type="website"
      />
      <div>Your page content</div>
    </>
  );
}
```

### For Private Pages (No Indexing)
```tsx
<SEO
  title="Admin Dashboard"
  noIndex={true}
/>
```

### For Product Pages
```tsx
<SEO
  title={productName}
  description={productDescription}
  type="product"
  structuredData={{
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": productName,
    "sku": productSku,
    // ... other product data
  }}
/>
```

## Configuration

### Base URL
Set the `BASE_URL` environment variable for correct sitemap URLs:
```
BASE_URL=https://your-domain.com
```

### Testing SEO

1. **Sitemap**: Visit `/sitemap.xml`
2. **Robots**: Visit `/robots.txt`
3. **Meta Tags**: Use browser DevTools or view page source
4. **Structured Data**: Use Google's Rich Results Test
5. **Social Cards**: Use Twitter Card Validator or Facebook Debugger

## Best Practices

1. **Unique Titles**: Each page should have a unique, descriptive title
2. **Meta Descriptions**: Keep under 160 characters
3. **Keywords**: Use relevant, specific keywords (avoid stuffing)
4. **Images**: Always include alt text and use optimized images
5. **URLs**: Keep clean, descriptive, and SEO-friendly
6. **Content**: Ensure bilingual content is properly marked

## Advanced Features

### Rich Snippets
- **Product Schema**: Includes pricing, availability, ratings
- **Breadcrumb Navigation**: Structured breadcrumbs for better indexing
- **Organization Schema**: Company info on all pages

### Social Media Optimization
- **Dynamic Meta Tags API**: `/api/meta-tags/product/:sku` for social crawlers
- **Open Graph Images**: Automatic product images for social sharing
- **Twitter Cards**: Large image cards for product pages

### Performance Optimization
- **Preconnect**: DNS prefetch for fonts and external resources
- **Image Optimization**: WebP format with lazy loading
- **Sitemap Priority**: Strategic page importance weighting

## Monitoring

Track your SEO performance with:
- **Google Search Console**: Monitor indexing and search performance
- **Google Analytics**: Track user behavior and conversions
- **Bing Webmaster Tools**: Additional search engine visibility
- **Rich Results Test**: Validate structured data

Submit your sitemap to search engines:
- Google: https://search.google.com/search-console
- Bing: https://www.bing.com/webmasters

### Key Metrics to Monitor
1. **Core Web Vitals**: LCP, FID, CLS scores
2. **Mobile Usability**: Mobile-first indexing compliance
3. **Structured Data Errors**: Schema.org validation
4. **Crawl Stats**: Crawl budget and efficiency
5. **Index Coverage**: Pages successfully indexed

## Additional SEO Features

### RSS Feed
- Product feed available at `/feed.xml`
- Automatically includes latest 50 products
- Includes product images and descriptions

### Image Sitemap
- Images included in sitemap.xml with proper tags
- Enhanced discoverability in Google Images
- Product images with multilingual captions

### FAQ Structured Data
- Bilingual FAQ schema for better snippet visibility
- Covers common customer questions
- Improves click-through rates from search results

### Sitelinks Search Box
- WebSite schema enables Google sitelinks search
- Direct product search from search results
- Enhanced brand presence in SERPs

### Performance Optimizations
- Preloaded critical images (logo)
- Language alternates properly defined
- Mobile-optimized meta tags
