import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, Typography, Space } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! Welcome to your AI interview session. I\'ll be asking you a series of questions based on your resume. Let\'s start with the first question:',
      sender: 'system',
      timestamp: new Date(),
    },
    {
      id: '2',
      text: 'Can you tell me about yourself and your professional background?',
      sender: 'system',
      timestamp: new Date(),
    },
  ]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    setCurrentAnswer('');

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thank you for your answer. Here\'s your next question: What programming languages are you most comfortable with and can you describe a recent project where you used them?',
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsSubmitting(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  return (
    <Card 
      title="Interview Session" 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
    >
      {/* Messages Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px',
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
            disabled={isSubmitting}
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