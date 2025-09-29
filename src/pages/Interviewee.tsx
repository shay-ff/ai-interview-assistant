import React, { useState, useEffect } from 'react';
import { Steps, Button, Card, Typography, Space } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import ResumeUpload from '../components/interviewee/ResumeUpload';
import OptimizedChatInterface from '../components/interviewee/OptimizedChatInterface';
import Timer from '../components/interviewee/Timer';
import { showWelcomeBackModal } from '../store/slices/uiSlice';
import { startNewInterview } from '../store/slices/interviewSlice';
import type { RootState } from '../store';
import type { InterviewSession } from '../types/interview';

const { Step } = Steps;
const { Title, Text } = Typography;

const Interviewee: React.FC = () => {
  const dispatch = useDispatch();
  
  // Check if there's already a candidate to determine initial step
  const selectedCandidate = useSelector((state: RootState) => {
    const candidateId = state.candidates?.selectedCandidate;
    const candidatesList = state.candidates?.list || [];
    
    if (candidateId) {
      return candidatesList.find(c => c.id === candidateId) || null;
    }
    
    if (candidatesList.length > 0) {
      const mostRecent = candidatesList.reduce((latest, candidate) => {
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
    dispatch(startNewInterview());
    setCurrentStep(0); // Go back to resume upload
  };

  // Check for unfinished interview sessions on component mount
  useEffect(() => {
    const checkForUnfinishedSession = () => {
      // Check for persisted interview session in localStorage
      const persistedState = localStorage.getItem('persist:interview');
      if (persistedState) {
        try {
          const parsedState = JSON.parse(persistedState);
          const interviewState = JSON.parse(parsedState.currentSession || 'null');
          
          if (interviewState && selectedCandidate) {
            const session: InterviewSession = interviewState;
            
            // Check if session is unfinished and belongs to current candidate
            if (
              session.candidateId === selectedCandidate.id &&
              (session.status === 'in-progress' || session.status === 'paused') &&
              session.currentQuestionIndex < session.questions.length
            ) {
              // Show welcome back modal
              dispatch(showWelcomeBackModal(session));
            }
          }
        } catch (error) {
          console.warn('Failed to parse persisted interview state:', error);
        }
      }
    };

    // Only check when component mounts and candidate is available
    if (selectedCandidate) {
      checkForUnfinishedSession();
    }
  }, [selectedCandidate, dispatch]);

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
        <div className="h-full w-full flex items-center justify-center">
          <Card
            style={{ 
              maxWidth: 600, 
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={2} style={{ color: '#52c41a', margin: 0 }}>
                  🎉 Interview Completed!
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Thank you {selectedCandidate?.name} for completing the interview.
                </Text>
              </div>
              
              <div>
                <Text>
                  Your responses have been submitted and will be reviewed by our team. 
                  You can check your results in the dashboard or start a new interview session.
                </Text>
              </div>

              <Space size="middle">
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={handleStartNewInterview}
                >
                  Start New Interview
                </Button>
                <Button 
                  icon={<ReloadOutlined />}
                  size="large"
                  onClick={() => window.location.href = '/interviewer'}
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
            <Timer />
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
