import { persistReducer, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import interviewSlice from '../slices/interviewSlice';
import candidateSlice from '../slices/candidateSlice';
import uiSlice from '../slices/uiSlice';

// Transform for handling File objects in candidate data
const fileTransform = createTransform(
  // Transform state on its way to being serialized and persisted
  (inboundState: any) => {
    if (inboundState && inboundState.list) {
      return {
        ...inboundState,
        list: inboundState.list.map((candidate: any) => {
          if (candidate.resumeFile instanceof File) {
            // Convert File to serializable format
            return {
              ...candidate,
              resumeFile: {
                name: candidate.resumeFile.name,
                size: candidate.resumeFile.size,
                type: candidate.resumeFile.type,
                lastModified: candidate.resumeFile.lastModified,
                // Store file content as base64 for persistence
                content: null, // Will be handled by file reading service
                isPersistedFile: true,
              },
            };
          }
          return candidate;
        }),
      };
    }
    return inboundState;
  },
  // Transform state being rehydrated
  (outboundState: any) => {
    if (outboundState && outboundState.list) {
      return {
        ...outboundState,
        list: outboundState.list.map((candidate: any) => {
          if (candidate.resumeFile && candidate.resumeFile.isPersistedFile) {
            // Create a placeholder File object for persisted files
            // Note: Actual file content will need to be re-uploaded or cached separately
            const fileData = candidate.resumeFile;
            const file = new File([], fileData.name, {
              type: fileData.type,
              lastModified: fileData.lastModified,
            });
            return {
              ...candidate,
              resumeFile: file,
            };
          }
          return candidate;
        }),
      };
    }
    return outboundState;
  },
  // Apply transform only to candidates slice
  { whitelist: ['candidates'] }
);

// Transform for handling Date objects in interview sessions
const dateTransform = createTransform(
  // Serialize dates to ISO strings
  (inboundState: any) => {
    if (inboundState && inboundState.currentSession) {
      const session = inboundState.currentSession;
      return {
        ...inboundState,
        currentSession: {
          ...session,
          startTime: session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime,
          endTime: session.endTime instanceof Date ? session.endTime.toISOString() : session.endTime,
          answers: session.answers.map((answer: any) => ({
            ...answer,
            timestamp: answer.timestamp instanceof Date ? answer.timestamp.toISOString() : answer.timestamp,
          })),
          questions: session.questions.map((question: any) => ({
            ...question,
            createdAt: question.createdAt instanceof Date ? question.createdAt.toISOString() : question.createdAt,
          })),
        },
      };
    }
    return inboundState;
  },
  // Deserialize ISO strings back to Date objects
  (outboundState: any) => {
    if (outboundState && outboundState.currentSession) {
      const session = outboundState.currentSession;
      return {
        ...outboundState,
        currentSession: {
          ...session,
          startTime: typeof session.startTime === 'string' ? new Date(session.startTime) : session.startTime,
          endTime: session.endTime && typeof session.endTime === 'string' ? new Date(session.endTime) : session.endTime,
          answers: session.answers.map((answer: any) => ({
            ...answer,
            timestamp: typeof answer.timestamp === 'string' ? new Date(answer.timestamp) : answer.timestamp,
          })),
          questions: session.questions.map((question: any) => ({
            ...question,
            createdAt: typeof question.createdAt === 'string' ? new Date(question.createdAt) : question.createdAt,
          })),
        },
      };
    }
    return outboundState;
  },
  { whitelist: ['interview'] }
);

// Main persistence configuration
const persistConfig = {
  key: 'interview-assistant-state',
  storage,
  whitelist: ['candidates', 'interview'], // Only persist these slices
  blacklist: ['ui'], // Don't persist UI state
  transforms: [fileTransform, dateTransform],
  // Throttle writes to avoid excessive persistence calls
  throttle: 1000,
};

// Individual slice persistence configs for more granular control
const candidatePersistConfig = {
  key: 'candidates',
  storage,
  transforms: [fileTransform],
};

const interviewPersistConfig = {
  key: 'interview',
  storage,
  transforms: [dateTransform],
  // Don't persist timer state as it should reset on app restart
  blacklist: ['timer'],
};

// Root reducer with all slices
const rootReducer = combineReducers({
  interview: persistReducer(interviewPersistConfig, interviewSlice.reducer),
  candidates: persistReducer(candidatePersistConfig, candidateSlice.reducer),
  ui: uiSlice.reducer, // Not persisted
});

export const persistedReducer = persistReducer(persistConfig, rootReducer);
export type RootState = ReturnType<typeof rootReducer>;