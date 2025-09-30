import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Input, Select, Avatar, Typography, Rate, Progress, Modal, Descriptions, Card, Divider } from 'antd';
import { SearchOutlined, EyeOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { ColumnsType } from 'antd/es/table';
import type { RootState } from '../../store';
import type { Candidate, AnswerFeedback } from '../../types/candidate';

const { Text } = Typography;
const { Option } = Select;





const CandidateTable: React.FC = () => {
  const candidates = useSelector((state: RootState) => state.candidates?.list || []);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredData, setFilteredData] = useState<Candidate[]>([]);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [interviewDetailsModalVisible, setInterviewDetailsModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  // Update filtered data when candidates change
  useEffect(() => {
    let filtered = [...candidates];
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(searchLower) ||
        candidate.email.toLowerCase().includes(searchLower) ||
        candidate.phone.includes(searchText) ||
        candidate.summary.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(candidate => {
        const status = candidate.interviewProgress?.status || 'not-started';
        return status === statusFilter;
      });
    }
    
    setFilteredData(filtered);
  }, [candidates, searchText, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'paused': return 'orange';
      case 'not-started': return 'default';
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
    let filtered = [...candidates];

    if (search) {
      filtered = filtered.filter((candidate: Candidate) =>
        candidate.name.toLowerCase().includes(search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(search.toLowerCase()) ||
        candidate.summary.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter((candidate: Candidate) => {
        const candidateStatus = candidate.interviewProgress?.status || 'not-started';
        return candidateStatus === status;
      });
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
      title: 'Interview Progress',
      key: 'interviewProgress',
      render: (_, record: Candidate) => {
        const progress = record.interviewProgress;
        if (!progress) {
          return <Text type="secondary">Not started</Text>;
        }

        const progressPercent = progress.totalQuestions ? 
          Math.round((progress.answersSubmitted || 0) / progress.totalQuestions * 100) : 0;
        
        const getStatusTag = (status: string) => {
          switch (status) {
            case 'completed':
              return <Tag color="green" icon={<CheckCircleOutlined />}>Completed</Tag>;
            case 'in-progress':
              return <Tag color="blue" icon={<ClockCircleOutlined />}>In Progress</Tag>;
            case 'paused':
              return <Tag color="orange">Paused</Tag>;
            default:
              return <Tag color="default">Not Started</Tag>;
          }
        };

        return (
          <div style={{ minWidth: 120 }}>
            {getStatusTag(progress.status)}
            {progress.totalQuestions && (
              <div style={{ marginTop: 4 }}>
                <Progress 
                  percent={progressPercent} 
                  size="small" 
                  showInfo={false}
                />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {progress.answersSubmitted || 0}/{progress.totalQuestions} questions
                </Text>
              </div>
            )}
            {progress.allAnswersFeedback && progress.allAnswersFeedback.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <Button 
                  type="link" 
                  size="small" 
                  icon={<TrophyOutlined />}
                  onClick={() => {
                    setSelectedCandidate(record);
                    setFeedbackModalVisible(true);
                  }}
                  style={{ padding: 0, height: 'auto' }}
                >
                  View Feedback
                </Button>
              </div>
            )}
          </div>
        );
      },
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
            onClick={() => {
              setSelectedCandidate(record);
              setInterviewDetailsModalVisible(true);
            }}
          >
            View
          </Button>
          {/* <Button 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadResume(record)}
            disabled={!record.resumeFile.content}
            title={record.resumeFile.content ? `Download ${record.resumeFile.name}` : 'Resume content not available'}
          >
            Resume
          </Button> */}
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
          Showing {filteredData.length} of {candidates.length} candidates
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

      {/* Interview Feedback Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrophyOutlined />
            Interview Feedback - {selectedCandidate?.name}
          </div>
        }
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCandidate?.interviewProgress?.allAnswersFeedback && (
          <div>
            {selectedCandidate.interviewProgress.allAnswersFeedback.map((feedback: AnswerFeedback, index: number) => (
              <Card 
                key={feedback.questionId} 
                style={{ marginBottom: 16 }}
                title={`Question ${index + 1}`}
                extra={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Rate disabled value={feedback.score / 20} style={{ fontSize: 12 }} />
                    <Text strong style={{ color: feedback.score >= 70 ? '#52c41a' : feedback.score >= 50 ? '#faad14' : '#ff4d4f' }}>
                      {feedback.score}/100
                    </Text>
                  </div>
                }
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Question">
                    <Text>{feedback.question}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Answer">
                    <Text type="secondary">{feedback.answer}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Time">
                    {feedback.timeSpent}s / {feedback.timeLimit}s
                    <Progress 
                      percent={Math.min(100, (feedback.timeSpent / feedback.timeLimit) * 100)}
                      size="small"
                      style={{ marginTop: 4 }}
                      strokeColor={feedback.timeSpent <= feedback.timeLimit ? '#52c41a' : '#ff4d4f'}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Feedback">
                    <Text>{feedback.feedback}</Text>
                  </Descriptions.Item>
                  {feedback.strengths.length > 0 && (
                    <Descriptions.Item label="Strengths">
                      {feedback.strengths.map((strength, i) => (
                        <Tag key={i} color="green" style={{ marginBottom: 4 }}>
                          {strength}
                        </Tag>
                      ))}
                    </Descriptions.Item>
                  )}
                  {feedback.improvements.length > 0 && (
                    <Descriptions.Item label="Areas for Improvement">
                      {feedback.improvements.map((improvement, i) => (
                        <Tag key={i} color="orange" style={{ marginBottom: 4 }}>
                          {improvement}
                        </Tag>
                      ))}
                    </Descriptions.Item>
                  )}
                </Descriptions>
                {index < (selectedCandidate.interviewProgress?.allAnswersFeedback?.length || 0) - 1 && <Divider />}
              </Card>
            ))}
            
            {/* Overall Summary */}
            <Card title="Overall Performance Summary" style={{ marginTop: 16, backgroundColor: '#fafafa' }}>
              <Descriptions column={2}>
                <Descriptions.Item label="Total Questions">
                  {selectedCandidate.interviewProgress.totalQuestions || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Questions Answered">
                  {selectedCandidate.interviewProgress.answersSubmitted || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Average Score">
                  {selectedCandidate.interviewProgress.allAnswersFeedback?.length ? 
                    Math.round(
                      selectedCandidate.interviewProgress.allAnswersFeedback.reduce((sum, f) => sum + f.score, 0) / 
                      selectedCandidate.interviewProgress.allAnswersFeedback.length
                    ) : 0}/100
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedCandidate.interviewProgress.status)}>
                    {selectedCandidate.interviewProgress.status.replace('-', ' ').toUpperCase()}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}
      </Modal>

      {/* Interview Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EyeOutlined />
            Interview Details - {selectedCandidate?.name}
          </div>
        }
        open={interviewDetailsModalVisible}
        onCancel={() => setInterviewDetailsModalVisible(false)}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        {selectedCandidate && (
          <div>
            {/* Candidate Overview */}
            <Card 
              title="Candidate Information" 
              style={{ marginBottom: 16 }}
              size="small"
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Name">{selectedCandidate.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedCandidate.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedCandidate.phone}</Descriptions.Item>
                <Descriptions.Item label="Interview Date">
                  {new Date(selectedCandidate.interviewDate).toLocaleDateString()}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedCandidate.status)}>
                    {selectedCandidate.status.replace('-', ' ').toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Overall Score">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ 
                      color: selectedCandidate.score >= 70 ? '#52c41a' : 
                             selectedCandidate.score >= 50 ? '#faad14' : '#ff4d4f' 
                    }}>
                      {selectedCandidate.score}/100
                    </Text>
                    <Rate disabled value={selectedCandidate.score / 20} style={{ fontSize: 14 }} />
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Interview Progress */}
            {selectedCandidate.interviewProgress && (
              <Card 
                title="Interview Progress" 
                style={{ marginBottom: 16 }}
                size="small"
              >
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(selectedCandidate.interviewProgress.status)}>
                      {selectedCandidate.interviewProgress.status.replace('-', ' ').toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Questions Progress">
                    {selectedCandidate.interviewProgress.answersSubmitted || 0}/
                    {selectedCandidate.interviewProgress.totalQuestions || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Time Spent">
                    {selectedCandidate.interviewProgress.timeSpent ? 
                      `${Math.floor(selectedCandidate.interviewProgress.timeSpent / 60)}m ${selectedCandidate.interviewProgress.timeSpent % 60}s` : 
                      'N/A'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Completed At">
                    {selectedCandidate.interviewProgress.completedAt ? 
                      new Date(selectedCandidate.interviewProgress.completedAt).toLocaleString() : 
                      'Not completed'
                    }
                  </Descriptions.Item>
                </Descriptions>
                {selectedCandidate.interviewProgress.totalQuestions && (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Progress</Text>
                    <Progress 
                      percent={Math.round(((selectedCandidate.interviewProgress.answersSubmitted || 0) / 
                               selectedCandidate.interviewProgress.totalQuestions) * 100)}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                  </div>
                )}
              </Card>
            )}

            {/* Summary */}
            {selectedCandidate.summary && (
              <Card 
                title="Interview Summary" 
                style={{ marginBottom: 16 }}
                size="small"
              >
                <Text>{selectedCandidate.summary}</Text>
              </Card>
            )}

            {/* Questions and Answers */}
            {selectedCandidate.interviewProgress?.allAnswersFeedback && 
             selectedCandidate.interviewProgress.allAnswersFeedback.length > 0 ? (
              <Card title="Questions & Answers" size="small">
                {selectedCandidate.interviewProgress.allAnswersFeedback.map((feedback: AnswerFeedback, index: number) => (
                  <Card 
                    key={feedback.questionId} 
                    style={{ marginBottom: 12 }}
                    size="small"
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Question {index + 1}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {feedback.timeSpent}s / {feedback.timeLimit}s
                          </Text>
                          <Rate disabled value={feedback.score / 20} style={{ fontSize: 12 }} />
                          <Text strong style={{ 
                            color: feedback.score >= 70 ? '#52c41a' : 
                                   feedback.score >= 50 ? '#faad14' : '#ff4d4f',
                            fontSize: '12px'
                          }}>
                            {feedback.score}/100
                          </Text>
                        </div>
                      </div>
                    }
                  >
                    <div style={{ marginBottom: 12 }}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>Q:</Text>
                      <Text>{feedback.question}</Text>
                    </div>
                    
                    <div style={{ marginBottom: 12 }}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>A:</Text>
                      <Text type="secondary">{feedback.answer}</Text>
                    </div>

                    {feedback.feedback && (
                      <div style={{ marginBottom: 12 }}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Feedback:</Text>
                        <Text>{feedback.feedback}</Text>
                      </div>
                    )}

                    {(feedback.strengths.length > 0 || feedback.improvements.length > 0) && (
                      <div>
                        {feedback.strengths.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <Text strong style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>
                              Strengths:
                            </Text>
                            {feedback.strengths.map((strength, i) => (
                              <Tag key={i} color="green">
                                {strength}
                              </Tag>
                            ))}
                          </div>
                        )}
                        {feedback.improvements.length > 0 && (
                          <div>
                            <Text strong style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>
                              Areas for Improvement:
                            </Text>
                            {feedback.improvements.map((improvement, i) => (
                              <Tag key={i} color="orange">
                                {improvement}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </Card>
            ) : (
              <Card title="Questions & Answers" size="small">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">
                    {selectedCandidate.interviewProgress?.status === 'not-started' 
                      ? 'Interview has not been started yet.'
                      : selectedCandidate.interviewProgress?.status === 'in-progress'
                      ? 'Interview is currently in progress.'
                      : 'No interview data available.'}
                  </Text>
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CandidateTable;