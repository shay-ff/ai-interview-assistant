import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme, Spin, App as AntApp } from 'antd';
import { store, persistor } from './store';
import Layout from './components/common/Layout';
import Landing from './pages/Landing';
import Interviewee from './pages/Interviewee';
import Interviewer from './pages/Interviewer';
import './utils/debugApi'; // Initialize debug API
import './utils/testDebugApi'; // Initialize test utilities
import './utils/fileTypeDebug'; // Initialize file type debug utilities
import './App.css';

const { defaultAlgorithm } = theme;

function App() {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
          }}>
            <Spin size="large" />
          </div>
        } 
        persistor={persistor}
      >
        <ConfigProvider
          theme={{
            algorithm: defaultAlgorithm,
            token: {
              colorPrimary: '#1890ff',
              borderRadius: 6,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            },
          }}
        >
          <AntApp>
            <Router>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/interviewee" element={
                  <Layout>
                    <Interviewee />
                  </Layout>
                } />
                <Route path="/interviewer" element={
                  <Layout>
                    <Interviewer />
                  </Layout>
                } />
              </Routes>
            </Router>
          </AntApp>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
