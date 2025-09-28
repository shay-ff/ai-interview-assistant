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
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: '40px 20px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={1}>AI Interview Assistant</Title>
        <Paragraph style={{ fontSize: '18px', color: '#666' }}>
          Choose your role to get started with the interview process
        </Paragraph>
      </div>

      <Row gutter={[32, 32]} justify="center" style={{ width: '100%', maxWidth: '1200px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '300px' }}
            cover={
              <div style={{ padding: '40px', fontSize: '64px', color: '#1890ff' }}>
                <UserOutlined />
              </div>
            }
            actions={[
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/interviewee')}
                style={{ width: '80%' }}
              >
                Start Interview
              </Button>,
            ]}
          >
            <Card.Meta
              title="Interviewee"
              description="Upload your resume and participate in an AI-powered interview session"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '300px' }}
            cover={
              <div style={{ padding: '40px', fontSize: '64px', color: '#52c41a' }}>
                <TeamOutlined />
              </div>
            }
            actions={[
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/interviewer')}
                style={{ width: '80%' }}
              >
                View Dashboard
              </Button>,
            ]}
          >
            <Card.Meta
              title="Interviewer"
              description="Review candidate submissions and manage interview sessions"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Landing;
