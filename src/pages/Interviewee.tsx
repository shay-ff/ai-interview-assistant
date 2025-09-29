import React, { useState, useEffect } from 'react';
import { Steps } from 'antd';
import { useSelector } from 'react-redux';
import ResumeUpload from '../components/interviewee/ResumeUpload';
import OptimizedChatInterface from '../components/interviewee/OptimizedChatInterface';
import Timer from '../components/interviewee/Timer';
import type { RootState } from '../store';

const { Step } = Steps;

const Interviewee: React.FC = () => {
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

  // Auto-advance to interview if candidate exists
  useEffect(() => {
    if (selectedCandidate && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [selectedCandidate, currentStep]);

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
      content: (
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
