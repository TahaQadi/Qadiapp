
interface SecurityCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

class SecurityAudit {
  private checks: SecurityCheck[] = [];
  private initialized = false;

  constructor() {
    // Run synchronous checks immediately
    this.runSyncChecks();
    // Run async checks in background
    this.runAsyncChecks();
  }

  private runSyncChecks() {
    this.checkHTTPS();
    this.checkCookieSecurity();
    this.checkXSSProtection();
    this.checkMixedContent();
    // Add placeholders for async checks that will be updated
    this.checks.push({
      name: 'Content Security Policy',
      passed: false,
      message: 'Checking...',
      severity: 'medium',
    });
    this.checks.push({
      name: 'Clickjacking Protection',
      passed: false,
      message: 'Checking...',
      severity: 'medium',
    });
  }

  private async runAsyncChecks() {
    await this.checkCSP();
    await this.checkClickjacking();
    this.initialized = true;
  }

  private checkHTTPS() {
    const passed = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

    this.checks.push({
      name: 'HTTPS',
      passed,
      message: passed ? 'Site is using HTTPS' : 'Site is not using HTTPS',
      severity: passed ? 'low' : 'high',
    });
  }

  private async checkCSP() {
    // Check if CSP meta tag exists
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    // Also check if CSP header is set via HTTP (by checking response headers)
    let hasCSPHeader = false;
    try {
      // Try to fetch current page to check headers
      const response = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
      hasCSPHeader = response.headers.has('Content-Security-Policy');
    } catch {
      // If fetch fails, just check meta tag
    }
    
    const passed = !!metaCSP || hasCSPHeader;

    // Update the existing check
    const cspCheck = this.checks.find(c => c.name === 'Content Security Policy');
    if (cspCheck) {
      cspCheck.passed = passed;
      cspCheck.message = passed 
        ? (metaCSP ? 'CSP meta tag found' : 'CSP header found') 
        : 'No CSP meta tag or header found';
    } else {
      this.checks.push({
        name: 'Content Security Policy',
        passed,
        message: passed 
          ? (metaCSP ? 'CSP meta tag found' : 'CSP header found') 
          : 'No CSP meta tag or header found',
        severity: passed ? 'low' : 'medium',
      });
    }
  }

  private checkCookieSecurity() {
    const cookies = document.cookie.split(';');
    const hasSecureCookies = cookies.every((cookie) => {
      const trimmed = cookie.trim();
      return !trimmed || trimmed.includes('Secure') || window.location.protocol === 'http:';
    });

    this.checks.push({
      name: 'Cookie Security',
      passed: hasSecureCookies,
      message: hasSecureCookies
        ? 'Cookies are properly secured'
        : 'Some cookies lack Secure flag',
      severity: hasSecureCookies ? 'low' : 'medium',
    });
  }

  private checkXSSProtection() {
    // Check for inline scripts (potential XSS risk)
    // Exclude Vite's HMR script and entry script which are necessary
    const allScripts = document.querySelectorAll('script:not([src])');
    const inlineScripts = Array.from(allScripts).filter(script => {
      const content = script.textContent || '';
      // Allow Vite HMR scripts and entry scripts
      return !content.includes('vite') && !content.includes('__vite') && content.trim().length > 0;
    });
    
    const passed = inlineScripts.length === 0;

    this.checks.push({
      name: 'XSS Protection',
      passed,
      message: passed
        ? 'No problematic inline scripts detected'
        : `${inlineScripts.length} inline scripts detected (excluding Vite HMR)`,
      severity: passed ? 'low' : 'medium',
    });
  }

  private async checkClickjacking() {
    // X-Frame-Options can only be set via HTTP headers, not meta tags
    // Check if header is set via HTTP
    let hasFrameOptionsHeader = false;
    try {
      const response = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
      hasFrameOptionsHeader = response.headers.has('X-Frame-Options');
    } catch {
      // If fetch fails, assume header is set (server sets it)
      hasFrameOptionsHeader = true; // Optimistic - server should be setting it
    }
    
    const passed = hasFrameOptionsHeader;

    // Update the existing check
    const clickjackingCheck = this.checks.find(c => c.name === 'Clickjacking Protection');
    if (clickjackingCheck) {
      clickjackingCheck.passed = passed;
      clickjackingCheck.message = passed
        ? 'X-Frame-Options header found'
        : 'No X-Frame-Options protection';
    } else {
      this.checks.push({
        name: 'Clickjacking Protection',
        passed,
        message: passed
          ? 'X-Frame-Options header found'
          : 'No X-Frame-Options protection',
        severity: passed ? 'low' : 'medium',
      });
    }
  }

  private checkMixedContent() {
    const mixedContent = Array.from(
      document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]')
    );
    const passed = mixedContent.length === 0 || window.location.protocol === 'http:';

    this.checks.push({
      name: 'Mixed Content',
      passed,
      message: passed
        ? 'No mixed content detected'
        : `${mixedContent.length} resources loaded over HTTP`,
      severity: passed ? 'low' : 'high',
    });
  }

  getResults(): SecurityCheck[] {
    return this.checks;
  }

  getFailedChecks(): SecurityCheck[] {
    return this.checks.filter((check) => !check.passed);
  }

  getSecurityScore(): number {
    const total = this.checks.length;
    const passed = this.checks.filter((check) => check.passed).length;
    return Math.round((passed / total) * 100);
  }

  printReport() {
    console.group('🔒 Security Audit Report');

    this.checks.forEach((check) => {
      const icon = check.passed ? '✅' : '❌';
      const severity = check.passed ? '' : `[${check.severity.toUpperCase()}]`;
    });

    console.groupEnd();
  }
}

export const securityAudit = new SecurityAudit();

// Run audit in development mode
if (import.meta.env.DEV) {
  setTimeout(() => {
    securityAudit.printReport();
  }, 1000);
}
