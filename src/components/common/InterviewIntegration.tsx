import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, Space, Button, Alert } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { startInterview } from '../../store/slices/interviewSlice';
import { updateInterviewProgress } from '../../store/slices/candidateSlice';
import { aiService } from '../../services/enhancedAIService';
import type { RootState } from '../../store';


const { Title, Text } = Typography;

interface InterviewIntegrationProps {
  candidateId: string;
}

/**
 * Integration component that connects interview flow with candidate data
 * Handles:
 * - AI question generation from resume
 * - Interview session initialization
 * - Real-time progress tracking
 * - Candidate status updates
 */
const InterviewIntegration: React.FC<InterviewIntegrationProps> = ({ candidateId }) => {
  const dispatch = useDispatch();
  const candidate = useSelector((state: RootState) => 
    state.candidates?.list.find(c => c.id === candidateId)
  );
  const currentSession = useSelector((state: RootState) => state.interview?.currentSession);
  
  const handleStartInterview = async () => {
    if (!candidate) return;

    try {
      // Update candidate status to starting
      dispatch(updateInterviewProgress({
        candidateId: candidate.id,
        progress: {
          status: 'in-progress',
          currentQuestion: 0,
          totalQuestions: 5,
          answersSubmitted: 0,
          timeSpent: 0,
        }
      }));

      // Generate AI questions based on resume
      const resumeText = candidate.resumeFile?.content || candidate.summary || '';
      const contactInfo = {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        text: resumeText,
        missing: [],
      };

      const aiResult = await aiService.generateQuestions(resumeText, contactInfo);
      
      // Start interview session with generated questions
      dispatch(startInterview({
        candidateId: candidate.id,
        questions: aiResult.questions,
      }));

      // Update candidate with enhanced summary if available
      if (aiResult.summary) {
        dispatch(updateInterviewProgress({
          candidateId: candidate.id,
          progress: {
            status: 'in-progress',
            currentQuestion: 1,
            totalQuestions: aiResult.questions.length,
            answersSubmitted: 0,
            timeSpent: 0,
          }
        }));
      }

    } catch (error) {
      console.error('Failed to start interview:', error);
    }
  };

  // Monitor interview progress and update candidate status
  useEffect(() => {
    if (currentSession && currentSession.candidateId === candidateId) {
      const progress = {
        status: currentSession.status as any,
        currentQuestion: currentSession.currentQuestionIndex + 1,
        totalQuestions: currentSession.questions.length,
        answersSubmitted: currentSession.answers.length,
        timeSpent: currentSession.startTime ? 
          Math.floor((Date.now() - new Date(currentSession.startTime).getTime()) / 1000) : 0,
      };

      dispatch(updateInterviewProgress({
        candidateId,
        progress,
      }));
    }
  }, [currentSession, candidateId, dispatch]);

  if (!candidate) {
    return (
      <Alert 
        message="Candidate not found" 
        type="error" 
        showIcon 
      />
    );
  }

  const interviewStatus = candidate.interviewProgress?.status || 'not-started';

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={4}>Interview Assistant</Title>
        
        <div>
          <Text strong>Candidate: </Text>
          <Text>{candidate.name}</Text>
        </div>
        
        <div>
          <Text strong>Status: </Text>
          <Text type={interviewStatus === 'completed' ? 'success' : undefined}>
            {interviewStatus.charAt(0).toUpperCase() + interviewStatus.slice(1).replace('-', ' ')}
          </Text>
        </div>

        {candidate.interviewProgress && candidate.interviewProgress.status !== 'not-started' && (
          <div>
            <Text strong>Progress: </Text>
            <Text>
              {candidate.interviewProgress.currentQuestion}/{candidate.interviewProgress.totalQuestions} questions
            </Text>
            <br />
            <Text type="secondary">
              Time spent: {Math.floor(candidate.interviewProgress.timeSpent / 60)}m {candidate.interviewProgress.timeSpent % 60}s
            </Text>
          </div>
        )}

        {interviewStatus === 'not-started' && (
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={handleStartInterview}
            size="large"
          >
            Start AI Interview
          </Button>
        )}

        {interviewStatus === 'completed' && (
          <div>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            <Text type="success">Interview completed successfully!</Text>
          </div>
        )}

        {interviewStatus === 'in-progress' && (
          <Alert 
            message="Interview in progress" 
            description="The candidate is currently answering questions. Timer will start automatically after their introduction."
            type="info" 
            showIcon 
          />
        )}
      </Space>
    </Card>
  );
};

export default InterviewIntegration;