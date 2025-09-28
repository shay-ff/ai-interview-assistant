import { configureStore } from '@reduxjs/toolkit';
import { persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { persistedReducer } from './middleware/persistConfig';

// Configure store with proper middleware for redux-persist
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions and Date objects
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
      // Enable thunk middleware for async actions
      thunk: true,
    }),
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor for store hydration/rehydration
export const persistor = persistStore(store, null, () => {
  // Callback fired when rehydration is complete
  console.log('Store rehydration complete');
});

// Store hydration utilities
export const waitForRehydration = (): Promise<void> => {
  return new Promise((resolve) => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      // Check if rehydration is complete by looking for the _persist key
      if ((state as any)._persist?.rehydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
};

// Purge store data (useful for logout or reset functionality)
export const purgeStoredData = async (): Promise<void> => {
  try {
    await persistor.purge();
    console.log('Store data purged successfully');
  } catch (error) {
    console.error('Error purging store data:', error);
    throw error;
  }
};

// Flush pending persistence operations
export const flushPendingPersistence = async (): Promise<void> => {
  try {
    await persistor.flush();
    console.log('Pending persistence operations flushed');
  } catch (error) {
    console.error('Error flushing persistence:', error);
    throw error;
  }
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
export const useAppDispatch = () => store.dispatch;
export const useAppSelector = <T>(selector: (state: RootState) => T): T => selector(store.getState());