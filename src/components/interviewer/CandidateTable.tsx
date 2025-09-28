import React, { useState } from 'react';
import { Table, Tag, Button, Space, Input, Select, Avatar, Typography, Rate } from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;
const { Option } = Select;

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  status: 'completed' | 'in-progress' | 'not-started';
  interviewDate: string;
  resumeFile: string;
  summary: string;
}

// Sample data
const sampleCandidates: Candidate[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    score: 85,
    status: 'completed',
    interviewDate: '2024-01-15',
    resumeFile: 'john_smith_resume.pdf',
    summary: 'Experienced React developer with strong problem-solving skills',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 234-5678',
    score: 92,
    status: 'completed',
    interviewDate: '2024-01-14',
    resumeFile: 'sarah_johnson_resume.pdf',
    summary: 'Full-stack developer with excellent communication abilities',
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    phone: '+1 (555) 345-6789',
    score: 78,
    status: 'in-progress',
    interviewDate: '2024-01-16',
    resumeFile: 'mike_chen_resume.docx',
    summary: 'Backend specialist with cloud architecture experience',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '+1 (555) 456-7890',
    score: 0,
    status: 'not-started',
    interviewDate: '2024-01-17',
    resumeFile: 'emily_davis_resume.pdf',
    summary: 'Frontend developer with UI/UX design background',
  },
  {
    id: '5',
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@email.com',
    phone: '+1 (555) 567-8901',
    score: 88,
    status: 'completed',
    interviewDate: '2024-01-13',
    resumeFile: 'alex_rodriguez_resume.pdf',
    summary: 'DevOps engineer with strong automation skills',
  },
];

const CandidateTable: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredData, setFilteredData] = useState<Candidate[]>(sampleCandidates);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'not-started': return 'orange';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    if (score >= 60) return '#fa8c16';
    return '#ff4d4f';
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    filterData(value, statusFilter);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    filterData(searchText, value);
  };

  const filterData = (search: string, status: string) => {
    let filtered = sampleCandidates;

    if (search) {
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(candidate => candidate.status === status);
    }

    setFilteredData(filtered);
  };

  const columns: ColumnsType<Candidate> = [
    {
      title: 'Candidate',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Candidate) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Interview Date',
      dataIndex: 'interviewDate',
      key: 'interviewDate',
      sorter: (a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('-', ' ').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'In Progress', value: 'in-progress' },
        { text: 'Not Started', value: 'not-started' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <div>
          {score > 0 ? (
            <>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '16px',
                color: getScoreColor(score)
              }}>
                {score}%
              </div>
              <Rate 
                disabled 
                value={score / 20} 
                style={{ fontSize: '12px' }}
              />
            </>
          ) : (
            <Text type="secondary">Not scored</Text>
          )}
        </div>
      ),
      sorter: (a, b) => a.score - b.score,
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
      width: 300,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Candidate) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => console.log('View details for:', record.id)}
          >
            View
          </Button>
          <Button 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => console.log('Download resume for:', record.id)}
          >
            Resume
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Input
          placeholder="Search candidates..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '300px' }}
        />
        
        <Select
          value={statusFilter}
          onChange={handleStatusFilter}
          style={{ width: '150px' }}
        >
          <Option value="all">All Status</Option>
          <Option value="completed">Completed</Option>
          <Option value="in-progress">In Progress</Option>
          <Option value="not-started">Not Started</Option>
        </Select>

        <Text type="secondary">
          Showing {filteredData.length} of {sampleCandidates.length} candidates
        </Text>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} candidates`,
          pageSizeOptions: ['10', '15', '25', '50'],
        }}
        scroll={{ x: 1200, y: 'calc(100vh - 300px)' }}
        size="middle"
      />
    </div>
  );
};

export default CandidateTable;