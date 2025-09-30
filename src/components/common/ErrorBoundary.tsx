import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography, Alert, Space } from 'antd';
import { ReloadOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for monitoring (in production, you might send this to a service)
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In a real app, you'd send this to your error tracking service
    console.error('Error logged:', errorData);
    
    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      existingErrors.push(errorData);
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      localStorage.setItem('app_errors', JSON.stringify(existingErrors));
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorTitle = (): string => {
    const { level = 'component' } = this.props;
    const { error } = this.state;

    if (error?.message.includes('ChunkLoadError') || error?.message.includes('Loading chunk')) {
      return 'Update Available';
    }

    switch (level) {
      case 'page':
        return 'Page Error';
      case 'section':
        return 'Section Error';
      default:
        return 'Something went wrong';
    }
  };

  private getErrorSubTitle = (): string => {
    const { error } = this.state;

    if (error?.message.includes('ChunkLoadError') || error?.message.includes('Loading chunk')) {
      return 'The application has been updated. Please refresh the page to get the latest version.';
    }

    return 'An unexpected error occurred. You can try refreshing the page or going back to the home page.';
  };

  private renderErrorActions = () => {
    const { level = 'component' } = this.props;
    const { error } = this.state;

    const isChunkError = error?.message.includes('ChunkLoadError') || error?.message.includes('Loading chunk');

    if (isChunkError) {
      return [
        <Button type="primary" icon={<ReloadOutlined />} onClick={this.handleReload} key="reload">
          Refresh Page
        </Button>,
      ];
    }

    const actions = [
      <Button type="primary" icon={<ReloadOutlined />} onClick={this.handleRetry} key="retry">
        Try Again
      </Button>,
    ];

    if (level === 'page') {
      actions.push(
        <Button icon={<HomeOutlined />} onClick={this.handleGoHome} key="home">
          Go Home
        </Button>
      );
    } else {
      actions.push(
        <Button icon={<ReloadOutlined />} onClick={this.handleReload} key="reload">
          Refresh Page
        </Button>
      );
    }

    return actions;
  };

  private renderErrorDetails = () => {
    const { showDetails = import.meta.env.DEV } = this.props;
    const { error, errorInfo, errorId } = this.state;

    if (!showDetails || !error) return null;

    return (
      <Alert
        message="Error Details"
        description={
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Error ID:</Text> <Text code>{errorId}</Text>
            </div>
            <div>
              <Text strong>Message:</Text> <Text code>{error.message}</Text>
            </div>
            {error.stack && (
              <div>
                <Text strong>Stack Trace:</Text>
                <Paragraph>
                  <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                    {error.stack}
                  </pre>
                </Paragraph>
              </div>
            )}
            {errorInfo?.componentStack && (
              <div>
                <Text strong>Component Stack:</Text>
                <Paragraph>
                  <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                    {errorInfo.componentStack}
                  </pre>
                </Paragraph>
              </div>
            )}
          </Space>
        }
        type="error"
        showIcon
        icon={<BugOutlined />}
        style={{ marginTop: 16, textAlign: 'left' }}
      />
    );
  };

  render() {
    const { hasError } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      const status = level === 'page' ? '500' : undefined;

      return (
        <div style={{ padding: level === 'component' ? '20px' : '50px' }}>
          <Result
            status={status as any}
            title={this.getErrorTitle()}
            subTitle={this.getErrorSubTitle()}
            extra={this.renderErrorActions()}
          />
          {this.renderErrorDetails()}
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;