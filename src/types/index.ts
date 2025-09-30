// Export all common types
export * from './common';

// Export candidate-related types
export * from './candidate';

// Export interview-related types
export * from './interview';

// Export Redux store types
export * from './store';

// Export service types
export * from './services';

// Re-export commonly used type combinations
export type { 
  RootState,
  InterviewState,
  CandidateState,
  UIState
} from './store';

export type {
  AppError,
  ErrorType,
  ServiceResponse,
  QuestionDifficulty,
  InterviewStatus
} from './common';

// Utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type NonEmptyArray<T> = [T, ...T[]];
export type ValueOf<T> = T[keyof T];
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];