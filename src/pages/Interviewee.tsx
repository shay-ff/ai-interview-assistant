import React, { useState, useEffect, useRef } from 'react';
import { Steps, Button, Card, Typography, Space } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import ResumeUpload from '../components/interviewee/ResumeUpload';
import OptimizedChatInterface from '../components/interviewee/OptimizedChatInterface';
import Timer from '../components/interviewee/Timer';
import { showWelcomeBackModal } from '../store/slices/uiSlice';
import { resetInterview } from '../store/slices/interviewSlice';
import { clearCandidates } from '../store/slices/candidateSlice';
import type { RootState } from '../store';
import type { InterviewSession } from '../types/interview';

const { Step } = Steps;
const { Title, Text } = Typography;

const Interviewee: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const hasCheckedForSession = useRef(false);
  
  // Check if there's already a candidate to determine initial step
  const selectedCandidate = useSelector((state: RootState) => {
    const candidateId = state.candidates?.selectedCandidate;
    const candidatesList = state.candidates?.list || [];
    
    if (candidateId) {
      return candidatesList.find((c: any) => c.id === candidateId) || null;
    }
    
    if (candidatesList.length > 0) {
      const mostRecent = candidatesList.reduce((latest: any, candidate: any) => {
        const candidateDate = new Date(candidate.createdAt);
        const latestDate = new Date(latest.createdAt);
        return candidateDate > latestDate ? candidate : latest;
      });
      return mostRecent;
    }
    
    return null;
  });

  // Initialize step based on whether candidate exists
  const [currentStep, setCurrentStep] = useState(() => {
    // Check localStorage first, then candidate existence
    const savedStep = localStorage.getItem('interviewee-current-step');
    if (savedStep) {
      return parseInt(savedStep, 10);
    }
    return selectedCandidate ? 1 : 0;
  });

  // Handle navigation state for step reset
  useEffect(() => {
    const state = location.state as { resetToStep?: number; clearSession?: boolean } | null;
    if (state?.resetToStep !== undefined) {
      console.log('Resetting to step:', state.resetToStep);
      setCurrentStep(state.resetToStep);
      
      // If clearSession flag is set, clear all persistent data
      if (state.clearSession) {
        console.log('Clearing all session data for fresh start');
        localStorage.removeItem('persist:interview');
        localStorage.removeItem('persist:candidates');
        localStorage.removeItem('interviewee-current-step');
        hasCheckedForSession.current = false; // Reset session check flag
      }
      
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Persist step changes
  useEffect(() => {
    localStorage.setItem('interviewee-current-step', currentStep.toString());
  }, [currentStep]);

  // Get current interview session
  const currentSession = useSelector((state: RootState) => state.interview?.currentSession);
  
  // Check if interview is completed
  const isInterviewCompleted = currentSession?.status === 'completed';
  
  // Auto-advance to interview if candidate exists (but not if interview is completed)
  useEffect(() => {
    if (selectedCandidate && currentStep === 0) {
      // Check if there's a completed interview - if so, don't auto-advance
      if (!isInterviewCompleted) {
        setCurrentStep(1);
      }
    }
  }, [selectedCandidate, currentStep, isInterviewCompleted]);

  // Auto-advance to completion step when interview is completed
  useEffect(() => {
    if (isInterviewCompleted && currentStep === 1) {
      setCurrentStep(1); // Keep on step 1 but show completion UI
    }
  }, [isInterviewCompleted, currentStep]);

  // Handle starting a new interview
  const handleStartNewInterview = () => {
    // Clear all persistent data for completely fresh start
    localStorage.removeItem('persist:interview');
    localStorage.removeItem('persist:candidates');
    localStorage.removeItem('interviewee-current-step');
    
    // Reset session check flag
    hasCheckedForSession.current = false;
    
    // CRITICAL: Clear Redux state for fresh start
    dispatch(resetInterview());
    dispatch(clearCandidates()); // Clear all candidates
    
    // Go back to resume upload
    setCurrentStep(0);
    
    console.log('Started completely new interview session with cleared candidate');
  };

  // Check for unfinished interview sessions ONLY on component mount
  useEffect(() => {
    const checkForUnfinishedSession = () => {
      // Don't show modal if interview is currently active
      if (currentStep === 2) {
        console.log('Interview is active, skipping welcome back modal');
        return;
      }

      // Check for persisted interview session in localStorage
      const persistedState = localStorage.getItem('persist:interview');
      if (persistedState) {
        try {
          const parsedState = JSON.parse(persistedState);
          const interviewState = JSON.parse(parsedState.currentSession || 'null');
          
          if (interviewState && selectedCandidate) {
            const session: InterviewSession = interviewState;
            
            // Enhanced validation - check if session is actually resumable
            const isValidSession = (
              session.candidateId === selectedCandidate.id &&
              (session.status === 'in-progress' || session.status === 'paused') &&
              session.currentQuestionIndex < session.questions.length &&
              session.questions && session.questions.length > 0 &&
              session.startTime && // Ensure session actually started
              Date.now() - new Date(session.startTime).getTime() < 24 * 60 * 60 * 1000 // Less than 24 hours old
            );
            
            if (isValidSession) {
              console.log('Found valid unfinished session, showing welcome back modal');
              // Show welcome back modal
              dispatch(showWelcomeBackModal(session));
            } else {
              console.log('Session exists but not valid for resuming, clearing...');
              localStorage.removeItem('persist:interview');
            }
          }
        } catch (error) {
          console.warn('Failed to parse persisted interview state:', error);
          // Clear corrupted data
          localStorage.removeItem('persist:interview');
        }
      }
    };

    // Only check ONCE when component mounts - use a ref to track if already checked
    if (selectedCandidate && !hasCheckedForSession.current) {
      hasCheckedForSession.current = true;
      checkForUnfinishedSession();
    }
  }, []); // Empty dependency array - only run on mount

  const steps = [
    {
      title: 'Upload Resume',
      content: (
        <div className="h-full w-full flex items-center justify-center">
          <ResumeUpload onUploadComplete={() => setCurrentStep(1)} />
        </div>
      ),
    },
    {
      title: 'Interview Session',
      content: isInterviewCompleted ? (
        // Show completion UI
        <div 
          style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            padding: '20px'
          }}
        >
          <Card
            style={{ 
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              border: '1px solid #e8e8e8',
              margin: '0 auto'
            }}
            bodyStyle={{ padding: '40px 32px' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <Title level={2} style={{ color: '#52c41a', margin: '0 0 8px 0' }}>
                  Interview Completed!
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Thank you <strong>{selectedCandidate?.name}</strong> for completing the interview.
                </Text>
              </div>
              
              <div 
                style={{
                  padding: '20px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8'
                }}
              >
                <Text style={{ lineHeight: '1.5' }}>
                  Your responses have been submitted and evaluated by our AI system. 
                  You can check your detailed results in the dashboard or start a new interview session.
                </Text>
              </div>

              <Space size="large" style={{ justifyContent: 'center', width: '100%' }}>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={handleStartNewInterview}
                  style={{
                    height: '44px',
                    minWidth: '160px',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                >
                  Start New Interview
                </Button>
                <Button 
                  icon={<ReloadOutlined />}
                  size="large"
                  onClick={() => window.location.href = '/interviewer'}
                  style={{
                    height: '44px',
                    minWidth: '140px',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                >
                  View Dashboard
                </Button>
              </Space>
            </Space>
          </Card>
        </div>
      ) : (
        // Show normal interview UI
        <div
          style={{
            display: 'flex',
            gap: '20px',
            height: '100%',
            width: '100%',
          }}
        >
          <div style={{ flex: 1, overflow: 'auto' }}>
            <OptimizedChatInterface />
          </div>
          <div style={{ width: '320px' }}>
            <Timer 
              timeLimit={1800} // 30 minutes default
              onTimeUp={() => {
                console.log('Time is up!');
                // Handle time up logic
              }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
      }}
    >
      <div style={{ padding: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <Title level={3} style={{ margin: 0 }}>
            AI Interview Assistant
          </Title>
          {(selectedCandidate || currentStep > 0) && (
            <Button 
              icon={<PlusOutlined />}
              onClick={handleStartNewInterview}
              type="default"
            >
              Start New Interview
            </Button>
          )}
        </div>
        <Steps current={currentStep}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
      </div>

      {/* Step content takes the rest of the screen */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '16px' }}>
        {steps[currentStep].content}
      </div>
    </div>
  );
};

export default Interviewee;