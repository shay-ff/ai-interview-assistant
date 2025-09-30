import type { ReactNode } from 'react';
import type { BaseComponentProps, WithError, WithLoading, ActiveTab } from './common';
import type { Candidate } from './candidate';
import type { InterviewSession, Question, ChatMessage, ScoreResult } from './interview';
import type { Notification } from './store';

// Layout and common component props
export interface LayoutProps extends BaseComponentProps {
  children: ReactNode;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  showWelcomeBack?: boolean;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export interface WelcomeBackModalProps extends BaseComponentProps {
  visible: boolean;
  session: InterviewSession | null;
  onContinue: () => void;
  onRestart: () => void;
  onCancel: () => void;
}

// Interviewee component props
export interface ResumeUploadProps extends BaseComponentProps, WithError, WithLoading {
  onUploadComplete: (result: import('./candidate').ResumeParseResult) => void;
  onUploadStart?: () => void;
  acceptedFileTypes: string[];
  maxFileSize: number;
  disabled?: boolean;
}

export interface ChatInterfaceProps extends BaseComponentProps, WithError {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
  placeholder?: string;
  disabled?: boolean;
  showTypingIndicator?: boolean;
}

export interface QuestionDisplayProps extends BaseComponentProps, WithError {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  answer: string;
  onAnswerChange: (answer: string) => void;
  onAnswerSubmit: (answer: string) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  showProgress?: boolean;
}

export interface TimerProps extends BaseComponentProps {
  remainingTime: number;
  isActive: boolean;
  difficulty: import('./common').QuestionDifficulty;
  onTimeUp: () => void;
  onPause?: () => void;
  onResume?: () => void;
  showWarning?: boolean;
  warningThreshold?: number;
  showControls?: boolean;
}

export interface InterviewCompleteProps extends BaseComponentProps {
  session: InterviewSession;
  scoreResult: ScoreResult;
  onRestart: () => void;
  onViewDetails: () => void;
  onExport?: () => void;
  showActions?: boolean;
}

// Interviewer component props
export interface DashboardProps extends BaseComponentProps, WithError, WithLoading {
  candidates: Candidate[];
  selectedCandidateId?: string;
  onCandidateSelect: (candidateId: string) => void;
  onRefresh?: () => void;
  showStats?: boolean;
}

export interface CandidateListProps extends BaseComponentProps, WithError, WithLoading {
  candidates: Candidate[];
  selectedCandidateId?: string;
  onCandidateSelect: (candidateId: string) => void;
  onCandidateDelete?: (candidateId: string) => void;
  sortBy: import('./common').SortBy;
  sortOrder: import('./common').SortOrder;
  onSort: (sortBy: import('./common').SortBy, sortOrder: import('./common').SortOrder) => void;
  showActions?: boolean;
  pageSize?: number;
}

export interface CandidateDetailProps extends BaseComponentProps, WithError {
  candidate: Candidate;
  session?: InterviewSession;
  onBack: () => void;
  onEdit?: (candidate: Candidate) => void;
  onDelete?: (candidateId: string) => void;
  onExport?: (candidate: Candidate) => void;
  showActions?: boolean;
}

export interface SearchSortProps extends BaseComponentProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: import('./common').SortBy;
  sortOrder: import('./common').SortOrder;
  onSortChange: (sortBy: import('./common').SortBy, sortOrder: import('./common').SortOrder) => void;
  placeholder?: string;
  showClearButton?: boolean;
}

// Notification component props
export interface NotificationProps extends BaseComponentProps {
  notification: Notification;
  onClose: (notificationId: string) => void;
  onAction?: (actionIndex: number) => void;
  autoClose?: boolean;
}

export interface NotificationListProps extends BaseComponentProps {
  notifications: Notification[];
  onClose: (notificationId: string) => void;
  onClearAll: () => void;
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// Form component props
export interface FormFieldProps extends BaseComponentProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
}

export interface FileUploadProps extends BaseComponentProps, WithError, WithLoading {
  onFileSelect: (file: File) => void;
  acceptedTypes: string[];
  maxSize: number;
  multiple?: boolean;
  disabled?: boolean;
  dragAndDrop?: boolean;
  showPreview?: boolean;
}

// Modal component props
export interface ModalProps extends BaseComponentProps {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  closable?: boolean;
  maskClosable?: boolean;
  width?: number | string;
  centered?: boolean;
}

export interface ConfirmModalProps extends BaseComponentProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

// Table component props
export interface TableColumn<T> {
  key: string;
  title: string;
  dataIndex: keyof T;
  render?: (value: any, record: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> extends BaseComponentProps, WithLoading {
  data: T[];
  columns: TableColumn<T>[];
  rowKey: keyof T;
  onRowClick?: (record: T, index: number) => void;
  selectedRowKeys?: string[];
  onSelectionChange?: (selectedKeys: string[], selectedRows: T[]) => void;
  pagination?: boolean | {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

// Statistics component props
export interface StatsCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

export interface StatsGridProps extends BaseComponentProps {
  stats: Array<{
    key: string;
    title: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
      value: number;
      isPositive: boolean;
    };
    color?: string;
  }>;
  columns?: number;
}