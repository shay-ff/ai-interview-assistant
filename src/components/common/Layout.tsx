import React from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { HomeOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import WelcomeBackModal from './WelcomeBackModal';

const { Header, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Home',
    },
    {
      key: '/interviewee',
      icon: <UserOutlined />,
      label: 'Interviewee',
    },
    {
      key: '/interviewer',
      icon: <TeamOutlined />,
      label: 'Interviewer',
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh', height: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '64px',
        lineHeight: '64px'
      }}>
        <div style={{ 
          color: 'white', 
          fontSize: '20px', 
          fontWeight: 'bold',
          cursor: 'pointer'
        }} onClick={() => navigate('/')}>
          AI Interview Assistant
        </div>
        
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, justifyContent: 'center' }}
        />
        
        <div style={{ width: '200px' }}>
          {/* Future: Add user menu, settings, etc. */}
        </div>
      </Header>
      
      <Content style={{ 
        padding: '0', 
        height: 'calc(100vh - 64px)', 
        overflow: 'auto' 
      }}>
        {children}
      </Content>
      
      <WelcomeBackModal />
    </AntLayout>
  );
};

export default Layout;