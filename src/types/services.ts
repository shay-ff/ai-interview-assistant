import { ServiceResponse, AppError, SupportedFileType } from './common';
import { ContactInfo, ResumeParseResult } from './candidate';
import { Question, QuestionGenerationResult, ScoreResult, TimerConfig } from './interview';

// Resume Parser Service types
export interface ResumeParserService {
  parseResume(file: File): Promise<ServiceResponse<ResumeParseResult>>;
  extractContactInfo(text: string): ContactInfo;
  validateFile(file: File): ServiceResponse<boolean>;
}

export interface ParseResumeOptions {
  extractContactInfo: boolean;
  validateContent: boolean;
  maxFileSize: number;
  supportedTypes: SupportedFileType[];
}

// AI Question Generator Service types
export interface AIQuestionService {
  generateQuestions(resumeText: string): Promise<ServiceResponse<QuestionGenerationResult>>;
  generateQuestionsByDifficulty(resumeText: string, difficulty: import('./common').QuestionDifficulty, count: number): Promise<ServiceResponse<Question[]>>;
  validateQuestions(questions: Question[]): boolean;
}

export interface QuestionTemplate {
  id: string;
  template: string;
  difficulty: import('./common').QuestionDifficulty;
  category: string;
  variables: string[];
  timeLimit: number;
}

export interface QuestionGenerationOptions {
  useTemplates: boolean;
  customPrompts: string[];
  excludeCategories: string[];
  maxRetries: number;
}

// Timer Service types
export interface TimerService {
  startTimer(config: TimerConfig): string;
  pauseTimer(timerId: string): boolean;
  resumeTimer(timerId: string): boolean;
  resetTimer(timerId: string): boolean;
  stopTimer(timerId: string): boolean;
  getTimerState(timerId: string): import('./interview').TimerState | null;
  getAllActiveTimers(): string[];
}

export interface TimerServiceConfig {
  precision: number;
  persistState: boolean;
  maxConcurrentTimers: number;
}

// Scoring Service types
export interface ScoringService {
  calculateScore(answers: import('./interview').Answer[], questions: Question[]): Promise<ServiceResponse<ScoreResult>>;
  generateSummary(candidateId: string, answers: import('./interview').Answer[]): Promise<ServiceResponse<string>>;
  evaluateAnswer(answer: import('./interview').Answer, question: Question): Promise<ServiceResponse<number>>;
}

export interface ScoringWeights {
  answerQuality: number;
  timingBonus: number;
  difficultyMultiplier: {
    easy: number;
    medium: number;
    hard: number;
  };
  completionBonus: number;
}

export interface ScoringOptions {
  weights: ScoringWeights;
  enableAIEvaluation: boolean;
  includeRecommendations: boolean;
  detailedBreakdown: boolean;
}

// File Service types (for handling file operations)
export interface FileService {
  validateFile(file: File): ServiceResponse<boolean>;
  readFileAsText(file: File): Promise<ServiceResponse<string>>;
  readFileAsArrayBuffer(file: File): Promise<ServiceResponse<ArrayBuffer>>;
  getFileMetadata(file: File): FileMetadata;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  extension: string;
  isSupported: boolean;
}

// Storage Service types (for persistence)
export interface StorageService {
  saveSession(session: import('./interview').InterviewSession): Promise<ServiceResponse<boolean>>;
  loadSession(sessionId: string): Promise<ServiceResponse<import('./interview').InterviewSession>>;
  saveCandidate(candidate: import('./candidate').Candidate): Promise<ServiceResponse<boolean>>;
  loadCandidates(): Promise<ServiceResponse<import('./candidate').Candidate[]>>;
  clearStorage(): Promise<ServiceResponse<boolean>>;
  getStorageInfo(): Promise<ServiceResponse<StorageInfo>>;
}

export interface StorageInfo {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  itemCount: number;
  lastBackup?: Date;
}

// Error handling for services
export interface ServiceError extends AppError {
  service: 'ResumeParser' | 'AIQuestion' | 'Timer' | 'Scoring' | 'File' | 'Storage';
  operation: string;
  timestamp: Date;
  context?: Record<string, any>;
}

// Service configuration types
export interface ServiceConfig {
  resumeParser: {
    maxFileSize: number;
    supportedTypes: SupportedFileType[];
    timeout: number;
  };
  aiQuestion: {
    maxRetries: number;
    timeout: number;
    fallbackQuestions: Question[];
  };
  timer: TimerServiceConfig;
  scoring: ScoringOptions;
  storage: {
    maxStorageSize: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
  };
}

// Service factory types
export interface ServiceFactory {
  createResumeParser(): ResumeParserService;
  createAIQuestionService(): AIQuestionService;
  createTimerService(): TimerService;
  createScoringService(): ScoringService;
  createFileService(): FileService;
  createStorageService(): StorageService;
}