import React, { useState, useEffect, useCallback } from 'react';
import { Card, Progress, Typography, Button, Space, Tag, App } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { 
  updateTimer, 
  pauseInterview, 
  resumeInterview, 
  timeUp,
  selectTimer,
  selectCurrentQuestionIndex,
  selectTotalQuestions,
  selectIsInterviewActive,
  selectCurrentQuestion 
} from '../../store/slices/interviewSlice';
import type { RootState } from '../../store';

const { Title, Text } = Typography;

interface TimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  onTick?: (timeLeft: number) => void;
  autoStart?: boolean;
  autoSubmit?: boolean;
  showTimeLimit?: boolean;
  warningThreshold?: number;
  style?: React.CSSProperties;
}

const Timer: React.FC<TimerProps> = ({ 
  timeLimit,
  onTimeUp,
  autoSubmit = true 
}) => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  
  // Get timer state from Redux using selectors
  const timer = useSelector(selectTimer);
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
  const totalQuestions = useSelector(selectTotalQuestions);
  const isInterviewActive = useSelector(selectIsInterviewActive);
  const currentQuestion = useSelector(selectCurrentQuestion);
  
  // OPTIMIZATION: Check if we're in introduction phase
  const isIntroductionPhase = useSelector((state: RootState) => state.interview?.isIntroductionPhase);

  // Local state for UI updates
  const [localTimeRemaining, setLocalTimeRemaining] = useState(timer.remainingTime);
  const [isActive, setIsActive] = useState(timer.isActive);

  // Sync local state with Redux state when it changes
  useEffect(() => {
    setLocalTimeRemaining(timer.remainingTime);
    setIsActive(timer.isActive);
  }, [timer]);

  // Handle timer expiration and auto-submit
  const handleTimeUp = useCallback(() => {
    setIsActive(false);
    
    if (autoSubmit) {
      // Dispatch timeUp action which handles auto-submitting empty answer
      dispatch(timeUp());
      message.warning('Time is up! Moving to next question...');
    }
    
    if (onTimeUp) {
      onTimeUp();
    }
  }, [autoSubmit, dispatch, message, onTimeUp]);

  // Main timer logic - ONLY runs during technical phase
  useEffect(() => {
    let interval: number | null = null;
    let lastReduxUpdate = 0;
    const REDUX_UPDATE_INTERVAL = 5000; // Update Redux every 5 seconds instead of every second

    // OPTIMIZATION: Timer only runs when NOT in introduction phase
    if (isActive && localTimeRemaining > 0 && isInterviewActive && !isIntroductionPhase) {
      interval = setInterval(() => {
        setLocalTimeRemaining((prevTime: number) => {
          const newTime = prevTime - 1;
          const now = Date.now();
          
          // Only update Redux occasionally to prevent performance issues
          if (now - lastReduxUpdate >= REDUX_UPDATE_INTERVAL || newTime <= 10 || newTime === 0) {
            lastReduxUpdate = now;
            dispatch(updateTimer({
              remainingTime: newTime,
              isActive: true,
            }));
          }
          
          // Auto-submit when time reaches 0
          if (newTime === 0) {
            handleTimeUp();
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, localTimeRemaining, isInterviewActive, isIntroductionPhase, dispatch, handleTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercent = () => {
    const limit = timeLimit || timer.remainingTime || 60;
    return ((limit - localTimeRemaining) / limit) * 100;
  };

  const getProgressStatus = () => {
    if (localTimeRemaining <= 10) return 'exception';
    if (localTimeRemaining <= 30) return 'active';
    return 'normal';
  };

  const handleStart = () => {
    setIsActive(true);
    dispatch(updateTimer({
      remainingTime: localTimeRemaining,
      isActive: true,
    }));
  };

  const handlePause = () => {
    if (isActive) {
      dispatch(pauseInterview());
    } else {
      dispatch(resumeInterview());
    }
  };

  const handleReset = () => {
    const resetTime = timeLimit || (currentQuestion ? 
      (currentQuestion.difficulty === 'easy' ? 20 : 
       currentQuestion.difficulty === 'medium' ? 60 : 120) : 60);
    
    setLocalTimeRemaining(resetTime);
    setIsActive(false);
    
    dispatch(updateTimer({
      remainingTime: resetTime,
      isActive: false,
    }));
  };

  // Show warning when time is low
  useEffect(() => {
    if (localTimeRemaining === 30 && isActive) {
      message.warning('30 seconds remaining!');
    } else if (localTimeRemaining === 10 && isActive) {
      message.error('10 seconds remaining!');
    }
  }, [localTimeRemaining, isActive, message]);

  const getTimeColor = () => {
    if (localTimeRemaining <= 10) return '#ff4d4f';
    if (localTimeRemaining <= 30) return '#faad14';
    return '#1890ff';
  };

  // OPTIMIZATION: Don't show timer during introduction phase
  if (isIntroductionPhase) {
    return (
      <Card 
        title={
          <Space>
            <ClockCircleOutlined />
            Interview Status
          </Space>
        }
        style={{ height: '100%' }}
      >
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>
            🎤 Introduction Phase
          </div>
          <Text type="secondary">
            Take your time to introduce yourself. The timer will start when we begin the technical questions.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <ClockCircleOutlined />
          Question Timer
        </Space>
      }
      style={{ height: '100%' }}
    >
      {totalQuestions > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Tag>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Title level={1} style={{ 
          fontSize: '48px', 
          margin: 0,
          color: getTimeColor()
        }}>
          {formatTime(localTimeRemaining)}
        </Title>
        <Text type="secondary">Time Remaining</Text>
      </div>

      <Progress
        type="circle"
        percent={getProgressPercent()}
        status={getProgressStatus()}
        size={120}
        style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}
        format={() => (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {formatTime(localTimeRemaining)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              remaining
            </div>
          </div>
        )}
      />

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          {!isActive ? (
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={handleStart}
              size="large"
              disabled={!isInterviewActive}
            >
              Start Timer
            </Button>
          ) : (
            <Button 
              type="default"
              icon={<PauseCircleOutlined />}
              onClick={handlePause}
              size="large"
              disabled={!isInterviewActive}
            >
              Pause
            </Button>
          )}
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleReset}
            size="large"
            disabled={!isInterviewActive}
          >
            Reset
          </Button>
        </Space>

        {localTimeRemaining <= 30 && localTimeRemaining > 0 && isActive && (
          <div style={{ 
            padding: '8px', 
            backgroundColor: '#fff2f0', 
            border: '1px solid #ffccc7',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <Text type="danger" strong>⚠️ Time running out!</Text>
          </div>
        )}

        {!isActive && isInterviewActive && localTimeRemaining > 0 && (
          <div style={{ 
            padding: '8px', 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <Text style={{ color: '#52c41a' }}>⏸️ Timer Paused</Text>
          </div>
        )}

        {autoSubmit && (
          <div style={{ 
            padding: '8px', 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #91d5ff',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ℹ️ Your answer will be automatically submitted when time runs out
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default Timer;