import type { QuestionDifficulty, ServiceResponse, BaseComponentProps, WithError } from './common';

export interface Question {
  id: string;
  text: string;
  difficulty: QuestionDifficulty;
  timeLimit: number;
  category: string;
  order: number;
  createdAt: Date;
}

export interface Answer {
  questionId: string;
  text: string;
  timeSpent: number;
  timestamp: Date;
  score?: number;
  evaluation?: string;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;
  startTime: Date;
  endTime?: Date;
  timerState: TimerState;
  status: 'not-started' | 'in-progress' | 'paused' | 'completed' | 'awaiting-evaluation';
  totalScore?: number;
  summary?: string;
  evaluationResult?: any; // Store batch evaluation result from Groq
}

export interface TimerState {
  isActive: boolean;
  remainingTime: number;
  startTime: number;
  pausedAt?: number;
  totalPausedTime: number;
}

// Question generation types
export interface QuestionGenerationRequest {
  resumeText: string;
  difficulty: QuestionDifficulty;
  count: number;
  category?: string;
}

export interface QuestionGenerationResult {
  questions: Question[];
  totalGenerated: number;
  summary?: string;
  confidence?: number;
  detectedSkills?: string[];
  experienceLevel?: 'junior' | 'mid' | 'senior';
}

export type QuestionGenerationResponse = ServiceResponse<QuestionGenerationResult>;

// Scoring types
export interface ScoringCriteria {
  answerQuality: number;
  timingBonus: number;
  difficultyMultiplier: number;
}

export interface ScoreResult {
  totalScore: number;
  breakdown: {
    questionId: string;
    score: number;
    criteria: ScoringCriteria;
  }[];
  summary: string;
  recommendations: string[];
}

export type ScoringResponse = ServiceResponse<ScoreResult>;

// Timer service types
export interface TimerConfig {
  duration: number;
  onTick: (remaining: number) => void;
  onComplete: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

// Component prop types for interview-related components
export interface QuestionDisplayProps extends BaseComponentProps, WithError {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onAnswerSubmit: (answer: string) => void;
  isSubmitting?: boolean;
}

export interface TimerProps extends BaseComponentProps {
  remainingTime: number;
  isActive: boolean;
  difficulty: QuestionDifficulty;
  onTimeUp: () => void;
  showWarning?: boolean;
  warningThreshold?: number;
}

export interface ChatInterfaceProps extends BaseComponentProps, WithError {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
  placeholder?: string;
}

export interface InterviewCompleteProps extends BaseComponentProps {
  session: InterviewSession;
  scoreResult: ScoreResult;
  onRestart: () => void;
  onViewDetails: () => void;
}

// Chat system types
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type: 'text' | 'info' | 'error' | 'success';
}