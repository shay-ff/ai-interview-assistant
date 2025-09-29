import React, { useState } from 'react';
import { Card, Input, Button, Space, Typography } from 'antd';
import { SendOutlined, MessageOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

// Simplified chat interface that ALWAYS shows input
const SimpleChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([
    'Welcome! Please introduce yourself to start the interview.',
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    setMessages(prev => [...prev, `You: ${message}`]);
    setMessage('');
    
    // Simple response
    setTimeout(() => {
      setMessages(prev => [...prev, 'AI: Thank you for sharing! Tell me more about your experience.']);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card 
      title={
        <Space>
          <MessageOutlined />
          Simple Chat Test
        </Space>
      }
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        border: '1px solid #f0f0f0', 
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#fafafa'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <Text>{msg}</Text>
          </div>
        ))}
      </div>

      {/* Input - ALWAYS VISIBLE */}
      <div style={{ 
        borderTop: '1px solid #f0f0f0', 
        paddingTop: '16px',
        backgroundColor: '#fff'
      }}>
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          rows={3}
          style={{ marginBottom: '8px' }}
        />
        <div style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!message.trim()}
          >
            Send Message
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SimpleChatInterface;