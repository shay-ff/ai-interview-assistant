import React from 'react';
import { Modal, Typography, Descriptions, Card, Button } from 'antd';
import type { ContactInfo } from '../../types/candidate';

const { Title, Paragraph, Text } = Typography;

interface ResumeDebugModalProps {
  visible: boolean;
  onClose: () => void;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  contactInfo?: ContactInfo;
}

export const ResumeDebugModal: React.FC<ResumeDebugModalProps> = ({
  visible,
  onClose,
  fileName,
  fileSize,
  fileType,
  contactInfo
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Modal
      title="Resume Parsing Debug Information"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Title level={4}>File Information</Title>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="File Name">{fileName || 'Unknown'}</Descriptions.Item>
          <Descriptions.Item label="File Size">{formatFileSize(fileSize)}</Descriptions.Item>
          <Descriptions.Item label="File Type">{fileType || 'Unknown'}</Descriptions.Item>
        </Descriptions>

        <Title level={4} style={{ marginTop: 24 }}>Extracted Contact Information</Title>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Name">
            <Text copyable={!!contactInfo?.name}>
              {contactInfo?.name || <Text type="secondary">Not found</Text>}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            <Text copyable={!!contactInfo?.email}>
              {contactInfo?.email || <Text type="secondary">Not found</Text>}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            <Text copyable={!!contactInfo?.phone}>
              {contactInfo?.phone || <Text type="secondary">Not found</Text>}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Location">
            <Text copyable={!!contactInfo?.location}>
              {contactInfo?.location || <Text type="secondary">Not found</Text>}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Experience">
            <Text copyable={!!contactInfo?.experience}>
              {contactInfo?.experience || <Text type="secondary">Not found</Text>}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Education">
            <Text copyable={!!contactInfo?.education}>
              {contactInfo?.education || <Text type="secondary">Not found</Text>}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="LinkedIn">
            <Text copyable={!!contactInfo?.linkedin}>
              {contactInfo?.linkedin ? (
                <a href={contactInfo.linkedin} target="_blank" rel="noopener noreferrer">
                  {contactInfo.linkedin}
                </a>
              ) : (
                <Text type="secondary">Not found</Text>
              )}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="GitHub">
            <Text copyable={!!contactInfo?.github}>
              {contactInfo?.github ? (
                <a href={contactInfo.github} target="_blank" rel="noopener noreferrer">
                  {contactInfo.github}
                </a>
              ) : (
                <Text type="secondary">Not found</Text>
              )}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Portfolio">
            <Text copyable={!!contactInfo?.portfolio}>
              {contactInfo?.portfolio ? (
                <a href={contactInfo.portfolio} target="_blank" rel="noopener noreferrer">
                  {contactInfo.portfolio}
                </a>
              ) : (
                <Text type="secondary">Not found</Text>
              )}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        {contactInfo?.skills && contactInfo.skills.length > 0 && (
          <>
            <Title level={4} style={{ marginTop: 24 }}>Detected Skills</Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {contactInfo.skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: '#f0f0f0',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    border: '1px solid #d9d9d9'
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </>
        )}

        <Title level={4} style={{ marginTop: 24 }}>Extracted Text Content</Title>
        <Card size="small">
          <div style={{ position: 'relative' }}>
            <Button 
              size="small" 
              style={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}
              onClick={() => copyToClipboard(contactInfo?.text || '')}
            >
              Copy All Text
            </Button>
            <Paragraph 
              style={{ 
                whiteSpace: 'pre-wrap', 
                maxHeight: '300px', 
                overflowY: 'auto',
                fontSize: '12px',
                backgroundColor: '#f5f5f5',
                padding: '12px',
                marginTop: '24px'
              }}
            >
              {contactInfo?.text || 'No text extracted'}
            </Paragraph>
          </div>
        </Card>

        <Title level={4} style={{ marginTop: 24 }}>Parsing Summary</Title>
        <Card size="small">
          <ul>
            <li>
              <Text strong>Name Detection:</Text>{' '}
              <Text type={contactInfo?.name ? 'success' : 'warning'}>
                {contactInfo?.name ? '✓ Found' : '⚠ Not found'}
              </Text>
            </li>
            <li>
              <Text strong>Email Detection:</Text>{' '}
              <Text type={contactInfo?.email ? 'success' : 'warning'}>
                {contactInfo?.email ? '✓ Found' : '⚠ Not found'}
              </Text>
            </li>
            <li>
              <Text strong>Phone Detection:</Text>{' '}
              <Text type={contactInfo?.phone ? 'success' : 'warning'}>
                {contactInfo?.phone ? '✓ Found' : '⚠ Not found'}
              </Text>
            </li>
            <li>
              <Text strong>Text Length:</Text>{' '}
              <Text>{contactInfo?.text?.length || 0} characters</Text>
            </li>
          </ul>
        </Card>
      </div>
    </Modal>
  );
};