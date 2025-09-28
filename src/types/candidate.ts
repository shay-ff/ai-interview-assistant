import type { InterviewStatus, ServiceResponse, BaseComponentProps, WithError, WithLoading } from './common';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFile: File;
  score: number;
  summary: string;
  interviewDate: Date;
  status: InterviewStatus;
  createdAt: Date;
  updatedAt: Date;
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
  resumeFile: File;
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