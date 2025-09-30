import { Alert, Button, Space, Typography } from 'antd';
import { ReloadOutlined, UploadOutlined, EditOutlined } from '@ant-design/icons';
import type { AppError } from '../../types/common';
import { ErrorType } from '../../types/common';

const { Text } = Typography;

interface ServiceErrorHandlerProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
  compact?: boolean;
}

const ServiceErrorHandler: React.FC<ServiceErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showDismiss = true,
  compact = false,
}) => {
  const getErrorConfig = (errorType: ErrorType) => {
    switch (errorType) {
      case ErrorType.FILE_UPLOAD_ERROR:
        return {
          title: 'File Upload Failed',
          description: 'There was a problem uploading your file. Please check the file format and try again.',
          icon: <UploadOutlined />,
          retryText: 'Try Upload Again',
        };

      case ErrorType.RESUME_PARSE_ERROR:
        return {
          title: 'Resume Parsing Failed',
          description: 'We couldn\'t extract information from your resume. You can enter your details manually.',
          icon: <EditOutlined />,
          retryText: 'Try Again',
        };

      case ErrorType.AI_SERVICE_ERROR:
        return {
          title: 'AI Service Error',
          description: 'The AI service is temporarily unavailable. We\'ll use backup questions for your interview.',
          icon: <ReloadOutlined />,
          retryText: 'Retry AI Service',
        };

      case ErrorType.TIMER_ERROR:
        return {
          title: 'Timer Error',
          description: 'There was an issue with the interview timer. Your progress has been saved.',
          icon: <ReloadOutlined />,
          retryText: 'Continue Interview',
        };

      case ErrorType.STORAGE_ERROR:
        return {
          title: 'Storage Error',
          description: 'Unable to save your progress locally. Your session data may not persist.',
          icon: <ReloadOutlined />,
          retryText: 'Retry Save',
        };

      case ErrorType.NETWORK_ERROR:
        return {
          title: 'Network Error',
          description: 'Please check your internet connection and try again.',
          icon: <ReloadOutlined />,
          retryText: 'Retry',
        };

      case ErrorType.VALIDATION_ERROR:
        return {
          title: 'Validation Error',
          description: 'Please check your input and try again.',
          icon: <EditOutlined />,
          retryText: 'Fix and Retry',
        };

      default:
        return {
          title: 'Unexpected Error',
          description: 'An unexpected error occurred. Please try again.',
          icon: <ReloadOutlined />,
          retryText: 'Try Again',
        };
    }
  };

  const config = getErrorConfig(error.type);
  const showRetry = error.recoverable && onRetry;

  const actions = [];
  
  if (showRetry) {
    actions.push(
      <Button
        key="retry"
        type="primary"
        icon={config.icon}
        onClick={onRetry}
        size={compact ? 'small' : 'middle'}
      >
        {config.retryText}
      </Button>
    );
  }

  if (showDismiss && onDismiss) {
    actions.push(
      <Button
        key="dismiss"
        onClick={onDismiss}
        size={compact ? 'small' : 'middle'}
      >
        Dismiss
      </Button>
    );
  }

  if (compact) {
    return (
      <Alert
        message={error.message || config.description}
        type="error"
        showIcon
        closable={showDismiss}
        onClose={onDismiss}
        action={
          showRetry ? (
            <Button
              size="small"
              type="primary"
              onClick={onRetry}
            >
              {config.retryText}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <Alert
      message={config.title}
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>{error.message || config.description}</Text>
          {error.details && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Details: {JSON.stringify(error.details)}
            </Text>
          )}
          {actions.length > 0 && (
            <Space>
              {actions}
            </Space>
          )}
        </Space>
      }
      type="error"
      showIcon
      closable={showDismiss}
      onClose={onDismiss}
    />
  );
};

export default ServiceErrorHandler;