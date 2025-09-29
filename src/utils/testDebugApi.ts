// Test utility for debug API functionality
import DebugApi from './debugApi';

export const testDebugApi = () => {
  console.log('🧪 Testing ResumeDebugApi...');
  
  // Test data
  const testData = {
    fileName: 'test_resume.pdf',
    fileSize: 123456,
    fileType: 'application/pdf',
    contactInfo: {
      text: 'John Doe\nSoftware Engineer\njohn.doe@email.com\n(555) 123-4567\n5 years experience in React and Node.js',
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '(555) 123-4567',
      skills: ['React', 'Node.js', 'JavaScript'],
      experience: '5 years experience',
      education: 'Bachelor of Computer Science',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      portfolio: 'https://johndoe.dev',
      missing: []
    }
  };

  // Store test data
  DebugApi.storeResumeData(testData);
  console.log('✅ Test data stored');

  // Retrieve and display
  const retrieved = DebugApi.getLatestResumeData();
  console.log('📄 Retrieved data:', retrieved);

  // Display formatted
  const formatted = DebugApi.getFormattedDebugData();
  console.log('📋 Formatted data:', formatted);

  return {
    stored: testData,
    retrieved,
    formatted
  };
};

// Make it available globally for testing
(window as any).testDebugApi = testDebugApi;
