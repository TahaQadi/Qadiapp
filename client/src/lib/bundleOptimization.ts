
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

export function getPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) return null;

  const perfData = window.performance.timing;
  const navigationStart = perfData.navigationStart;

  return {
    // Page Load Metrics
    domContentLoaded: perfData.domContentLoadedEventEnd - navigationStart,
    loadComplete: perfData.loadEventEnd - navigationStart,
    
    // Network Metrics
    dns: perfData.domainLookupEnd - perfData.domainLookupStart,
    tcp: perfData.connectEnd - perfData.connectStart,
    request: perfData.responseStart - perfData.requestStart,
    response: perfData.responseEnd - perfData.responseStart,
    
    // Render Metrics
    domProcessing: perfData.domComplete - perfData.domLoading,
    
    // Total Time to Interactive (rough estimate)
    tti: perfData.domInteractive - navigationStart,
  };
}

export function logBundleStats() {
  const stats = getBundleStats();
  const perf = getPerformanceMetrics();
  
  if (!stats) return;

  console.group('📦 Bundle & Performance Statistics');
  console.log(`Total Resources: ${stats.total}`);
  console.log(`Scripts: ${stats.scripts.length}`);
  console.log(`Styles: ${stats.styles.length}`);
  
  if (perf) {
    console.group('⚡ Performance Metrics');
    console.log(`DOM Content Loaded: ${perf.domContentLoaded}ms`);
    console.log(`Page Load Complete: ${perf.loadComplete}ms`);
    console.log(`Time to Interactive: ${perf.tti}ms`);
    console.log(`DNS Lookup: ${perf.dns}ms`);
    console.log(`TCP Connection: ${perf.tcp}ms`);
    console.log(`Request Time: ${perf.request}ms`);
    console.log(`Response Time: ${perf.response}ms`);
    console.log(`DOM Processing: ${perf.domProcessing}ms`);
    console.groupEnd();
  }
  
  console.groupEnd();
}

export function trackBundleSize() {
  if (typeof window === 'undefined' || !window.performance) return;

  // Track resource sizes using Resource Timing API
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  let totalTransferSize = 0;
  let jsSize = 0;
  let cssSize = 0;
  let imageSize = 0;
  
  resources.forEach((resource) => {
    const size = resource.transferSize || 0;
    totalTransferSize += size;
    
    if (resource.name.endsWith('.js')) {
      jsSize += size;
    } else if (resource.name.endsWith('.css')) {
      cssSize += size;
    } else if (resource.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
      imageSize += size;
    }
  });
  
  console.group('📊 Resource Size Analysis');
  console.log(`Total Transfer Size: ${(totalTransferSize / 1024).toFixed(2)} KB`);
  console.log(`JavaScript: ${(jsSize / 1024).toFixed(2)} KB`);
  console.log(`CSS: ${(cssSize / 1024).toFixed(2)} KB`);
  console.log(`Images: ${(imageSize / 1024).toFixed(2)} KB`);
  console.groupEnd();
}

// Run on load in development
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      logBundleStats();
      trackBundleSize();
    }, 1000);
  });
}
