import React, { useEffect } from 'react';
import { Typography } from 'antd';
import CandidateTable from '../components/interviewer/CandidateTable';

const { Title } = Typography;

const Interviewer: React.FC = () => {
  // Clear any lingering interview sessions when viewing dashboard
  useEffect(() => {
    // Check if there are completed interviews in localStorage
    const persistedState = localStorage.getItem('persist:interview');
    if (persistedState) {
      try {
        const parsedState = JSON.parse(persistedState);
        const interviewState = JSON.parse(parsedState.currentSession || 'null');
        
        if (interviewState && (interviewState.status === 'completed' || interviewState.status === 'evaluated')) {
          console.log('Clearing completed interview session from dashboard view');
          localStorage.removeItem('persist:interview');
        }
      } catch (error) {
        console.warn('Error checking interview state from dashboard:', error);
        localStorage.removeItem('persist:interview'); // Clear corrupted data
      }
    }
  }, []);
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        padding: '20px',
      }}
    >
      <Title level={2} style={{ marginBottom: '20px' }}>
        Candidate Dashboard
      </Title>

      {/* table fills rest of screen */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <CandidateTable />
      </div>
    </div>
  );
};

export default Interviewer;
