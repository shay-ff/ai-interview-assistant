import React, { useState } from 'react';
import { Upload, Button, message, Card, Typography, Alert, Space, Progress, Tag } from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { useDispatch } from 'react-redux';
import { ResumeParserService } from '../../services/resumeParser';
import { ValidationService } from '../../services/validationService';
import { ResumeDebugModal } from '../common/ResumeDebugModal';
import DebugApi from '../../utils/debugApi';
import { addCandidate } from '../../store/slices/candidateSlice';
import type { ContactInfo, Candidate } from '../../types/candidate';
import type { InterviewStatus } from '../../types/common';

const { Title, Text } = Typography;

interface ResumeUploadProps {
  onUploadComplete: () => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUploadComplete }) => {
  const dispatch = useDispatch();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [debugModalVisible, setDebugModalVisible] = useState(false);
  const [parsedData, setParsedData] = useState<{
    fileName: string;
    fileSize: number;
    fileType: string;
    contactInfo: ContactInfo;
  } | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const resumeParser = new ResumeParserService();

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select a file first');
      return;
    }

    const file = fileList[0];
    if (!file.originFileObj) {
      message.error('Invalid file');
      return;
    }

    setUploading(true);

    try {
      // Parse the resume using the ResumeParserService
      const contactInfo = await resumeParser.parseResume(file.originFileObj);

      // Store parsed data for debug modal and API
      const debugData = {
        fileName: file.name,
        fileSize: file.size || 0,
        fileType: file.type || '',
        contactInfo,
      };

      setParsedData(debugData);

      // Store in debug API for console access
      DebugApi.storeResumeData(debugData);

      // Create candidate object and add to Redux store
      const candidate: Candidate = {
        id: `candidate_${Date.now()}`,
        name: contactInfo.name || 'Unknown',
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        resumeFile: file.originFileObj,
        score: 0, // Will be calculated during interview
        summary: contactInfo.text.substring(0, 200) + (contactInfo.text.length > 200 ? '...' : ''),
        interviewDate: new Date(),
        status: 'pending' as InterviewStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Validate the parsed data
      const validation = ValidationService.validateContactInfo(contactInfo);
      setValidationResult(validation);
      
      dispatch(addCandidate(candidate));

      // Show validation results
      if (validation.isValid) {
        if (validation.warnings.length > 0) {
          message.warning(ValidationService.getValidationMessage(validation));
        } else {
          message.success('Resume parsed and validated successfully!');
        }
      } else {
        message.error(ValidationService.getValidationMessage(validation));
      }

      onUploadComplete();
    } catch (error) {
      console.error('Error parsing resume:', error);
      message.error(
        `Failed to parse resume: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDebugClick = () => {
    setDebugModalVisible(true);
  };

  const uploadProps: UploadProps = {
    accept: '.pdf,.docx',
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      const isPdf = file.type === 'application/pdf';
      const isDocx =
        file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (!isPdf && !isDocx) {
        message.error('You can only upload PDF or DOCX files!');
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }

      setFileList([file]);
      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <FileTextOutlined
            style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }}
          />
          <Title level={3}>Upload Your Resume</Title>
          <Text type="secondary">
            Upload your resume in PDF or DOCX format to get started with the
            interview
          </Text>
        </div>

        <Alert
          message="Supported Formats"
          description="We accept PDF (.pdf) and Microsoft Word (.docx) files up to 10MB in size."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />

        <Upload.Dragger {...uploadProps} style={{ marginBottom: '20px' }}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for PDF and DOCX files only. Maximum file size: 10MB.
          </p>
        </Upload.Dragger>

        {validationResult && (
          <Card size="small" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              {validationResult.isValid ? (
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
              ) : (
                <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
              )}
              <Text strong>Validation Results</Text>
            </div>
            
            <Progress
              percent={validationResult.score}
              strokeColor={ValidationService.getScoreColor(validationResult.score)}
              size="small"
              style={{ marginBottom: '12px' }}
            />
            
            <div style={{ fontSize: '12px' }}>
              <Text type="secondary">Score: {validationResult.score}/100</Text>
            </div>
            
            {validationResult.errors.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <Text type="danger" strong>Errors:</Text>
                {validationResult.errors.map((error: string, index: number) => (
                  <Tag key={index} color="red" style={{ margin: '2px' }}>
                    {error}
                  </Tag>
                ))}
              </div>
            )}
            
            {validationResult.warnings.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <Text type="warning" strong>Warnings:</Text>
                {validationResult.warnings.map((warning: string, index: number) => (
                  <Tag key={index} color="orange" style={{ margin: '2px' }}>
                    {warning}
                  </Tag>
                ))}
              </div>
            )}
          </Card>
        )}

        <div style={{ textAlign: 'center' }}>
          <Space size="middle">
            <Button
              type="primary"
              size="large"
              onClick={handleUpload}
              loading={uploading}
              disabled={fileList.length === 0}
              icon={<UploadOutlined />}
            >
              {uploading ? 'Processing...' : 'Start Interview'}
            </Button>

            {parsedData && (
              <Button
                size="large"
                onClick={handleDebugClick}
                icon={<BugOutlined />}
              >
                View Parsed Data
              </Button>
            )}
          </Space>
        </div>
      </Card>

      <ResumeDebugModal
        visible={debugModalVisible}
        onClose={() => setDebugModalVisible(false)}
        fileName={parsedData?.fileName}
        fileSize={parsedData?.fileSize}
        fileType={parsedData?.fileType}
        contactInfo={parsedData?.contactInfo}
      />
    </div>
  );
};

export default ResumeUpload;
