import type { ContactInfo } from '../types/candidate';

interface ResumeParseDebugData {
  timestamp: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  contactInfo: ContactInfo;
}

class DebugApi {
  private static readonly STORAGE_KEY = 'resume_parse_debug_data';

  // Store parsed resume data
  static storeResumeData(data: Omit<ResumeParseDebugData, 'timestamp'>) {
    const debugData: ResumeParseDebugData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(debugData));
      console.log('Resume debug data stored:', debugData);
    } catch (error) {
      console.error('Failed to store debug data:', error);
    }
  }

  // Get the latest parsed resume data
  static getLatestResumeData(): ResumeParseDebugData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve debug data:', error);
      return null;
    }
  }

  // Clear stored debug data
  static clearDebugData() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Debug data cleared');
    } catch (error) {
      console.error('Failed to clear debug data:', error);
    }
  }

  // Get debug data as formatted JSON string
  static getFormattedDebugData(): string {
    const data = this.getLatestResumeData();
    return data ? JSON.stringify(data, null, 2) : 'No debug data available';
  }
}

// Make it available globally for browser console access
(window as any).ResumeDebugApi = DebugApi;

// Log when debug API is initialized
console.log('ResumeDebugApi initialized and available globally');

export default DebugApi;