
interface SecurityCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

class SecurityAudit {
  private checks: SecurityCheck[] = [];

  constructor() {
    this.runAudit();
  }

  private runAudit() {
    this.checkHTTPS();
    this.checkCSP();
    this.checkCookieSecurity();
    this.checkXSSProtection();
    this.checkClickjacking();
    this.checkMixedContent();
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

  private checkCSP() {
    // Check if CSP headers are set (can't directly check headers from client)
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const passed = !!metaCSP;

    this.checks.push({
      name: 'Content Security Policy',
      passed,
      message: passed ? 'CSP meta tag found' : 'No CSP meta tag found',
      severity: passed ? 'low' : 'medium',
    });
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
    const inlineScripts = document.querySelectorAll('script:not([src])');
    const passed = inlineScripts.length === 0;

    this.checks.push({
      name: 'XSS Protection',
      passed,
      message: passed
        ? 'No inline scripts detected'
        : `${inlineScripts.length} inline scripts detected`,
      severity: passed ? 'low' : 'medium',
    });
  }

  private checkClickjacking() {
    const frameOptions = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    const passed = !!frameOptions;

    this.checks.push({
      name: 'Clickjacking Protection',
      passed,
      message: passed
        ? 'X-Frame-Options protection enabled'
        : 'No X-Frame-Options protection',
      severity: passed ? 'low' : 'medium',
    });
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
