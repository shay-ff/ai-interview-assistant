import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, Typography, Space, Progress, Spin } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { 
  startInterview, 
  startTechnicalPhase, 
  collectAnswer, 
  setBatchEvaluationResult,
  resetInterview
} from '../../store/slices/interviewSlice';
import { updateInterviewProgress as updateCandidateProgress } from '../../store/slices/candidateSlice';
import OptimizedAIService from '../../services/optimizedAIService';
import type { RootState } from '../../store';

const { Text } = Typography;
const { TextArea } = Input;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

const OptimizedChatInterface: React.FC = () => {
  const dispatch = useDispatch();
  
  // Redux selectors
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
  
  const interviewSession = useSelector((state: RootState) => state.interview?.currentSession);
  const currentQuestionIndex = useSelector((state: RootState) => state.interview?.currentQuestionIndex || 0);
  const timerState = useSelector((state: RootState) => state.interview?.timer);
  const isIntroductionPhase = useSelector((state: RootState) => state.interview?.isIntroductionPhase ?? true);
  
  // Debug logging (can be removed in production)
  console.log('Interview State:', {
    hasCandidate: !!selectedCandidate,
    hasSession: !!interviewSession,
    sessionStatus: interviewSession?.status,
    isIntroPhase: isIntroductionPhase,
    questionIndex: currentQuestionIndex
  });
  
  // Local state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset interview state on component mount
  useEffect(() => {
    dispatch(resetInterview());
  }, [dispatch]);

  // Initialize welcome messages
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessages: Message[] = [
        {
          id: '1',
          text: selectedCandidate ? 
            `Welcome ${selectedCandidate.name}! I'm your AI interviewer. I've analyzed your resume and prepared personalized questions based on your background and experience.` :
            'Hello! Welcome to your AI interview session.',
          sender: 'system',
          timestamp: new Date(),
        },
        {
          id: '2',
          text: 'Let\'s start with your introduction. Please tell me about yourself, your experience, and what interests you about this role. After your introduction, I\'ll begin the technical questions with timer.',
          sender: 'system',
          timestamp: new Date(),
        },
      ];
      setMessages(welcomeMessages);
    }
  }, [selectedCandidate, messages.length]);

  // Pre-generate questions when candidate is available
  useEffect(() => {
    const generateQuestionsUpfront = async () => {
      if (selectedCandidate && !questionsGenerated && !interviewSession) {
        setIsGeneratingQuestions(true);
        
        try {
          console.log('🤖 Generating questions upfront (Groq Call #1)...');
          
          const resumeText = selectedCandidate.resumeFile?.content || selectedCandidate.summary || '';
          
          if (!resumeText) {
            console.warn('No resume content found for analysis');
            return;
          }

          // OPTIMIZATION: Generate ALL questions in one API call
          const questions = await OptimizedAIService.generateQuestions(
            resumeText,
            'medium',
            5
          );

          console.log('✅ Questions generated successfully:', questions.length);

          // Start interview with pre-generated questions
          dispatch(startInterview({
            candidateId: selectedCandidate.id,
            questions: questions,
          }));

          setQuestionsGenerated(true);
          
          // Add system message about readiness
          const readyMessage: Message = {
            id: Date.now().toString(),
            text: `Perfect! I've prepared ${questions.length} personalized technical questions based on your background. Once you finish your introduction, we'll move to the technical round with timed questions.`,
            sender: 'system',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, readyMessage]);

        } catch (error) {
          console.error('Failed to generate questions:', error);
          
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: 'I encountered an issue preparing your questions. Let\'s proceed with a standard interview format.',
            sender: 'system',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsGeneratingQuestions(false);
        }
      }
    };

    generateQuestionsUpfront();
  }, [selectedCandidate, questionsGenerated, interviewSession, dispatch]);

  // Handle user answers
  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: currentAnswer,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Check if this is still introduction phase
      if (isIntroductionPhase) {
        // Handle introduction
        const introResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Thank you for the introduction! Now let\'s begin the technical questions. Each question will be timed based on its difficulty level. Good luck!',
          sender: 'system',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, introResponse]);

        // Transition to technical phase - TIMER STARTS HERE
        dispatch(startTechnicalPhase());

        // Show first technical question - ENSURE questions exist
        if (interviewSession?.questions && interviewSession.questions.length > 0) {
          const firstQuestion = interviewSession.questions[0];
          const questionMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: `**Question 1 of ${interviewSession.questions.length}**\n\n${firstQuestion.text}`,
            sender: 'system',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, questionMessage]);
        } else {
          // Emergency: Generate questions if none exist
          console.warn('⚠️ No questions found after intro, generating now...');
          try {
            const mockQuestions = [
              {
                id: 'emergency_1',
                text: 'Tell me about your experience with React and modern frontend development.',
                difficulty: 'medium' as any,
                timeLimit: 60,
                category: 'frontend',
                order: 1,
                createdAt: new Date(),
              },
              {
                id: 'emergency_2',
                text: 'How do you handle state management in React applications?',
                difficulty: 'medium' as any,
                timeLimit: 60,
                category: 'react',
                order: 2,
                createdAt: new Date(),
              }
            ];
            
            dispatch(startInterview({
              candidateId: selectedCandidate?.id || 'temp',
              questions: mockQuestions,
            }));
            
            const questionMessage: Message = {
              id: (Date.now() + 2).toString(),
              text: `**Question 1 of ${mockQuestions.length}**\n\n${mockQuestions[0].text}`,
              sender: 'system',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, questionMessage]);
          } catch (error) {
            console.error('Failed to generate emergency questions:', error);
          }
        }
      } else {
        // Handle technical question answer
        if (interviewSession?.questions && currentQuestionIndex < interviewSession.questions.length) {
          const currentQuestion = interviewSession.questions[currentQuestionIndex];
          const timeSpent = timerState?.startTime ? 
            Math.round((Date.now() - timerState.startTime) / 1000) : 0;

          // OPTIMIZATION: Collect answer without API call
          dispatch(collectAnswer({
            questionId: currentQuestion.id,
            answer: currentAnswer,
            timeSpent,
          }));

          // Check if more questions remain
          if (currentQuestionIndex < interviewSession.questions.length - 1) {
            // Show next question
            const nextQuestion = interviewSession.questions[currentQuestionIndex + 1];
            const questionMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: `**Question ${currentQuestionIndex + 2} of ${interviewSession.questions.length}**\n\n${nextQuestion.text}`,
              sender: 'system',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, questionMessage]);
          } else {
            // All questions answered - start batch evaluation
            handleBatchEvaluation();
          }
        }
      }

      setCurrentAnswer('');
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // OPTIMIZATION: Single batch evaluation at the end
  const handleBatchEvaluation = async () => {
    setIsEvaluating(true);

    const processingMessage: Message = {
      id: Date.now().toString(),
      text: 'Thank you for completing all questions! I\'m now evaluating your responses comprehensively...',
      sender: 'system',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, processingMessage]);

    try {
      if (!interviewSession?.questions || !interviewSession?.answers) {
        throw new Error('Missing interview data for evaluation');
      }

      console.log('🤖 Starting batch evaluation (Groq Call #2)...');

      // OPTIMIZATION: Single API call to evaluate all answers
      const evaluationResult = await OptimizedAIService.evaluateInterviewBatch(
        interviewSession.questions,
        interviewSession.answers,
        selectedCandidate?.resumeFile?.content || selectedCandidate?.summary || ''
      );

      console.log('✅ Batch evaluation completed:', evaluationResult);

      // Store evaluation result in Redux
      dispatch(setBatchEvaluationResult(evaluationResult));

      // Update candidate progress
      if (selectedCandidate) {
        dispatch(updateCandidateProgress({
          candidateId: selectedCandidate.id,
          progress: {
            status: 'completed',
            completedAt: new Date(),
            totalQuestions: interviewSession.questions.length,
            answersSubmitted: interviewSession.answers.length,
          },
        }));
      }

      // Show evaluation results
      const resultMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `🎉 **Interview Complete!**\n\n**Overall Score: ${evaluationResult.overallScore}/100**\n\n**Summary:** ${evaluationResult.summary}\n\n**Key Recommendations:**\n${evaluationResult.recommendations.map(r => `• ${r}`).join('\n')}\n\nThank you for your time! You can view detailed feedback in your results dashboard.`,
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, resultMessage]);

    } catch (error) {
      console.error('Batch evaluation failed:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'I encountered an issue evaluating your responses. Your answers have been saved, and you can check back later for results.',
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  // Show current question progress
  const getProgress = () => {
    if (!interviewSession?.questions || isIntroductionPhase) return 0;
    return ((currentQuestionIndex + 1) / interviewSession.questions.length) * 100;
  };

  const getCurrentPhaseText = () => {
    if (isIntroductionPhase) return 'Introduction Phase';
    if (interviewSession?.status === 'awaiting-evaluation') return 'Evaluation Phase';
    if (interviewSession?.status === 'completed') return 'Interview Complete';
    return `Question ${currentQuestionIndex + 1} of ${interviewSession?.questions?.length || 0}`;
  };

  return (
    <Card 
      title={
        <Space>
          <RobotOutlined />
          <span>AI Interview Assistant</span>
          {!isIntroductionPhase && (
            <Text type="secondary">({getCurrentPhaseText()})</Text>
          )}
        </Space>
      }
      className="chat-container"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}
    >
      {/* Progress indicator */}
      {!isIntroductionPhase && interviewSession?.questions && (
        <div style={{ marginBottom: 16 }}>
          <Progress 
            percent={getProgress()} 
            status={interviewSession.status === 'completed' ? 'success' : 'active'}
            format={() => getCurrentPhaseText()}
          />
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
        <List
          dataSource={messages}
          renderItem={(message) => (
            <List.Item style={{ border: 'none', padding: '8px 0' }}>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={message.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{ 
                      backgroundColor: message.sender === 'user' ? '#1890ff' : '#52c41a' 
                    }}
                  />
                }
                title={message.sender === 'user' ? 'You' : 'AI Interviewer'}
                description={
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </div>
                }
              />
            </List.Item>
          )}
        />
        
        {/* Loading indicators */}
        {isGeneratingQuestions && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin /> <Text type="secondary">Generating personalized questions...</Text>
          </div>
        )}
        
        {isEvaluating && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin /> <Text type="secondary">Evaluating your responses...</Text>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - ALWAYS SHOW for now */}
      <div style={{ 
        borderTop: '1px solid #f0f0f0', 
        paddingTop: '16px', 
        marginTop: '16px',
        backgroundColor: '#fff',
        zIndex: 10
      }}>
        <TextArea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            isIntroductionPhase 
              ? "Tell me about yourself, your experience, and interests..."
              : "Type your answer here..."
          }
          rows={3}
          disabled={isSubmitting || isGeneratingQuestions || isEvaluating}
          style={{ marginBottom: '8px' }}
        />
        <div style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmitAnswer}
            disabled={!currentAnswer.trim() || isSubmitting || isGeneratingQuestions || isEvaluating}
            loading={isSubmitting}
            size="large"
          >
            {isIntroductionPhase ? 'Start Technical Questions' : 'Submit Answer'}
          </Button>
        </div>
      </div>

      {/* Timer display for technical questions */}
      {!isIntroductionPhase && timerState?.isActive && (
        <div style={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          background: '#fff',
          padding: '4px 8px',
          borderRadius: 4,
          border: '1px solid #d9d9d9',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <ClockCircleOutlined style={{ color: timerState.remainingTime <= 10 ? '#ff4d4f' : '#1890ff' }} />
          <Text strong style={{ color: timerState.remainingTime <= 10 ? '#ff4d4f' : '#1890ff' }}>
            {Math.max(0, timerState.remainingTime)}s
          </Text>
        </div>
      )}
    </Card>
  );
};

export default OptimizedChatInterface;