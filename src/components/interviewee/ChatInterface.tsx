import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, Typography, Space } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { startAutoTimer, submitAnswer, startInterview } from '../../store/slices/interviewSlice';
import { updateInterviewProgress as updateCandidateProgress } from '../../store/slices/candidateSlice';
import { aiService } from '../../services/enhancedAIService';
import type { RootState } from '../../store';

const { Text } = Typography;
const { TextArea } = Input;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const dispatch = useDispatch();
  const selectedCandidate = useSelector((state: RootState) => {
    const candidateId = state.candidates?.selectedCandidate;
    const candidatesList = state.candidates?.list || [];
    
    // If a candidate is selected, use it
    if (candidateId) {
      return candidatesList.find((c: any) => c.id === candidateId) || null;
    }
    
    // Otherwise, auto-select the most recent candidate
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
  
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize welcome messages
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessages: Message[] = [
        {
          id: '1',
          text: selectedCandidate ? 
            `Welcome ${selectedCandidate.name}! I'm your AI interviewer. I've analyzed your resume and prepared personalized questions based on your background and experience.` :
            'Hello! Welcome to your AI interview session. I\'ll be asking you personalized questions based on your resume.',
          sender: 'system',
          timestamp: new Date(),
        },
        {
          id: '2',
          text: 'Let\'s start with your introduction. Please tell me about yourself, your experience, and what interests you about this role. After your introduction, I\'ll begin the technical questions.',
          sender: 'system',
          timestamp: new Date(),
        },
      ];
      setMessages(welcomeMessages);
    }
  }, [selectedCandidate, messages.length]);

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle restored interview sessions
  useEffect(() => {
    if (interviewSession && interviewSession.answers && interviewSession.answers.length > 0) {
      // Rebuild message history from restored session
      const restoredMessages: Message[] = [
        {
          id: '1',
          text: selectedCandidate ? 
            `Welcome back ${selectedCandidate.name}! Continuing your interview session...` :
            'Welcome back! Continuing your interview session...',
          sender: 'system',
          timestamp: new Date(),
        }
      ];

      // Add previous Q&A pairs
      interviewSession.answers.forEach((answer: any, index: number) => {
        const question = interviewSession.questions[index];
        if (question) {
          // Add question message
          restoredMessages.push({
            id: `q-${index}`,
            text: question.text,
            sender: 'system',
            timestamp: new Date(answer.timestamp),
          });

          // Add answer message
          restoredMessages.push({
            id: `a-${index}`,
            text: answer.text,
            sender: 'user',
            timestamp: new Date(answer.timestamp),
          });
        }
      });

      // Add current question if not answered yet
      const currentQuestion = interviewSession.questions[currentQuestionIndex];
      if (currentQuestion && currentQuestionIndex >= interviewSession.answers.length) {
        restoredMessages.push({
          id: `current-q-${currentQuestionIndex}`,
          text: currentQuestion.text,
          sender: 'system',
          timestamp: new Date(),
        });
      }

      setMessages(restoredMessages);
      setQuestionsGenerated(true);
      setHasStartedInterview(true);
    }
  }, [interviewSession, currentQuestionIndex, selectedCandidate]);

  // Initialize interview with AI-generated questions when candidate is selected
  useEffect(() => {
    const initializeInterview = async () => {
      if (selectedCandidate && !questionsGenerated && !interviewSession) {
        try {
          console.log('🤖 Starting Groq AI analysis of resume...');
          
          // Get full resume content (not just summary)
          const resumeText = selectedCandidate.resumeFile?.content || selectedCandidate.summary || '';
          
          if (!resumeText) {
            console.warn('No resume content found for analysis');
            return;
          }

          console.log('📄 Resume content length:', resumeText.length, 'characters');
          
          // First, generate resume summary with Groq
          console.log('📊 Generating resume summary with Groq...');
          const aiSummary = await aiService.generateResumeSummary(resumeText, {
            name: selectedCandidate.name,
            email: selectedCandidate.email,
            phone: selectedCandidate.phone,
            text: resumeText,
            missing: [],
          });
          
          console.log('✅ Resume summary generated:', aiSummary);
          
          // Then generate personalized questions based on full resume content
          console.log('❓ Generating personalized questions with Groq...');
          const contactInfo = {
            name: selectedCandidate.name,
            email: selectedCandidate.email,
            phone: selectedCandidate.phone,
            text: resumeText, // Use full resume content
            missing: [],
          };

          const aiResult = await aiService.generateQuestions(resumeText, contactInfo);
          console.log('🎯 Generated', aiResult.questions.length, 'personalized questions');
          
          // Start interview session with generated questions
          dispatch(startInterview({
            candidateId: selectedCandidate.id,
            questions: aiResult.questions,
          }));

          setQuestionsGenerated(true);

          // Add first real question to messages
          if (aiResult.questions.length > 0) {
            const firstQuestion: Message = {
              id: `q_${aiResult.questions[0].id}`,
              text: aiResult.questions[0].text,
              sender: 'system',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, firstQuestion]);
          }
        } catch (error) {
          console.error('Failed to generate questions with Groq:', error);
          // Use fallback questions if AI fails
          const fallbackQuestions = [
            { 
              id: '1', 
              text: 'Tell me about your professional background and experience.', 
              category: 'General', 
              difficulty: 'easy' as const, 
              timeLimit: 60,
              order: 1,
              createdAt: new Date()
            },
            { 
              id: '2', 
              text: 'What technical skills do you bring to this role?', 
              category: 'Technical', 
              difficulty: 'medium' as const, 
              timeLimit: 90,
              order: 2,
              createdAt: new Date()
            },
            { 
              id: '3', 
              text: 'Describe a challenging project you worked on and how you solved it.', 
              category: 'Problem Solving', 
              difficulty: 'hard' as const, 
              timeLimit: 120,
              order: 3,
              createdAt: new Date()
            },
          ];
          
          dispatch(startInterview({
            candidateId: selectedCandidate.id,
            questions: fallbackQuestions,
          }));
          setQuestionsGenerated(true);
        }
      }
    };

    initializeInterview();
  }, [selectedCandidate, questionsGenerated, interviewSession, dispatch]);

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    setIsSubmitting(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentAnswer,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const answerText = currentAnswer;
    setCurrentAnswer('');

    // Check if this is the first answer (introduction) and auto-start timer
    const userMessages = messages.filter(m => m.sender === 'user');
    if (userMessages.length === 0 && !hasStartedInterview) {
      setHasStartedInterview(true);
      
      console.log('🎬 Introduction completed, starting timed interview...');
      
      // Update candidate progress
      if (selectedCandidate) {
        dispatch(updateCandidateProgress({
          candidateId: selectedCandidate.id,
          progress: {
            status: 'in-progress',
            currentQuestion: 0,
            totalQuestions: interviewSession?.questions.length || 5,
            answersSubmitted: 0,
            timeSpent: 0,
          }
        }));
      }

      // Add transition message and first technical question
      setTimeout(() => {
        if (interviewSession && interviewSession.questions.length > 0) {
          const transitionMessage: Message = {
            id: `transition_${Date.now()}`,
            text: `Thank you for the introduction! Now I'll ask you ${interviewSession.questions.length} technical questions. Let's begin:`,
            sender: 'system',
            timestamp: new Date(),
          };
          
          const firstQuestion = interviewSession.questions[0];
          const firstQuestionMessage: Message = {
            id: `q_${firstQuestion.id}`,
            text: firstQuestion.text,
            sender: 'system',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, transitionMessage, firstQuestionMessage]);
          
          // Start the timer for the first question after displaying it
          setTimeout(() => {
            console.log('⏰ Starting timer for first question...');
            dispatch(startAutoTimer());
          }, 1000);
        }
      }, 1000);
      
      setIsSubmitting(false);
      return;
    }

    // Submit answer to Redux and get next question
    if (interviewSession && interviewSession.questions.length > 0) {
      const currentQuestion = interviewSession.questions[currentQuestionIndex];
      const timeSpent = timerState?.remainingTime ? 
        (currentQuestion.timeLimit - timerState.remainingTime) : 0;
      
      // Submit the answer
      dispatch(submitAnswer({
        questionId: currentQuestion.id,
        answer: answerText,
        timeSpent,
      }));

      // Validate answer with AI in background
      try {
        console.log('Validating answer with Groq AI...');
        const validation = await aiService.validateAnswer(
          currentQuestion.text,
          answerText,
          timeSpent,
          currentQuestion.timeLimit
        );
        
        // Store validation results in candidate progress
        if (selectedCandidate) {
          const answerFeedback = {
            questionId: currentQuestion.id,
            question: currentQuestion.text,
            answer: answerText,
            timeSpent,
            timeLimit: currentQuestion.timeLimit,
            score: validation.score,
            feedback: validation.feedback,
            strengths: validation.strengths,
            improvements: validation.improvements,
            confidence: validation.confidence,
            timestamp: new Date(),
          };

          // Get existing feedback array or initialize empty
          const existingProgress = selectedCandidate.interviewProgress;
          const existingFeedback = existingProgress?.allAnswersFeedback || [];

          dispatch(updateCandidateProgress({
            candidateId: selectedCandidate.id,
            progress: {
              status: 'in-progress',
              currentQuestion: currentQuestionIndex + 1,
              totalQuestions: interviewSession.questions.length,
              answersSubmitted: currentQuestionIndex + 1,
              timeSpent: 0,
              lastAnswerFeedback: answerFeedback,
              allAnswersFeedback: [...existingFeedback, answerFeedback],
            }
          }));
        }

        console.log(`Answer validated - Score: ${validation.score}/100`);
      } catch (error) {
        console.warn('Failed to validate answer:', error);
      }

      // Add next question or completion message
      setTimeout(() => {
        const nextQuestionIndex = currentQuestionIndex + 1;
        
        if (nextQuestionIndex < interviewSession.questions.length) {
          // Add next question (clean format without tags)
          const nextQuestion = interviewSession.questions[nextQuestionIndex];
          const aiMessage: Message = {
            id: `q_${nextQuestion.id}`,
            text: `Question ${nextQuestionIndex + 1}/${interviewSession.questions.length}: ${nextQuestion.text}`,
            sender: 'system',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          // Interview completed
          const completionMessage: Message = {
            id: `completion_${Date.now()}`,
            text: 'Congratulations! You have completed all the questions. Thank you for your time. Your responses have been recorded and will be reviewed by our team.',
            sender: 'system',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, completionMessage]);
          
          // Update final candidate status
          if (selectedCandidate) {
            dispatch(updateCandidateProgress({
              candidateId: selectedCandidate.id,
              progress: {
                status: 'completed',
                currentQuestion: interviewSession.questions.length,
                totalQuestions: interviewSession.questions.length,
                answersSubmitted: interviewSession.questions.length,
                timeSpent: 0,
              }
            }));
          }
        }
      }, 500);
    }

    setIsSubmitting(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  return (
    <Card
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <Text strong>AI Interview Session</Text>
          {selectedCandidate && (
            <Text type="secondary">- {selectedCandidate.name}</Text>
          )}
        </Space>
      }
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {/* Messages Area */}
      <div style={{ 
        flex: 1, 
        padding: '16px', 
        overflowY: 'auto', 
        borderBottom: '1px solid #f0f0f0'
      }}>
        <List
          dataSource={messages}
          renderItem={(message) => (
            <List.Item style={{ border: 'none', padding: '8px 0' }}>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={message.sender === 'system' ? <RobotOutlined /> : <UserOutlined />}
                    style={{ 
                      backgroundColor: message.sender === 'system' ? '#1890ff' : '#52c41a' 
                    }}
                  />
                }
                title={
                  <Space>
                    <Text strong>
                      {message.sender === 'system' ? 'AI Interviewer' : 'You'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {message.timestamp.toLocaleTimeString()}
                    </Text>
                  </Space>
                }
                description={
                  <Text style={{ whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px' }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer here... (Press Enter to send, Shift+Enter for new line)"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmitAnswer}
            loading={isSubmitting}
            disabled={!currentAnswer.trim()}
            style={{ height: 'auto' }}
          >
            Send
          </Button>
        </Space.Compact>
      </div>
    </Card>
  );
};

export default ChatInterface;