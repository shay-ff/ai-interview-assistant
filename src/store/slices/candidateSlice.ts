import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CandidateState, UpdateCandidatePayload, SetSortPayload, RootState } from '../../types/store';
import type { Candidate, InterviewProgress } from '../../types/candidate';
import type { SortBy, SortOrder } from '../../types/common';

const initialState: CandidateState = {
  list: [],
  selectedCandidate: null,
  searchQuery: '',
  sortBy: 'score',
  sortOrder: 'desc',
  filteredList: [],
  loading: false,
  error: null,
  totalCount: 0,
};

// Helper function to filter candidates based on search query
const filterCandidates = (candidates: Candidate[], searchQuery: string): Candidate[] => {
  if (!searchQuery.trim()) return candidates;
  
  const query = searchQuery.toLowerCase().trim();
  return candidates.filter(candidate => 
    candidate.name.toLowerCase().includes(query) ||
    candidate.email.toLowerCase().includes(query) ||
    candidate.phone.includes(query) ||
    candidate.summary.toLowerCase().includes(query)
  );
};

// Helper function to sort candidates
const sortCandidates = (candidates: Candidate[], sortBy: SortBy, sortOrder: SortOrder): Candidate[] => {
  const sorted = [...candidates].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'score':
        comparison = a.score - b.score;
        break;
      case 'date':
        comparison = new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime();
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
};

// Helper function to update filtered list
const updateFilteredList = (state: CandidateState) => {
  const filtered = filterCandidates(state.list, state.searchQuery);
  state.filteredList = sortCandidates(filtered, state.sortBy, state.sortOrder);
};

const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<any>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      updateFilteredList(state);
    },
    setSorting: (state, action: PayloadAction<SetSortPayload>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
      updateFilteredList(state);
    },
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      // Check if candidate already exists
      const existingIndex = state.list.findIndex(c => c.id === action.payload.id);
      if (existingIndex === -1) {
        const now = new Date().toISOString();
        state.list.push({
          ...action.payload,
          createdAt: now as any,
          updatedAt: now as any,
          // Initialize interview progress
          interviewProgress: {
            status: 'not-started',
            currentQuestion: 0,
            totalQuestions: 0,
            answersSubmitted: 0,
            timeSpent: 0,
            lastActivity: now as any,
          },
        });
        state.totalCount = state.list.length;
        updateFilteredList(state);
      }
    },
    updateCandidate: (state, action: PayloadAction<UpdateCandidatePayload>) => {
      const index = state.list.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = { 
          ...state.list[index], 
          ...action.payload.updates,
          updatedAt: new Date().toISOString() as any,
        };
        updateFilteredList(state);
      }
    },
    deleteCandidate: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(c => c.id !== action.payload);
      state.totalCount = state.list.length;
      updateFilteredList(state);
      
      // Clear selection if deleted candidate was selected
      if (state.selectedCandidate === action.payload) {
        state.selectedCandidate = null;
      }
    },
    selectCandidate: (state, action: PayloadAction<string | null>) => {
      state.selectedCandidate = action.payload;
    },
    setCandidates: (state, action: PayloadAction<Candidate[]>) => {
      state.list = action.payload;
      state.totalCount = action.payload.length;
      updateFilteredList(state);
    },
    clearCandidates: (state) => {
      state.list = [];
      state.filteredList = [];
      state.totalCount = 0;
      state.selectedCandidate = null;
    },
    bulkUpdateCandidates: (state, action: PayloadAction<{ ids: string[]; updates: Partial<Candidate> }>) => {
      const { ids, updates } = action.payload;
      state.list = state.list.map(candidate => 
        ids.includes(candidate.id) 
          ? { ...candidate, ...updates, updatedAt: new Date().toISOString() as any }
          : candidate
      );
      updateFilteredList(state);
    },
    // Action to refresh filtered list (useful after external updates)
    refreshFilteredList: (state) => {
      updateFilteredList(state);
    },
    // Update interview progress for a candidate
    updateInterviewProgress: (state, action: PayloadAction<{
      candidateId: string;
      progress: Partial<InterviewProgress>;
    }>) => {
      const { candidateId, progress } = action.payload;
      const candidate = state.list.find(c => c.id === candidateId);
      if (candidate) {
        // Initialize interview progress if it doesn't exist
        if (!candidate.interviewProgress) {
          candidate.interviewProgress = {
            status: 'not-started',
            currentQuestion: 0,
            totalQuestions: 0,
            answersSubmitted: 0,
            timeSpent: 0,
            lastActivity: new Date().toISOString() as any,
          };
        }
        
        // Update with provided values
        if (progress.status !== undefined) {
          candidate.interviewProgress.status = progress.status;
        }
        if (progress.currentQuestion !== undefined) {
          candidate.interviewProgress.currentQuestion = progress.currentQuestion;
        }
        if (progress.totalQuestions !== undefined) {
          candidate.interviewProgress.totalQuestions = progress.totalQuestions;
        }
        if (progress.answersSubmitted !== undefined) {
          candidate.interviewProgress.answersSubmitted = progress.answersSubmitted;
        }
        if (progress.timeSpent !== undefined) {
          candidate.interviewProgress.timeSpent = progress.timeSpent;
        }
        if (progress.lastAnswerFeedback !== undefined) {
          candidate.interviewProgress.lastAnswerFeedback = progress.lastAnswerFeedback;
        }
        if (progress.allAnswersFeedback !== undefined) {
          candidate.interviewProgress.allAnswersFeedback = progress.allAnswersFeedback;
        }
        if (progress.completedAt !== undefined) {
          candidate.interviewProgress.completedAt = progress.completedAt;
        }
        candidate.interviewProgress.lastActivity = new Date().toISOString() as any;
        
        // Update main candidate status
        candidate.status = progress.status === 'completed' ? 'completed' : 
                          progress.status === 'in-progress' ? 'in-progress' : 'pending';
        candidate.updatedAt = new Date().toISOString() as any;
        updateFilteredList(state);
      }
    },
  },
});

// Selectors for candidate state
export const selectCandidateState = (state: RootState) => state.candidates;

export const selectAllCandidates = createSelector(
  [selectCandidateState],
  (candidates) => candidates.list
);

export const selectFilteredCandidates = createSelector(
  [selectCandidateState],
  (candidates) => candidates.filteredList
);

export const selectSelectedCandidate = createSelector(
  [selectCandidateState, selectAllCandidates],
  (candidateState, allCandidates) => {
    if (!candidateState.selectedCandidate) return null;
    return allCandidates.find(c => c.id === candidateState.selectedCandidate) || null;
  }
);

export const selectSearchQuery = createSelector(
  [selectCandidateState],
  (candidates) => candidates.searchQuery
);

export const selectSortBy = createSelector(
  [selectCandidateState],
  (candidates) => candidates.sortBy
);

export const selectSortOrder = createSelector(
  [selectCandidateState],
  (candidates) => candidates.sortOrder
);

export const selectCandidateLoading = createSelector(
  [selectCandidateState],
  (candidates) => candidates.loading
);

export const selectCandidateError = createSelector(
  [selectCandidateState],
  (candidates) => candidates.error
);

export const selectTotalCandidateCount = createSelector(
  [selectCandidateState],
  (candidates) => candidates.totalCount
);

export const selectFilteredCandidateCount = createSelector(
  [selectFilteredCandidates],
  (filteredCandidates) => filteredCandidates.length
);

// Complex selectors
export const selectCandidateById = createSelector(
  [selectAllCandidates, (state: RootState, candidateId: string) => candidateId],
  (candidates, candidateId) => candidates.find(c => c.id === candidateId) || null
);

export const selectCandidatesByStatus = createSelector(
  [selectAllCandidates, (state: RootState, status: string) => status],
  (candidates, status) => candidates.filter(c => c.status === status)
);

export const selectTopCandidates = createSelector(
  [selectAllCandidates, (state: RootState, limit: number) => limit],
  (candidates, limit) => {
    return [...candidates]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
);

export const selectCandidateStats = createSelector(
  [selectAllCandidates],
  (candidates) => {
    if (candidates.length === 0) {
      return {
        total: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        completedInterviews: 0,
        inProgressInterviews: 0,
      };
    }

    const scores = candidates.map(c => c.score).filter(score => score > 0);
    const completed = candidates.filter(c => c.status === 'completed');
    const inProgress = candidates.filter(c => c.status === 'in-progress');

    return {
      total: candidates.length,
      averageScore: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      completedInterviews: completed.length,
      inProgressInterviews: inProgress.length,
    };
  }
);

// Combined selector for candidate list component
export const selectCandidateListSelector = createSelector(
  [
    selectFilteredCandidates,
    selectSelectedCandidate,
    selectSearchQuery,
    selectSortBy,
    selectSortOrder,
    selectCandidateLoading,
    selectCandidateError,
  ],
  (
    candidates,
    selectedCandidate,
    searchQuery,
    sortBy,
    sortOrder,
    loading,
    error
  ) => ({
    candidates,
    filteredCandidates: candidates,
    selectedCandidate,
    searchQuery,
    sortBy,
    sortOrder,
    loading,
    error,
  })
);

export const {
  setLoading,
  setError,
  clearError,
  setSearchQuery,
  setSorting,
  addCandidate,
  updateCandidate,
  deleteCandidate,
  selectCandidate,
  setCandidates,
  clearCandidates,
  bulkUpdateCandidates,
  refreshFilteredList,
  updateInterviewProgress,
} = candidateSlice.actions;

export default candidateSlice;