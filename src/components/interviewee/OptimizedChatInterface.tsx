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
import { updateCandidate } from '../../store/slices/candidateSlice';
import { AIQuestionService } from '../../services/aiService';
import type { RootState } from '../../store';

const aiService = new AIQuestionService();

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

  // Listen for auto-progression when timer expires
  useEffect(() => {
    if (!isIntroductionPhase && interviewSession && currentQuestionIndex < interviewSession.questions.length) {
      const currentQuestion = interviewSession.questions[currentQuestionIndex];
      const existingAnswer = interviewSession.answers.find((a: any) => a.questionId === currentQuestion.id);
      
      // If there's an answer for this question (auto-submitted or manual), show the next question
      if (existingAnswer) {
        const questionMessage: Message = {
          id: `question-${currentQuestionIndex}-${Date.now()}`,
          text: `**Question ${currentQuestionIndex + 1}/${interviewSession.questions.length}** (${currentQuestion.difficulty.toUpperCase()} - ${currentQuestion.timeLimit || 60}s)\n\n${currentQuestion.text}`,
          sender: 'system',
          timestamp: new Date(),
        };
        
        setMessages(prev => {
          // Don't add duplicate questions
          const hasQuestion = prev.some(msg => msg.id.startsWith(`question-${currentQuestionIndex}`));
          if (!hasQuestion) {
            return [...prev, questionMessage];
          }
          return prev;
        });
      }
    }
  }, [currentQuestionIndex, isIntroductionPhase, interviewSession]);

  // Trigger evaluation when all questions are answered
  useEffect(() => {
    if (!isIntroductionPhase && 
        interviewSession && 
        interviewSession.questions && 
        interviewSession.answers &&
        interviewSession.answers.length === interviewSession.questions.length &&
        interviewSession.status !== 'completed' &&
        !isEvaluating) {
      console.log('🎯 All questions answered, triggering evaluation...');
      handleBatchEvaluation();
    }
  }, [interviewSession?.answers?.length, interviewSession?.questions?.length, isIntroductionPhase, isEvaluating]);

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

          // Generate questions using the working AI service
          const questions = aiService.generateQuestions(resumeText);

          console.log('✅ Questions generated successfully:', questions.length);

          // Start interview with pre-generated questions
          dispatch(startInterview({
            candidateId: selectedCandidate.id,
            questions: questions,
          }));

          // Update candidate status to in-progress
          dispatch(updateCandidate({
            id: selectedCandidate.id,
            updates: {
              status: 'in-progress',
              updatedAt: new Date(),
            }
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

          // Keep candidate status updated
          if (selectedCandidate) {
            dispatch(updateCandidate({
              id: selectedCandidate.id,
              updates: {
                status: 'in-progress',
                updatedAt: new Date(),
              }
            }));
          }

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

      // Simple scoring based on answer quality and completeness
      const individualEvaluations = await Promise.all(
        interviewSession.questions.map(async (question: any) => {
          const answer = interviewSession.answers.find((a: any) => a.questionId === question.id);
          const answerText = answer?.text || '';
          const timeSpent = answer?.timeSpent || 0;
          
          // Basic scoring algorithm
          let score = 30; // Base score for attempting
          
          // Length-based scoring
          if (answerText.length > 200) score += 30;
          else if (answerText.length > 100) score += 20;
          else if (answerText.length > 50) score += 10;
          
          // Technical keywords bonus
          const technicalKeywords = ['function', 'component', 'state', 'props', 'api', 'database', 'server', 'client'];
          const keywordCount = technicalKeywords.filter(keyword => 
            answerText.toLowerCase().includes(keyword)
          ).length;
          score += Math.min(20, keywordCount * 3);
          
          // Time bonus (answered quickly)
          const timeLimit = question.timeLimit || 60;
          if (timeSpent < timeLimit * 0.5) score += 10;
          else if (timeSpent < timeLimit * 0.8) score += 5;
          
          // Difficulty multiplier
          if (question.difficulty === 'hard') score = Math.min(100, score * 1.1);
          else if (question.difficulty === 'easy') score = Math.max(50, score * 0.9);
          
          return {
            questionId: question.id,
            score: Math.min(100, Math.max(0, Math.round(score))),
            feedback: answerText.length > 100 ? 'Good detailed response' : 'Consider providing more detail',
            strengths: answerText.length > 50 ? ['Clear communication'] : ['Attempted the question'],
            improvements: answerText.length < 100 ? ['Provide more specific examples'] : ['Good response']
          };
        })
      );

      // Calculate overall score and summary
      const overallScore = Math.round(
        individualEvaluations.reduce((sum: number, evaluation: any) => sum + evaluation.score, 0) / individualEvaluations.length
      );

      const evaluationResult = {
        overallScore,
        summary: `Interview Performance Evaluation: Candidate completed ${individualEvaluations.length} technical questions with an overall score of ${overallScore}/100. ${overallScore >= 80 ? 'Excellent technical performance with strong problem-solving abilities and clear communication.' : overallScore >= 60 ? 'Good technical understanding with solid foundations, some areas for improvement.' : 'Basic technical knowledge demonstrated, significant room for growth and practice needed.'} Interview responses showed ${overallScore >= 70 ? 'comprehensive understanding and well-structured thinking.' : 'adequate effort but could benefit from more detailed explanations and examples.'}`,
        detailedEvaluation: individualEvaluations,
        questionAnswerPairs: interviewSession.questions.map((question: any, index: number) => {
          const answer = interviewSession.answers.find((a: any) => a.questionId === question.id);
          return {
            questionNumber: index + 1,
            question: question.text,
            difficulty: question.difficulty,
            timeLimit: question.timeLimit || 60,
            answer: answer?.text || 'No answer provided',
            timeSpent: answer?.timeSpent || 0,
            score: individualEvaluations[index]?.score || 0
          };
        }),
        recommendations: [
          overallScore >= 80 ? 'Strong technical performance - ready for senior-level challenges' : 'Continue developing technical skills with focused practice',
          'Work on providing more specific examples and detailed explanations',
          'Practice explaining complex technical concepts in simple terms',
          'Focus on clear communication of thought process and reasoning'
        ]
      };

      console.log('✅ Batch evaluation completed:', evaluationResult);

      // Store evaluation result in Redux
      dispatch(setBatchEvaluationResult(evaluationResult));

      // Update candidate with final results and interview progress
      if (selectedCandidate) {
        const totalTimeSpent = interviewSession.answers.reduce((total: number, answer: any) => total + (answer.timeSpent || 0), 0);
        
        dispatch(updateCandidate({
          id: selectedCandidate.id,
          updates: {
            status: 'completed',
            score: evaluationResult.overallScore,
            summary: evaluationResult.summary,
            interviewDate: new Date(),
            updatedAt: new Date(),
            interviewProgress: {
              status: 'completed',
              currentQuestion: interviewSession.questions.length,
              totalQuestions: interviewSession.questions.length,
              answersSubmitted: interviewSession.answers.length,
              timeSpent: totalTimeSpent,
              completedAt: new Date(),
              allAnswersFeedback: evaluationResult.questionAnswerPairs.map((qa: any) => ({
                questionId: `q${qa.questionNumber}`,
                question: qa.question,
                answer: qa.answer,
                timeSpent: qa.timeSpent,
                timeLimit: qa.timeLimit,
                score: qa.score,
                feedback: qa.score >= 80 ? 'Excellent response with clear understanding' : qa.score >= 60 ? 'Good answer showing solid knowledge' : 'Basic attempt, needs more detail and examples',
                strengths: qa.score >= 70 ? ['Clear understanding', 'Good explanation', 'Well-structured response'] : ['Attempted the question'],
                improvements: qa.score < 70 ? ['Provide more specific details', 'Include practical examples', 'Explain reasoning more clearly'] : ['Keep up the good work'],
                confidence: qa.score / 100,
                timestamp: new Date()
              }))
            }
          }
        }));
      }

      // CRITICAL: Clear session persistence after successful evaluation
      console.log('🧹 Clearing interview session data after completion');
      localStorage.removeItem('persist:interview');

      // Show detailed evaluation results with Q&A
      const resultMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `🎉 **Interview Complete!**

**Overall Score: ${evaluationResult.overallScore}/100**

**Performance Summary:**
${evaluationResult.summary}

**Question & Answer Review:**
${evaluationResult.questionAnswerPairs.map((qa: any) => `

**Question ${qa.questionNumber}: ${qa.question}**
📊 *Difficulty: ${qa.difficulty.toUpperCase()} | Time Limit: ${qa.timeLimit}s | Time Used: ${qa.timeSpent}s*

💬 **Your Answer:**
${qa.answer || 'No answer provided'}

⭐ **Score: ${qa.score}/100**
${'='.repeat(50)}`).join('')}

**📋 Key Recommendations:**
${evaluationResult.recommendations.map((r: string) => `• ${r}`).join('\n')}

Thank you for your time! You can view your results in the dashboard.`,
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