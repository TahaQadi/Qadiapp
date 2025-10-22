
export function getBundleStats() {
  if (typeof window === 'undefined') return null;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

  const scriptSizes = scripts.map((script) => ({
    src: (script as HTMLScriptElement).src,
    type: 'script',
  }));

  const styleSizes = styles.map((style) => ({
    href: (style as HTMLLinkElement).href,
    type: 'style',
  }));

  return {
    scripts: scriptSizes,
    styles: styleSizes,
    total: scriptSizes.length + styleSizes.length,
  };
}

export function logBundleStats() {
  const stats = getBundleStats();
  if (!stats) return;

  console.group('📦 Bundle Statistics');
  console.log(`Total Resources: ${stats.total}`);
  console.log(`Scripts: ${stats.scripts.length}`);
  console.log(`Styles: ${stats.styles.length}`);
  console.groupEnd();
}

// Run on load in development
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(logBundleStats, 1000);
  });
}
