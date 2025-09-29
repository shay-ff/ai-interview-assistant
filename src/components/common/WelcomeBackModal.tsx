import React from 'react';
import { Modal, Typography, Button, Card, Progress, Tag, Space, Descriptions } from 'antd';
import { ClockCircleOutlined, PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import { hideWelcomeBackModal } from '../../store/slices/uiSlice';
import { restoreSession } from '../../store/slices/interviewSlice';

const { Title, Text } = Typography;

const WelcomeBackModal: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const showWelcomeBack = useSelector((state: RootState) => state.ui.showWelcomeBack);
  const welcomeBackSession = useSelector((state: RootState) => state.ui.welcomeBackSession);
  const selectedCandidate = useSelector((state: RootState) => state.interview.selectedCandidate);

  const handleContinueInterview = () => {
    if (welcomeBackSession) {
      dispatch(restoreSession(welcomeBackSession));
      dispatch(hideWelcomeBackModal());
      navigate('/interviewee');
    }
  };

  const handleStartFresh = () => {
    dispatch(hideWelcomeBackModal());
    navigate('/interviewee');
  };

  const handleClose = () => {
    dispatch(hideWelcomeBackModal());
  };

  if (!welcomeBackSession || !selectedCandidate) {
    return null;
  }

  const progressPercent = welcomeBackSession.questions.length > 0 
    ? Math.round((welcomeBackSession.currentQuestionIndex / welcomeBackSession.questions.length) * 100)
    : 0;

  const timeSpent = welcomeBackSession.startTime 
    ? Math.floor((Date.now() - new Date(welcomeBackSession.startTime).getTime()) / 60000)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'paused': return 'orange';
      case 'awaiting-evaluation': return 'purple';
      default: return 'default';
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlayCircleOutlined />
          <span>Welcome Back!</span>
        </div>
      }
      open={showWelcomeBack}
      onCancel={handleClose}
      footer={null}
      width={600}
      centered
    >
      <div style={{ padding: '16px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 8 }}>
            Hello {selectedCandidate.name}! 👋
          </Title>
          <Text type="secondary">
            We found an unfinished interview session. Would you like to continue where you left off?
          </Text>
        </div>

        <Card 
          style={{ marginBottom: 24 }}
          title="Previous Session Details"
          size="small"
        >
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(welcomeBackSession.status)}>
                {welcomeBackSession.status.replace('-', ' ').toUpperCase()}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Progress">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Progress 
                  percent={progressPercent} 
                  size="small" 
                  style={{ flex: 1 }}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <Text style={{ fontSize: '12px', minWidth: 'fit-content' }}>
                  {welcomeBackSession.currentQuestionIndex}/{welcomeBackSession.questions.length} questions
                </Text>
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="Started">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockCircleOutlined />
                <Text>
                  {new Date(welcomeBackSession.startTime).toLocaleString()}
                  {timeSpent > 0 && (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      ({timeSpent}m ago)
                    </Text>
                  )}
                </Text>
              </div>
            </Descriptions.Item>

            {welcomeBackSession.answers.length > 0 && (
              <Descriptions.Item label="Answers Submitted">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text>{welcomeBackSession.answers.length} answers saved</Text>
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button 
            type="primary" 
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handleContinueInterview}
            style={{ minWidth: 140 }}
          >
            Continue Interview
          </Button>
          
          <Button 
            size="large"
            onClick={handleStartFresh}
            style={{ minWidth: 140 }}
          >
            Start Fresh
          </Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Your progress has been automatically saved. You can continue anytime.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;