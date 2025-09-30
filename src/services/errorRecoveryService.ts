import type { AppError } from '../types/common';
import { ErrorType } from '../types/common';
import { store } from '../store';
import { clearError, setError } from '../store/slices/uiSlice';

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  /**
   * Handle an error with automatic recovery strategies
   */
  async handleError(error: AppError, context?: any): Promise<boolean> {
    const errorKey = this.getErrorKey(error, context);
    const attempts = this.retryAttempts.get(errorKey) || 0;

    // Log the error
    this.logError(error, context, attempts);

    // Check if we should attempt recovery
    if (!error.recoverable || attempts >= this.maxRetries) {
      this.reportFinalError(error);
      return false;
    }

    // Increment retry count
    this.retryAttempts.set(errorKey, attempts + 1);

    // Attempt recovery based on error type
    const recovered = await this.attemptRecovery(error, context);

    if (recovered) {
      // Clear retry count on successful recovery
      this.retryAttempts.delete(errorKey);
      store.dispatch(clearError());
      return true;
    }

    return false;
  }

  /**
   * Attempt recovery based on error type
   */
  private async attemptRecovery(error: AppError, context?: any): Promise<boolean> {
    switch (error.type) {
      case ErrorType.STORAGE_ERROR:
        return this.recoverFromStorageError(error, context);
      
      case ErrorType.NETWORK_ERROR:
        return this.recoverFromNetworkError(error, context);
      
      case ErrorType.FILE_UPLOAD_ERROR:
        return this.recoverFromFileUploadError(error, context);
      
      case ErrorType.AI_SERVICE_ERROR:
        return this.recoverFromAIServiceError(error, context);
      
      case ErrorType.TIMER_ERROR:
        return this.recoverFromTimerError(error, context);
      
      default:
        return false;
    }
  }

  /**
   * Recover from storage errors
   */
  private async recoverFromStorageError(error: AppError, _context?: any): Promise<boolean> {
    try {
      // Try to clear corrupted data
      if (error.details?.key) {
        localStorage.removeItem(error.details.key);
      }

      // Try alternative storage methods
      if (typeof indexedDB !== 'undefined') {
        // IndexedDB is available, try using it
        return true;
      }

      // Fall back to session storage
      if (typeof sessionStorage !== 'undefined') {
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Recover from network errors
   */
  private async recoverFromNetworkError(_error: AppError, _context?: any): Promise<boolean> {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        // Wait for connection to be restored
        return new Promise((resolve) => {
          const handleOnline = () => {
            window.removeEventListener('online', handleOnline);
            resolve(true);
          };
          window.addEventListener('online', handleOnline);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            window.removeEventListener('online', handleOnline);
            resolve(false);
          }, 30000);
        });
      }

      // Try a simple network test
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  /**
   * Recover from file upload errors
   */
  private async recoverFromFileUploadError(_error: AppError, context?: any): Promise<boolean> {
    try {
      const file = context?.file;
      if (!file) return false;

      // Check file size
      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('File too large');
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type');
      }

      // Try to read the file
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = () => resolve(true);
        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(file.slice(0, 1024)); // Read first 1KB
      });
    } catch (e) {
      return false;
    }
  }

  /**
   * Recover from AI service errors
   */
  private async recoverFromAIServiceError(_error: AppError, _context?: any): Promise<boolean> {
    try {
      // For AI service errors, we can fall back to predefined questions
      // This is handled in the AI service itself, so we just return true
      // to indicate that fallback is available
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Recover from timer errors
   */
  private async recoverFromTimerError(_error: AppError, _context?: any): Promise<boolean> {
    try {
      // Timer errors are usually recoverable by resetting the timer
      // The timer service should handle this internally
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate a unique key for error tracking
   */
  private getErrorKey(error: AppError, context?: any): string {
    const contextKey = context ? JSON.stringify(context) : '';
    return `${error.type}_${error.message}_${contextKey}`.substring(0, 100);
  }

  /**
   * Log error for debugging and monitoring
   */
  private logError(error: AppError, context?: any, attempts: number = 0): void {
    const errorData = {
      ...error,
      context,
      attempts,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Error handled by recovery service:', errorData);

    // In production, you might want to send this to an error tracking service
    if (!import.meta.env.DEV) {
      // Example: Send to error tracking service
      // errorTrackingService.captureError(errorData);
    }
  }

  /**
   * Report final error when recovery fails
   */
  private reportFinalError(error: AppError): void {
    const finalError: AppError = {
      ...error,
      message: `${error.message} (Recovery failed after ${this.maxRetries} attempts)`,
      recoverable: false,
    };

    store.dispatch(setError(finalError));
  }

  /**
   * Clear all retry attempts (useful for testing or manual reset)
   */
  clearRetryAttempts(): void {
    this.retryAttempts.clear();
  }

  /**
   * Get current retry count for an error
   */
  getRetryCount(error: AppError, context?: any): number {
    const errorKey = this.getErrorKey(error, context);
    return this.retryAttempts.get(errorKey) || 0;
  }
}

export const errorRecoveryService = ErrorRecoveryService.getInstance();