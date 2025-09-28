import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { InterviewState, StartInterviewPayload, SubmitAnswerPayload, UpdateTimerPayload, RootState } from '../../types/store';
import type { InterviewSession, Question, Answer, QuestionDifficulty } from '../../types/interview';

const initialState: InterviewState = {
  currentSession: null,
  currentQuestionIndex: 0,
  timer: {
    isActive: false,
    remainingTime: 0,
    startTime: 0,
    totalPausedTime: 0,
  },
  isInterviewActive: false,
  error: null,
  loading: false,
};

// Helper function to get time limit based on difficulty
const getTimeLimit = (difficulty: QuestionDifficulty): number => {
  switch (difficulty) {
    case 'easy':
      return 20; // 20 seconds
    case 'medium':
      return 60; // 60 seconds
    case 'hard':
      return 120; // 120 seconds
    default:
      return 60;
  }
};

const interviewSlice = createSlice({
  name: 'interview',
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
    startInterview: (state, action: PayloadAction<StartInterviewPayload>) => {
      const session: InterviewSession = {
        id: Date.now().toString(),
        candidateId: action.payload.candidateId,
        questions: action.payload.questions,
        answers: [],
        currentQuestionIndex: 0,
        startTime: new Date(),
        timerState: {
          isActive: true,
          remainingTime: action.payload.questions[0] ? getTimeLimit(action.payload.questions[0].difficulty) : 60,
          startTime: Date.now(),
          totalPausedTime: 0,
        },
        status: 'in-progress',
      };
      state.currentSession = session;
      state.currentQuestionIndex = 0;
      state.isInterviewActive = true;
      // Set timer for first question
      state.timer = {
        isActive: true,
        remainingTime: session.timerState.remainingTime,
        startTime: session.timerState.startTime,
        totalPausedTime: 0,
      };
    },
    submitAnswer: (state, action: PayloadAction<SubmitAnswerPayload>) => {
      if (state.currentSession) {
        const answer: Answer = {
          questionId: action.payload.questionId,
          text: action.payload.answer,
          timeSpent: action.payload.timeSpent,
          timestamp: new Date(),
        };
        state.currentSession.answers.push(answer);
        
        // Move to next question
        if (state.currentQuestionIndex < state.currentSession.questions.length - 1) {
          state.currentQuestionIndex += 1;
          state.currentSession.currentQuestionIndex = state.currentQuestionIndex;
          
          // Set timer for next question
          const nextQuestion = state.currentSession.questions[state.currentQuestionIndex];
          const timeLimit = getTimeLimit(nextQuestion.difficulty);
          state.timer.remainingTime = timeLimit;
          state.timer.startTime = Date.now();
          state.timer.isActive = true;
          state.currentSession.timerState.remainingTime = timeLimit;
          state.currentSession.timerState.startTime = Date.now();
          state.currentSession.timerState.isActive = true;
        } else {
          // Interview completed
          state.currentSession.status = 'completed';
          state.currentSession.endTime = new Date();
          state.isInterviewActive = false;
          state.timer.isActive = false;
        }
      }
    },
    updateTimer: (state, action: PayloadAction<UpdateTimerPayload>) => {
      state.timer.remainingTime = action.payload.remainingTime;
      state.timer.isActive = action.payload.isActive;
      if (state.currentSession) {
        state.currentSession.timerState.remainingTime = action.payload.remainingTime;
        state.currentSession.timerState.isActive = action.payload.isActive;
      }
    },
    pauseInterview: (state) => {
      state.timer.isActive = false;
      if (state.currentSession) {
        state.currentSession.status = 'paused';
        state.currentSession.timerState.isActive = false;
        state.currentSession.timerState.pausedAt = Date.now();
      }
    },
    resumeInterview: (state) => {
      state.timer.isActive = true;
      if (state.currentSession) {
        state.currentSession.status = 'in-progress';
        state.currentSession.timerState.isActive = true;
        if (state.currentSession.timerState.pausedAt) {
          const pausedDuration = Date.now() - state.currentSession.timerState.pausedAt;
          state.currentSession.timerState.totalPausedTime += pausedDuration;
          state.currentSession.timerState.pausedAt = undefined;
        }
      }
    },
    endInterview: (state) => {
      if (state.currentSession) {
        state.currentSession.status = 'completed';
        state.currentSession.endTime = new Date();
      }
      state.isInterviewActive = false;
      state.timer.isActive = false;
    },
    resetInterview: (state) => {
      state.currentSession = null;
      state.currentQuestionIndex = 0;
      state.timer = {
        isActive: false,
        remainingTime: 0,
        startTime: 0,
        totalPausedTime: 0,
      };
      state.isInterviewActive = false;
      state.error = null;
    },
    nextQuestion: (state) => {
      if (state.currentSession && state.currentQuestionIndex < state.currentSession.questions.length - 1) {
        state.currentQuestionIndex += 1;
        state.currentSession.currentQuestionIndex = state.currentQuestionIndex;
        
        // Set timer for next question
        const nextQuestion = state.currentSession.questions[state.currentQuestionIndex];
        const timeLimit = getTimeLimit(nextQuestion.difficulty);
        state.timer.remainingTime = timeLimit;
        state.timer.startTime = Date.now();
        state.timer.isActive = true;
        state.currentSession.timerState.remainingTime = timeLimit;
        state.currentSession.timerState.startTime = Date.now();
        state.currentSession.timerState.isActive = true;
      }
    },
    timeUp: (state) => {
      // Auto-submit empty answer when time runs out
      if (state.currentSession) {
        const currentQuestion = state.currentSession.questions[state.currentQuestionIndex];
        const answer: Answer = {
          questionId: currentQuestion.id,
          text: '', // Empty answer for timeout
          timeSpent: getTimeLimit(currentQuestion.difficulty),
          timestamp: new Date(),
        };
        state.currentSession.answers.push(answer);
        
        // Move to next question or end interview
        if (state.currentQuestionIndex < state.currentSession.questions.length - 1) {
          state.currentQuestionIndex += 1;
          state.currentSession.currentQuestionIndex = state.currentQuestionIndex;
          
          // Set timer for next question
          const nextQuestion = state.currentSession.questions[state.currentQuestionIndex];
          const timeLimit = getTimeLimit(nextQuestion.difficulty);
          state.timer.remainingTime = timeLimit;
          state.timer.startTime = Date.now();
          state.timer.isActive = true;
          state.currentSession.timerState.remainingTime = timeLimit;
          state.currentSession.timerState.startTime = Date.now();
          state.currentSession.timerState.isActive = true;
        } else {
          // Interview completed
          state.currentSession.status = 'completed';
          state.currentSession.endTime = new Date();
          state.isInterviewActive = false;
          state.timer.isActive = false;
        }
      }
    },
  },
});

// Selectors for interview state
export const selectInterviewState = (state: RootState) => state.interview;

export const selectCurrentSession = createSelector(
  [selectInterviewState],
  (interview) => interview.currentSession
);

export const selectCurrentQuestion = createSelector(
  [selectCurrentSession, selectInterviewState],
  (session, interview) => {
    if (!session || !session.questions.length) return null;
    return session.questions[interview.currentQuestionIndex] || null;
  }
);

export const selectCurrentQuestionIndex = createSelector(
  [selectInterviewState],
  (interview) => interview.currentQuestionIndex
);

export const selectTotalQuestions = createSelector(
  [selectCurrentSession],
  (session) => session?.questions.length || 0
);

export const selectTimer = createSelector(
  [selectInterviewState],
  (interview) => interview.timer
);

export const selectIsInterviewActive = createSelector(
  [selectInterviewState],
  (interview) => interview.isInterviewActive
);

export const selectCanProceedToNext = createSelector(
  [selectCurrentSession, selectCurrentQuestionIndex],
  (session, currentIndex) => {
    if (!session) return false;
    return currentIndex < session.questions.length - 1;
  }
);

export const selectIsLastQuestion = createSelector(
  [selectCurrentSession, selectCurrentQuestionIndex],
  (session, currentIndex) => {
    if (!session) return false;
    return currentIndex === session.questions.length - 1;
  }
);

export const selectProgress = createSelector(
  [selectCurrentQuestionIndex, selectTotalQuestions],
  (currentIndex, totalQuestions) => {
    if (totalQuestions === 0) return 0;
    return ((currentIndex + 1) / totalQuestions) * 100;
  }
);

export const selectInterviewSelector = createSelector(
  [
    selectCurrentSession,
    selectCurrentQuestion,
    selectCurrentQuestionIndex,
    selectTotalQuestions,
    selectTimer,
    selectIsInterviewActive,
    selectCanProceedToNext,
    selectIsLastQuestion,
    selectProgress,
  ],
  (
    currentSession,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    timer,
    isInterviewActive,
    canProceedToNext,
    isLastQuestion,
    progress
  ) => ({
    currentSession,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    timer,
    isInterviewActive,
    canProceedToNext,
    isLastQuestion,
    progress,
  })
);

export const {
  setLoading,
  setError,
  clearError,
  startInterview,
  submitAnswer,
  updateTimer,
  pauseInterview,
  resumeInterview,
  endInterview,
  resetInterview,
  nextQuestion,
  timeUp,
} = interviewSlice.actions;

export default interviewSlice;