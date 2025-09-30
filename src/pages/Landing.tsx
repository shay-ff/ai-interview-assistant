import React from 'react';
import { Button, Row, Col, Typography, Card } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: '40px 20px',
      }}
    >
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '48px',
        maxWidth: '700px'
      }}>
        <Title 
          level={1} 
          style={{ 
            fontSize: '42px',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          🤖 AI Interview Assistant
        </Title>
        <Paragraph style={{ 
          fontSize: '20px', 
          color: '#666',
          lineHeight: '1.6',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          Experience the future of interviews with our AI-powered platform
        </Paragraph>
      </div>

      <Row gutter={[40, 32]} justify="center" style={{ width: '100%', maxWidth: '800px' }}>
        <Col xs={24} sm={12} md={10}>
          <Card
            hoverable
            style={{ 
              textAlign: 'center', 
              height: '320px',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #e8e8e8'
            }}
            cover={
              <div style={{ 
                padding: '32px', 
                fontSize: '64px', 
                color: '#1890ff',
                background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)'
              }}>
                <UserOutlined />
              </div>
            }
            actions={[
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/interviewee')}
                style={{ 
                  width: '85%',
                  height: '44px',
                  borderRadius: '8px',
                  fontWeight: '500'
                }}
              >
                Start Interview
              </Button>,
            ]}
          >
            <Card.Meta
              title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>Interviewee</span>}
              description="Upload your resume and participate in an AI-powered interview session"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={10}>
          <Card
            hoverable
            style={{ 
              textAlign: 'center', 
              height: '320px',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #e8e8e8'
            }}
            cover={
              <div style={{ 
                padding: '32px', 
                fontSize: '64px', 
                color: '#52c41a',
                background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)'
              }}>
                <TeamOutlined />
              </div>
            }
            actions={[
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/interviewer')}
                style={{ 
                  width: '85%',
                  height: '44px',
                  borderRadius: '8px',
                  fontWeight: '500'
                }}
              >
                View Dashboard
              </Button>,
            ]}
          >
            <Card.Meta
              title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>Interviewer</span>}
              description="Review candidate submissions and manage interview sessions"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Landing;