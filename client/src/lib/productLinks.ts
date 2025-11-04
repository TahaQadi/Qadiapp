/**
 * Utility functions for generating product URLs
 * Uses SKU-based URLs for reliable and unique product identification
 */

/**
 * Generates a product URL from a SKU
 * Handles URL encoding for SKUs with special characters
 * 
 * @param sku - The product SKU (Stock Keeping Unit)
 * @returns The product URL path (e.g., "/products/PROD-123")
 */
export function getProductUrl(sku: string): string {
  if (!sku) {
    return "/products";
  }
  return `/products/${encodeURIComponent(sku)}`;
}

/**
 * Parses a SKU from a product URL
 * Useful for extracting SKU from URL parameters
 * 
 * @param urlPath - The URL path (e.g., "/products/PROD-123")
 * @returns The decoded SKU or null if invalid
 */
export function getSkuFromUrl(urlPath: string): string | null {
  const match = urlPath.match(/^\/products\/(.+)$/);
  if (!match) {
    return null;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
