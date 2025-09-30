import React, { useState } from 'react';
import { Upload, Button, Card, Typography, Space, App, Form, Input } from 'antd';
import { UploadOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { useDispatch } from 'react-redux';
import { ResumeTextExtractor } from '../../services/resumeTextExtractor';
import { addCandidate, selectCandidate } from '../../store/slices/candidateSlice';
import type { Candidate, ResumeFileMetadata } from '../../types/candidate';
import type { InterviewStatus } from '../../types/common';

const { Title, Text } = Typography;

interface ResumeUploadProps {
  onUploadComplete: () => void;
}

// Helper function to convert File to ResumeFileMetadata
const fileToResumeMetadata = (file: File, content?: string): ResumeFileMetadata => {
  if (!file) {
    throw new Error('File is required to create ResumeFileMetadata');
  }
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    content: content, // Store the parsed text content
  };
};

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUploadComplete }) => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Store the actual file
  const [autoFilledData, setAutoFilledData] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  const handleUpload = async (file: File) => {
    // Clear any existing session data when uploading new resume
    localStorage.removeItem('persist:interview');
    console.log('Cleared existing session data for new resume upload');
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      message.error('File size must be less than 5MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      message.error('Only PDF and DOCX files are supported');
      return;
    }

    setUploading(true);
    setUploadedFile(file); // Store the file for later use

    try {
      // Extract text using the new text extractor
      console.log('🔍 Extracting text from file...', file.name, file.type);
      const text = await ResumeTextExtractor.extractText(file);
      console.log('✅ Text extracted successfully, length:', text.length);
      setExtractedText(text);
      
      // Extract contact information using exact regex patterns
      console.log('🔍 Extracting contact information...');
      const emails = ResumeTextExtractor.extractEmails(text);
      const phones = ResumeTextExtractor.extractPhones(text);
      const extractedName = ResumeTextExtractor.extractName(text);
      console.log('📧 Emails found:', emails);
      console.log('📱 Phones found:', phones);
      console.log('👤 Name found:', extractedName);
      
      // Validate extracted information
      const validation = ResumeTextExtractor.validateExtractedInfo(extractedName, emails, phones);
      console.log('✅ Validation result:', validation);
      
      const autoFilled = {
        name: extractedName || '',
        email: emails[0] || '',
        phone: phones[0] || '',
      };
      
      setAutoFilledData(autoFilled);

      // Pre-fill the form with extracted data
      form.setFieldsValue(autoFilled);
      
      // Always show manual form for confirmation/completion
      setShowManualForm(true);
      
      if (validation.isValid) {
        message.success(`Resume parsed successfully! Found: ${extractedName ? 'name' : ''} ${emails[0] ? 'email' : ''} ${phones[0] ? 'phone' : ''}`);
      } else {
        message.warning(`Please provide missing information: ${validation.missing.join(', ')}`);
      }

    } catch (error) {
      console.error('Resume parsing failed:', error);
      message.error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Show manual form anyway so user can still proceed
      setShowManualForm(true);
      setExtractedText('');
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (values: any) => {
    try {
      console.log('📝 Submitting manual form with values:', values);
      
      // Validate required fields
      if (!values.name?.trim() || !values.email?.trim() || !values.phone?.trim()) {
        console.error('❌ Validation failed: Missing required fields');
        message.error('Name, email, and phone are required to start the interview');
        return;
      }

      // Create a default resume file metadata if no file was uploaded
      const defaultResumeFile: ResumeFileMetadata = {
        name: 'manual-entry.txt',
        size: extractedText.length || 0,
        type: 'text/plain',
        lastModified: Date.now(),
        content: extractedText || 'Manual entry - no file uploaded',
      };

      console.log('📄 Default resume file created:', defaultResumeFile);

      // Create candidate object with all required fields
      const candidate: Candidate = {
        id: `candidate_${Date.now()}`,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        resumeFile: uploadedFile 
          ? fileToResumeMetadata(uploadedFile, extractedText) 
          : defaultResumeFile,
        score: 0,
        summary: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : '') || 'Manual entry',
        interviewDate: new Date(),
        status: 'pending' as InterviewStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('👤 Candidate object created:', candidate);

      // Add candidate to Redux store
      console.log('🏪 Dispatching addCandidate action...');
      dispatch(addCandidate(candidate));
      
      console.log('🎯 Dispatching selectCandidate action...');
      dispatch(selectCandidate(candidate.id));

      console.log('✅ Candidate saved successfully!');
      message.success('Information confirmed! Starting interview...');
      onUploadComplete();

    } catch (error) {
      console.error('❌ Failed to create candidate:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      message.error('Failed to save candidate information');
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      setFileList([file]);
      handleUpload(file);
      return false; // Prevent automatic upload
    },
    fileList,
    onRemove: () => {
      setFileList([]);
      setShowManualForm(false);
      setExtractedText('');
      setUploadedFile(null); // Clear the stored file
      setAutoFilledData({});
      form.resetFields();
    },
    accept: '.pdf,.docx',
    maxCount: 1,
  };

  if (showManualForm) {
    return (
      <Card title="Confirm Your Information" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            {extractedText ? 'Please review and confirm the information extracted from your resume:' : 'Please enter your information to start the interview:'}
          </Text>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleManualSubmit}
          initialValues={autoFilledData}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Enter your email address" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Enter your phone number" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Start Interview
              </Button>
              <Button onClick={() => {
                setShowManualForm(false);
                setFileList([]);
                setUploadedFile(null); // Clear the stored file
                form.resetFields();
              }}>
                Upload Different Resume
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    );
  }

  return (
    <Card title="Upload Your Resume" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Title level={3}>Upload Your Resume</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Upload a PDF or DOCX file. We'll extract your contact information automatically.
        </Text>
        
        <Upload.Dragger {...uploadProps} style={{ marginBottom: 16 }}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">Click or drag file to upload</p>
          <p className="ant-upload-hint">
            Support for PDF and DOCX files only. Maximum file size: 5MB
          </p>
        </Upload.Dragger>

        {uploading && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Extracting text from resume...</Text>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
                    <Button 
            type="link" 
            onClick={() => setShowManualForm(true)}
          >
            Enter information manually instead
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ResumeUpload;