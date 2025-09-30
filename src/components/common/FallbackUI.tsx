import { Result, Button, Empty, Spin } from 'antd';
import { 
  ReloadOutlined, 
  HomeOutlined, 
  WifiOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';

interface FallbackUIProps {
  type: 'loading' | 'empty' | 'error' | 'offline' | 'maintenance';
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
  children?: React.ReactNode;
}

const FallbackUI: React.FC<FallbackUIProps> = ({
  type,
  title,
  description,
  onRetry,
  onGoHome,
  showHomeButton = true,
  children,
}) => {
  const getConfig = () => {
    switch (type) {
      case 'loading':
        return {
          icon: <Spin size="large" />,
          title: title || 'Loading...',
          description: description || 'Please wait while we load your content.',
          showActions: false,
        };

      case 'empty':
        return {
          icon: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          title: title || 'No Data',
          description: description || 'There\'s nothing to show here yet.',
          showActions: false,
        };

      case 'offline':
        return {
          icon: <WifiOutlined style={{ fontSize: '64px', color: '#ff4d4f' }} />,
          title: title || 'You\'re Offline',
          description: description || 'Please check your internet connection and try again.',
          showActions: true,
          status: 'warning' as const,
        };

      case 'maintenance':
        return {
          icon: <ExclamationCircleOutlined style={{ fontSize: '64px', color: '#faad14' }} />,
          title: title || 'Under Maintenance',
          description: description || 'We\'re currently performing maintenance. Please try again later.',
          showActions: false,
          status: 'warning' as const,
        };

      case 'error':
      default:
        return {
          icon: undefined,
          title: title || 'Something went wrong',
          description: description || 'An unexpected error occurred.',
          showActions: true,
          status: '500' as const,
        };
    }
  };

  const config = getConfig();

  if (type === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '200px',
        padding: '40px' 
      }}>
        {config.icon}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
            {config.title}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>
            {config.description}
          </div>
        </div>
        {children}
      </div>
    );
  }

  if (type === 'empty') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '200px',
        padding: '40px' 
      }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                {config.title}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {config.description}
              </div>
            </div>
          }
        >
          {children}
        </Empty>
      </div>
    );
  }

  const actions = [];
  
  if (config.showActions && onRetry) {
    actions.push(
      <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry} key="retry">
        Try Again
      </Button>
    );
  }

  if (config.showActions && showHomeButton && onGoHome) {
    actions.push(
      <Button icon={<HomeOutlined />} onClick={onGoHome} key="home">
        Go Home
      </Button>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
      <Result
        status={config.status}
        icon={config.icon}
        title={config.title}
        subTitle={config.description}
        extra={actions.length > 0 ? actions : undefined}
      >
        {children}
      </Result>
    </div>
  );
};

// Specific fallback components for common use cases
export const LoadingFallback: React.FC<{ message?: string }> = ({ message }) => (
  <FallbackUI type="loading" description={message} />
);

export const EmptyFallback: React.FC<{ message?: string; action?: React.ReactNode }> = ({ 
  message, 
  action 
}) => (
  <FallbackUI type="empty" description={message}>
    {action}
  </FallbackUI>
);

export const ErrorFallback: React.FC<{ 
  message?: string; 
  onRetry?: () => void; 
  onGoHome?: () => void;
}> = ({ message, onRetry, onGoHome }) => (
  <FallbackUI 
    type="error" 
    description={message} 
    onRetry={onRetry} 
    onGoHome={onGoHome} 
  />
);

export const OfflineFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <FallbackUI type="offline" onRetry={onRetry} />
);

export const MaintenanceFallback: React.FC<{ message?: string }> = ({ message }) => (
  <FallbackUI type="maintenance" description={message} />
);

export default FallbackUI;