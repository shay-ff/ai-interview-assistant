import type { InterviewStatus, ServiceResponse, BaseComponentProps, WithError, WithLoading } from './common';

// Serializable file metadata for Redux storage
export interface ResumeFileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content?: string; // Base64 encoded content for persistence
}

export interface AnswerFeedback {
  questionId: string;
  question: string;
  answer: string;
  timeSpent: number;
  timeLimit: number;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
  timestamp: Date | string;
}

export interface InterviewProgress {
  status: 'not-started' | 'in-progress' | 'paused' | 'completed';
  currentQuestion?: number;
  totalQuestions?: number;
  answersSubmitted?: number;
  timeSpent?: number; // in seconds
  lastActivity?: Date | string;
  lastAnswerFeedback?: AnswerFeedback;
  completedAt?: Date | string;
  allAnswersFeedback?: AnswerFeedback[]; // Store all feedback for comprehensive analysis
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFile: ResumeFileMetadata; 
  score: number;
  summary: string;
  interviewDate: Date | string; // Can be Date object or ISO string for persistence
  status: InterviewStatus;
  createdAt: Date | string; // Can be Date object or ISO string for persistence
  updatedAt: Date | string; // Can be Date object or ISO string for persistence
  interviewProgress?: InterviewProgress; // Optional for backwards compatibility
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  text: string;
  missing: string[];
  // Enhanced fields
  skills?: string[];
  experience?: string;
  education?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

// Candidate creation and update types
export interface CreateCandidateRequest {
  name: string;
  email: string;
  phone: string;
  resumeFile: File; // Still use File for creation, will be converted to metadata
}

export interface UpdateCandidateRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  score?: number;
  summary?: string;
  status?: InterviewStatus;
}

// Resume parsing types
export interface ResumeParseResult {
  contactInfo: ContactInfo;
  success: boolean;
  missingFields: string[];
}

export type ResumeParseResponse = ServiceResponse<ResumeParseResult>;

// Component prop types for candidate-related components
export interface CandidateListProps extends BaseComponentProps, WithError, WithLoading {
  candidates: Candidate[];
  onCandidateSelect: (candidateId: string) => void;
  selectedCandidateId?: string;
}

export interface CandidateDetailProps extends BaseComponentProps, WithError {
  candidate: Candidate;
  onBack: () => void;
  onEdit?: (candidate: Candidate) => void;
}

export interface ResumeUploadProps extends BaseComponentProps, WithError, WithLoading {
  onUploadComplete: (result: ResumeParseResult) => void;
  acceptedFileTypes: string[];
  maxFileSize: number;
}