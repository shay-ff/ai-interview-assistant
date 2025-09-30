// Error handling types and enums
export const ErrorType = {
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  RESUME_PARSE_ERROR: 'RESUME_PARSE_ERROR',
  TIMER_ERROR: 'TIMER_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  GENERAL_ERROR: 'GENERAL_ERROR',
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

export interface AppError {
  type: ErrorType;
  message: string;
  recoverable: boolean;
  retryAction?: () => void;
  details?: Record<string, any>;
}

// Basic type definitions
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type InterviewStatus = 'in-progress' | 'completed' | 'not-started' | 'pending';
export type SortBy = 'score' | 'name' | 'date';
export type SortOrder = 'asc' | 'desc';
export type ActiveTab = 'interviewee' | 'interviewer';

// File processing types
export type SupportedFileType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Service response types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: AppError;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Utility types for component props
export interface BaseComponentProps {
  className?: string;
  testId?: string;
}

export interface WithError {
  error?: AppError | null;
  onErrorRetry?: () => void;
}

export interface WithLoading {
  loading?: boolean;
  loadingMessage?: string;
}