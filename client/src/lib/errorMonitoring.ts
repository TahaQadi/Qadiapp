
interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: number;
  userAgent: string;
  url: string;
}

class ErrorMonitoring {
  private enabled: boolean = false;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize: number = 50;

  constructor() {
    this.enabled = import.meta.env.PROD;
    this.setupGlobalErrorHandler();
    this.setupUnhandledRejectionHandler();
  }

  private setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        component: 'global',
        action: 'window.error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
  }

  private setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'global',
          action: 'unhandledRejection',
        }
      );
    });
  }

  captureError(error: Error, context?: ErrorContext) {
    if (!this.enabled) {
      console.error('[Error Monitoring]', error, context);
      return;
    }

    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.errorQueue.push(report);

    // Limit queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    this.sendErrorReport(report);
  }

  private async sendErrorReport(report: ErrorReport) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.error('[Error Monitoring] Failed to send error report:', error);
    }
  }

  // Get error statistics
  getErrorStats() {
    const errors = this.errorQueue;
    const errorsByType = errors.reduce((acc, error) => {
      const type = error.message.split(':')[0] || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: errors.length,
      byType: errorsByType,
      recent: errors.slice(-10),
    };
  }

  clearQueue() {
    this.errorQueue = [];
  }
}

export const errorMonitoring = new ErrorMonitoring();
