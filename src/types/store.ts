import type { Candidate } from './candidate';
import type { InterviewSession, TimerState } from './interview';
import type { AppError, ActiveTab, SortBy, SortOrder } from './common';

// Redux store state interfaces
export interface InterviewState {
  currentSession: InterviewSession | null;
  currentQuestionIndex: number;
  timer: TimerState;
  isInterviewActive: boolean;
  error: AppError | null;
  loading: boolean;
}

export interface CandidateState {
  list: Candidate[];
  selectedCandidate: string | null;
  searchQuery: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  filteredList: Candidate[];
  loading: boolean;
  error: AppError | null;
  totalCount: number;
}

export interface UIState {
  activeTab: ActiveTab;
  showWelcomeBack: boolean;
  welcomeBackSession: InterviewSession | null;
  loading: boolean;
  error: AppError | null;
  notifications: Notification[];
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  type?: 'primary' | 'secondary';
}

// Root state interface
export interface RootState {
  interview: InterviewState;
  candidates: CandidateState;
  ui: UIState;
}

// Redux action payload types
export interface StartInterviewPayload {
  candidateId: string;
  questions: import('./interview').Question[];
}

export interface SubmitAnswerPayload {
  questionId: string;
  answer: string;
  timeSpent: number;
}

export interface UpdateTimerPayload {
  remainingTime: number;
  isActive: boolean;
}

export interface AddCandidatePayload {
  candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateCandidatePayload {
  id: string;
  updates: Partial<Candidate>;
}

export interface SetSearchQueryPayload {
  query: string;
}

export interface SetSortPayload {
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export interface ShowNotificationPayload {
  notification: Omit<Notification, 'id' | 'timestamp'>;
}

// Redux thunk return types
export interface AsyncActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
}

// Selector return types
export interface CandidateListSelector {
  candidates: Candidate[];
  filteredCandidates: Candidate[];
  selectedCandidate: Candidate | null;
  searchQuery: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  loading: boolean;
  error: AppError | null;
}

export interface InterviewSelector {
  currentSession: InterviewSession | null;
  currentQuestion: import('./interview').Question | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  timer: TimerState;
  isInterviewActive: boolean;
  canProceedToNext: boolean;
  isLastQuestion: boolean;
  progress: number;
}

export interface UISelector {
  activeTab: ActiveTab;
  showWelcomeBack: boolean;
  welcomeBackSession: InterviewSession | null;
  notifications: Notification[];
  theme: 'light' | 'dark';
  loading: boolean;
  error: AppError | null;
}