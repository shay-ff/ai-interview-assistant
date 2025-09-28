import React, { useState, useEffect } from 'react';
import { Card, Progress, Typography, Button, Space, Tag } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Timer: React.FC = () => {
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = 5;

  useEffect(() => {
    let interval: number | null = null;

    if (isActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsActive(false);
      // Auto-advance to next question when time runs out
      handleNextQuestion();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercent = () => {
    return ((300 - timeRemaining) / 300) * 100;
  };

  const getProgressStatus = () => {
    if (timeRemaining <= 30) return 'exception';
    if (timeRemaining <= 60) return 'active';
    return 'normal';
  };

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setTimeRemaining(300);
    setIsActive(false);
    setIsPaused(false);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(prev => prev + 1);
      setTimeRemaining(300);
      setIsActive(false);
      setIsPaused(false);
    }
  };

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
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
          Question {currentQuestion} of {totalQuestions}
        </Tag>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Title level={1} style={{ 
          fontSize: '48px', 
          margin: 0,
          color: timeRemaining <= 30 ? '#ff4d4f' : timeRemaining <= 60 ? '#faad14' : '#1890ff'
        }}>
          {formatTime(timeRemaining)}
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
              {formatTime(timeRemaining)}
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
            >
              Start Timer
            </Button>
          ) : (
            <Button 
              type={isPaused ? "primary" : "default"}
              icon={<PauseCircleOutlined />}
              onClick={handlePause}
              size="large"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleReset}
            size="large"
          >
            Reset
          </Button>
        </Space>

        {currentQuestion < totalQuestions && (
          <Button 
            type="dashed" 
            onClick={handleNextQuestion}
            style={{ width: '100%' }}
          >
            Next Question ({currentQuestion + 1}/{totalQuestions})
          </Button>
        )}

        {timeRemaining <= 30 && timeRemaining > 0 && (
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
      </Space>
    </Card>
  );
};

export default Timer;