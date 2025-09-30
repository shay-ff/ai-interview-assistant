import React, { useState, useCallback } from 'react';
import type { ComponentType } from 'react';
import { useDispatch } from 'react-redux';
import ErrorBoundary from './ErrorBoundary';
import ServiceErrorHandler from './ServiceErrorHandler';
import { setError, clearError as clearGlobalError } from '../../store/slices/uiSlice';
import type { AppError } from '../../types/common';
import { ErrorType } from '../../types/common';

interface WithErrorHandlingProps {
  onError?: (error: AppError) => void;
  showErrorInline?: boolean;
  errorBoundaryLevel?: 'page' | 'section' | 'component';
  fallbackComponent?: ComponentType<any>;
}

interface InjectedErrorProps {
  reportError: (error: Error | AppError | string, type?: ErrorType) => void;
  clearError: () => void;
  hasError: boolean;
  currentError: AppError | null;
}

function withErrorHandling<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithErrorHandlingProps = {}
) {
  const {
    onError,
    showErrorInline = true,
    errorBoundaryLevel = 'component',
    fallbackComponent: FallbackComponent,
  } = options;

  const WithErrorHandlingComponent: React.FC<P> = (props) => {
    const dispatch = useDispatch();
    const [localError, setLocalError] = useState<AppError | null>(null);

    const reportError = useCallback((
      error: Error | AppError | string, 
      type: ErrorType = ErrorType.GENERAL_ERROR
    ) => {
      let appError: AppError;

      if (typeof error === 'string') {
        appError = {
          type,
          message: error,
          recoverable: true,
        };
      } else if (error instanceof Error) {
        appError = {
          type,
          message: error.message,
          recoverable: true,
          details: {
            stack: error.stack,
            name: error.name,
          },
        };
      } else {
        appError = error;
      }

      setLocalError(appError);
      dispatch(setError(appError));

      if (onError) {
        onError(appError);
      }

      // Log error for debugging
      console.error('Error reported:', appError);
    }, [dispatch, onError]);

    const handleClearError = useCallback(() => {
      setLocalError(null);
      dispatch(clearGlobalError());
    }, [dispatch]);

    const handleRetry = useCallback(() => {
      if (localError?.retryAction) {
        localError.retryAction();
      }
      handleClearError();
    }, [localError, handleClearError]);

    const injectedProps: InjectedErrorProps = {
      reportError,
      clearError: handleClearError,
      hasError: !!localError,
      currentError: localError,
    };

    // If there's a local error and we should show it inline
    if (localError && showErrorInline) {
      return (
        <div>
          <ServiceErrorHandler
            error={localError}
            onRetry={localError.recoverable ? handleRetry : undefined}
            onDismiss={handleClearError}
          />
          {/* Still render the component below the error */}
          <WrappedComponent {...props} {...injectedProps} />
        </div>
      );
    }

    // If there's a fallback component and we have an error
    if (localError && FallbackComponent) {
      return <FallbackComponent error={localError} onRetry={handleRetry} />;
    }

    return <WrappedComponent {...props} {...injectedProps} />;
  };

  // Wrap with ErrorBoundary
  const ErrorBoundaryWrapped: React.FC<P> = (props) => (
    <ErrorBoundary
      level={errorBoundaryLevel}
      onError={(error, errorInfo) => {
        const appError: AppError = {
          type: ErrorType.GENERAL_ERROR,
          message: error.message,
          recoverable: false,
          details: {
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          },
        };

        if (onError) {
          onError(appError);
        }
      }}
    >
      <WithErrorHandlingComponent {...props} />
    </ErrorBoundary>
  );

  ErrorBoundaryWrapped.displayName = `withErrorHandling(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ErrorBoundaryWrapped;
}

export default withErrorHandling;

// Utility hook for error handling in functional components
export const useErrorHandler = () => {
  const dispatch = useDispatch();
  const [localError, setLocalError] = useState<AppError | null>(null);

  const reportError = useCallback((
    error: Error | AppError | string,
    type: ErrorType = ErrorType.GENERAL_ERROR
  ) => {
    let appError: AppError;

    if (typeof error === 'string') {
      appError = {
        type,
        message: error,
        recoverable: true,
      };
    } else if (error instanceof Error) {
      appError = {
        type,
        message: error.message,
        recoverable: true,
        details: {
          stack: error.stack,
          name: error.name,
        },
      };
    } else {
      appError = error;
    }

    setLocalError(appError);
    dispatch(setError(appError));
    console.error('Error reported:', appError);
  }, [dispatch]);

  const clearError = useCallback(() => {
    setLocalError(null);
    dispatch(clearGlobalError());
  }, [dispatch]);

  return {
    reportError,
    clearError,
    hasError: !!localError,
    currentError: localError,
  };
};