import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import { store, persistor } from './store';
import Layout from './components/common/Layout';
import Landing from './pages/Landing';
import Interviewee from './pages/Interviewee';
import Interviewer from './pages/Interviewer';
import ErrorBoundary from './components/common/ErrorBoundary';
import GlobalErrorHandler from './components/common/GlobalErrorHandler';
import { LoadingFallback } from './components/common/FallbackUI';
import './utils/debugApi'; // Initialize debug API
import './utils/testDebugApi'; // Initialize test utilities
import './utils/fileTypeDebug'; // Initialize file type debug utilities
import './App.css';

const { defaultAlgorithm } = theme;

function App() {
  return (
    <ErrorBoundary level="page">
      <Provider store={store}>
        <PersistGate 
          loading={<LoadingFallback message="Loading your session..." />}
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
              <GlobalErrorHandler />
              <ErrorBoundary level="section">
                <Router>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/interviewee" element={
                      <Layout>
                        <ErrorBoundary level="component">
                          <Interviewee />
                        </ErrorBoundary>
                      </Layout>
                    } />
                    <Route path="/interviewer" element={
                      <Layout>
                        <ErrorBoundary level="component">
                          <Interviewer />
                        </ErrorBoundary>
                      </Layout>
                    } />
                  </Routes>
                </Router>
              </ErrorBoundary>
            </AntApp>
          </ConfigProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;