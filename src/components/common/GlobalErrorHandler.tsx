import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { notification } from 'antd';
import { selectUIError } from '../../store/slices/uiSlice';
import { clearError } from '../../store/slices/uiSlice';
import { ErrorType } from '../../types/common';

const GlobalErrorHandler: React.FC = () => {
  const dispatch = useDispatch();
  const error = useSelector(selectUIError);

  useEffect(() => {
    if (error) {
      const config = getNotificationConfig(error.type);
      
      notification.error({
        message: config.title,
        description: error.message,
        duration: config.duration,
        placement: 'topRight',
        onClose: () => {
          dispatch(clearError());
        },
        btn: error.recoverable && error.retryAction ? (
          <button
            onClick={() => {
              error.retryAction?.();
              dispatch(clearError());
            }}
            style={{
              border: 'none',
              background: '#ff4d4f',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        ) : undefined,
      });
    }
  }, [error, dispatch]);

  return null;
};

const getNotificationConfig = (errorType: ErrorType) => {
  switch (errorType) {
    case ErrorType.FILE_UPLOAD_ERROR:
      return {
        title: 'File Upload Failed',
        duration: 6,
      };
    
    case ErrorType.RESUME_PARSE_ERROR:
      return {
        title: 'Resume Parsing Failed',
        duration: 8,
      };
    
    case ErrorType.AI_SERVICE_ERROR:
      return {
        title: 'AI Service Error',
        duration: 6,
      };
    
    case ErrorType.TIMER_ERROR:
      return {
        title: 'Timer Error',
        duration: 4,
      };
    
    case ErrorType.STORAGE_ERROR:
      return {
        title: 'Storage Error',
        duration: 8,
      };
    
    case ErrorType.NETWORK_ERROR:
      return {
        title: 'Network Error',
        duration: 6,
      };
    
    case ErrorType.VALIDATION_ERROR:
      return {
        title: 'Validation Error',
        duration: 4,
      };
    
    default:
      return {
        title: 'Error',
        duration: 5,
      };
  }
};

export default GlobalErrorHandler;