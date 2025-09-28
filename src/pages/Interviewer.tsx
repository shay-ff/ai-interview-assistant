import React from 'react';
import { Typography } from 'antd';
import CandidateTable from '../components/interviewer/CandidateTable';

const { Title } = Typography;

const Interviewer: React.FC = () => {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        padding: '20px',
      }}
    >
      <Title level={2} style={{ marginBottom: '20px' }}>
        Candidate Dashboard
      </Title>

      {/* table fills rest of screen */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <CandidateTable />
      </div>
    </div>
  );
};

export default Interviewer;
