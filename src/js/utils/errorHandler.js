/**
 * LifeSync - Error Handler
 * Centralized error handling
 */

export class ErrorHandler {
  static init() {
    window.addEventListener('error', (event) => {
      this.handle(event.error, 'Global');
      event.preventDefault();
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handle(event.reason, 'Promise');
      event.preventDefault();
    });
  }

  static handle(error, context = 'Unknown') {
    console.error(`[${context}]`, error);

    // User-friendly message
    const message = this.getUserMessage(error);
    if (window.showError) {
      window.showError(message);
    }

    // Log to analytics (future)
    this.logToAnalytics(error, context);
  }

  static getUserMessage(error) {
    if (error?.message?.includes('NetworkError')) {
      return 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.';
    }
    if (error?.message?.includes('IndexedDB')) {
      return 'Veri kaydetme hatası. Sayfayı yenileyin.';
    }
    if (error?.message?.includes('QuotaExceeded')) {
      return 'Depolama alanı doldu. Eski verileri temizleyin.';
    }
    return 'Bir hata oluştu. Lütfen sayfayı yenileyin.';
  }

  static logToAnalytics(error, context) {
    // Future: Send to Sentry, LogRocket, etc.
    const log = {
      timestamp: new Date().toISOString(),
      context,
      message: error?.message || String(error),
      stack: error?.stack
    };
    console.log('Error Log:', log);
  }

  static async tryCatch(fn, fallback = null) {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, fn.name || 'Anonymous');
      return fallback;
    }
  }
}

export default ErrorHandler;
