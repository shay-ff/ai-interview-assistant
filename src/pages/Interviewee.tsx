import React, { useState } from 'react';
import { Steps } from 'antd';
import ResumeUpload from '../components/interviewee/ResumeUpload';
import ChatInterface from '../components/interviewee/ChatInterface';
import Timer from '../components/interviewee/Timer';

const { Step } = Steps;

const Interviewee: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

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
            <ChatInterface />
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
