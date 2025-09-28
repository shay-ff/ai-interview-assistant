import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UIState, ShowNotificationPayload, RootState } from '../../types/store';
import type { InterviewSession } from '../../types/interview';
import type { ActiveTab, AppError } from '../../types/common';

const initialState: UIState = {
  activeTab: 'interviewee',
  showWelcomeBack: false,
  welcomeBackSession: null,
  loading: false,
  error: null,
  notifications: [],
  theme: 'light',
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Tab management
    setActiveTab: (state, action: PayloadAction<ActiveTab>) => {
      state.activeTab = action.payload;
    },
    
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Error handling
    setError: (state, action: PayloadAction<AppError | string | null>) => {
      if (typeof action.payload === 'string') {
        state.error = {
          type: 'GENERAL_ERROR',
          message: action.payload,
          recoverable: true,
        } as AppError;
      } else {
        state.error = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    
    // Welcome back modal management
    showWelcomeBackModal: (state, action: PayloadAction<InterviewSession>) => {
      state.showWelcomeBack = true;
      state.welcomeBackSession = action.payload;
    },
    hideWelcomeBackModal: (state) => {
      state.showWelcomeBack = false;
      state.welcomeBackSession = null;
    },
    
    // Notification management
    showNotification: (state, action: PayloadAction<ShowNotificationPayload>) => {
      const notification = {
        ...action.payload.notification,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      };
      state.notifications.push(notification);
    },
    dismissNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    // Theme management
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    
    // Sidebar management
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    // Bulk UI state updates
    setUIState: (state, action: PayloadAction<Partial<UIState>>) => {
      Object.assign(state, action.payload);
    },
    
    // Reset UI state (useful for logout or app reset)
    resetUIState: (state) => {
      state.activeTab = 'interviewee';
      state.showWelcomeBack = false;
      state.welcomeBackSession = null;
      state.loading = false;
      state.error = null;
      state.notifications = [];
      // Keep theme and sidebar preferences
    },
  },
});

// Selectors for UI state
export const selectUIState = (state: RootState) => state.ui;

export const selectActiveTab = createSelector(
  [selectUIState],
  (ui) => ui.activeTab
);

export const selectShowWelcomeBack = createSelector(
  [selectUIState],
  (ui) => ui.showWelcomeBack
);

export const selectWelcomeBackSession = createSelector(
  [selectUIState],
  (ui) => ui.welcomeBackSession
);

export const selectUILoading = createSelector(
  [selectUIState],
  (ui) => ui.loading
);

export const selectUIError = createSelector(
  [selectUIState],
  (ui) => ui.error
);

export const selectNotifications = createSelector(
  [selectUIState],
  (ui) => ui.notifications
);

export const selectActiveNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(n => {
    // Filter out expired notifications (if duration is set)
    if (n.duration) {
      const now = new Date().getTime();
      const notificationTime = new Date(n.timestamp).getTime();
      return (now - notificationTime) < (n.duration * 1000);
    }
    return true;
  })
);

export const selectTheme = createSelector(
  [selectUIState],
  (ui) => ui.theme
);

export const selectSidebarCollapsed = createSelector(
  [selectUIState],
  (ui) => ui.sidebarCollapsed
);

// Complex selectors
export const selectHasUnreadNotifications = createSelector(
  [selectActiveNotifications],
  (notifications) => notifications.length > 0
);

export const selectNotificationsByType = createSelector(
  [selectActiveNotifications, (state: RootState, type: string) => type],
  (notifications, type) => notifications.filter(n => n.type === type)
);

export const selectIsIntervieweeTab = createSelector(
  [selectActiveTab],
  (activeTab) => activeTab === 'interviewee'
);

export const selectIsInterviewerTab = createSelector(
  [selectActiveTab],
  (activeTab) => activeTab === 'interviewer'
);

// Combined selector for UI components
export const selectUISelector = createSelector(
  [
    selectActiveTab,
    selectShowWelcomeBack,
    selectWelcomeBackSession,
    selectActiveNotifications,
    selectTheme,
    selectUILoading,
    selectUIError,
  ],
  (
    activeTab,
    showWelcomeBack,
    welcomeBackSession,
    notifications,
    theme,
    loading,
    error
  ) => ({
    activeTab,
    showWelcomeBack,
    welcomeBackSession,
    notifications,
    theme,
    loading,
    error,
  })
);

export const {
  setActiveTab,
  setLoading,
  setError,
  clearError,
  showWelcomeBackModal,
  hideWelcomeBackModal,
  showNotification,
  dismissNotification,
  clearAllNotifications,
  setTheme,
  toggleTheme,
  setSidebarCollapsed,
  toggleSidebar,
  setUIState,
  resetUIState,
} = uiSlice.actions;

export default uiSlice;