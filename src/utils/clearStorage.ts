// Utility to clear redux-persist storage to fix serialization issues
export const clearPersistedState = () => {
  try {
    // Clear localStorage keys related to redux-persist
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('interview-assistant-state')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed localStorage key: ${key}`);
    });
    
    // Also try to remove the main persist key
    localStorage.removeItem('persist:interview-assistant-state');
    localStorage.removeItem('persist:candidates');
    localStorage.removeItem('persist:interview');
    
    console.log('Redux persist storage cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing persisted state:', error);
    return false;
  }
};

// Call this function in development console if needed
if (typeof window !== 'undefined') {
  (window as any).clearPersistedState = clearPersistedState;
}