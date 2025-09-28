import { store, persistor } from '../index';
import { startInterview, submitAnswer } from '../slices/interviewSlice';
import { addCandidate, setSearchQuery } from '../slices/candidateSlice';
import { setActiveTab, showNotification, showWelcomeBackModal, hideWelcomeBackModal, setLoading, setError, clearError } from '../slices/uiSlice';
import type { Question } from '../../types/interview';
import type { Candidate } from '../../types/candidate';

describe('Redux Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    store.dispatch({ type: 'RESET_STORE' });
  });

  afterAll(() => {
    // Clean up persistor
    persistor.purge();
  });

  describe('Store Configuration', () => {
    it('should have the correct initial state structure', () => {
      const state = store.getState();
      
      expect(state).toHaveProperty('interview');
      expect(state).toHaveProperty('candidates');
      expect(state).toHaveProperty('ui');
    });

    it('should have proper initial values', () => {
      const state = store.getState();
      
      expect(state.interview.currentSession).toBeNull();
      expect(state.interview.isInterviewActive).toBe(false);
      expect(state.candidates.list).toEqual([]);
      expect(state.ui.activeTab).toBe('interviewee');
    });
  });

  describe('Interview Slice', () => {
    it('should start an interview correctly', () => {
      const questions: Question[] = [
        {
          id: '1',
          text: 'What is React?',
          difficulty: 'easy',
          timeLimit: 20,
          category: 'Frontend',
          order: 1,
          createdAt: new Date(),
        },
      ];

      store.dispatch(startInterview({
        candidateId: 'candidate-1',
        questions,
      }));

      const state = store.getState();
      expect(state.interview.currentSession).not.toBeNull();
      expect(state.interview.isInterviewActive).toBe(true);
      expect(state.interview.currentSession?.questions).toEqual(questions);
    });

    it('should submit an answer and progress to next question', () => {
      const questions: Question[] = [
        {
          id: '1',
          text: 'Question 1',
          difficulty: 'easy',
          timeLimit: 20,
          category: 'Test',
          order: 1,
          createdAt: new Date(),
        },
        {
          id: '2',
          text: 'Question 2',
          difficulty: 'medium',
          timeLimit: 60,
          category: 'Test',
          order: 2,
          createdAt: new Date(),
        },
      ];

      // Start interview
      store.dispatch(startInterview({
        candidateId: 'candidate-1',
        questions,
      }));

      // Submit answer
      store.dispatch(submitAnswer({
        questionId: '1',
        answer: 'Test answer',
        timeSpent: 15,
      }));

      const state = store.getState();
      expect(state.interview.currentQuestionIndex).toBe(1);
      expect(state.interview.currentSession?.answers).toHaveLength(1);
    });
  });

  describe('Candidate Slice', () => {
    it('should add a candidate correctly', () => {
      const candidate: Candidate = {
        id: 'candidate-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        resumeFile: new File([''], 'resume.pdf', { type: 'application/pdf' }),
        score: 85,
        summary: 'Good candidate',
        interviewDate: new Date(),
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.dispatch(addCandidate(candidate));

      const state = store.getState();
      expect(state.candidates.list).toHaveLength(1);
      expect(state.candidates.list[0].name).toBe('John Doe');
      expect(state.candidates.totalCount).toBe(1);
    });

    it('should filter candidates based on search query', () => {
      const candidates: Candidate[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          resumeFile: new File([''], 'resume.pdf'),
          score: 85,
          summary: 'Good candidate',
          interviewDate: new Date(),
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '098-765-4321',
          resumeFile: new File([''], 'resume.pdf'),
          score: 92,
          summary: 'Excellent candidate',
          interviewDate: new Date(),
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Add candidates
      candidates.forEach(candidate => {
        store.dispatch(addCandidate(candidate));
      });

      // Search for "John"
      store.dispatch(setSearchQuery('John'));

      const state = store.getState();
      expect(state.candidates.filteredList).toHaveLength(1);
      expect(state.candidates.filteredList[0].name).toBe('John Doe');
    });
  });

  describe('UI Slice', () => {
    it('should change active tab', () => {
      store.dispatch(setActiveTab('interviewer'));

      const state = store.getState();
      expect(state.ui.activeTab).toBe('interviewer');
    });

    it('should show notifications', () => {
      store.dispatch(showNotification({
        notification: {
          type: 'success',
          title: 'Test',
          message: 'Test notification',
        },
      }));

      const state = store.getState();
      expect(state.ui.notifications).toHaveLength(1);
      expect(state.ui.notifications[0].message).toBe('Test notification');
    });

    it('should manage welcome back modal state', () => {
      const mockSession = {
        id: 'session-1',
        candidateId: 'candidate-1',
        questions: [],
        answers: [],
        currentQuestionIndex: 0,
        startTime: new Date(),
        status: 'in-progress' as const,
      };

      // Show welcome back modal
      store.dispatch(showWelcomeBackModal(mockSession));

      let state = store.getState();
      expect(state.ui.showWelcomeBack).toBe(true);
      expect(state.ui.welcomeBackSession).toEqual(mockSession);

      // Hide welcome back modal
      store.dispatch(hideWelcomeBackModal());

      state = store.getState();
      expect(state.ui.showWelcomeBack).toBe(false);
      expect(state.ui.welcomeBackSession).toBeNull();
    });

    it('should handle loading states', () => {
      store.dispatch(setLoading(true));
      let state = store.getState();
      expect(state.ui.loading).toBe(true);

      store.dispatch(setLoading(false));
      state = store.getState();
      expect(state.ui.loading).toBe(false);
    });

    it('should handle error states', () => {
      const testError = {
        type: 'GENERAL_ERROR' as const,
        message: 'Test error',
        recoverable: true,
      };

      store.dispatch(setError(testError));
      let state = store.getState();
      expect(state.ui.error).toEqual(testError);

      store.dispatch(clearError());
      state = store.getState();
      expect(state.ui.error).toBeNull();
    });
  });
});