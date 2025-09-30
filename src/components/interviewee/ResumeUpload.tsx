import React, { useState } from 'react';
import { Upload, Button, Card, Typography, Space, App, Form, Input } from 'antd';
import { UploadOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { useDispatch } from 'react-redux';
import { ResumeTextExtractor } from '../../services/resumeTextExtractor';
import { ResumeParserService } from '../../services/resumeParser';
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
  const resumeParser = new ResumeParserService();
  
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Store the actual file
  const [autoFilledData, setAutoFilledData] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
  }>({});

  const handleUpload = async (file: File) => {
    // Clear any existing session data when uploading new resume
    localStorage.removeItem('persist:interview');
    
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
      const text = await ResumeTextExtractor.extractText(file);
      setExtractedText(text);
      
      // Extract contact information using exact regex patterns
      const contactInfo = await resumeParser.parseResume(file);
      
      const autoFilled = {
        name: contactInfo.name || '',
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        skills: contactInfo.skills || [],
      };
      
      setAutoFilledData(autoFilled);

      // Pre-fill the form with extracted data
      form.setFieldsValue({
        name: autoFilled.name,
        email: autoFilled.email,
        phone: autoFilled.phone,
      });
      
      // Always show manual form for confirmation/completion
      setShowManualForm(true);
      
      const skillsCount = contactInfo.skills?.length || 0;
      const foundItems = [
        contactInfo.name && 'name',
        contactInfo.email && 'email', 
        contactInfo.phone && 'phone',
        skillsCount > 0 && `${skillsCount} skills`
      ].filter(Boolean);
      
      if (foundItems.length > 0) {
        message.success(`Resume parsed successfully! Found: ${foundItems.join(', ')}`);
      } else {
        message.warning('Please provide your information to continue');
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

      // Add candidate to Redux store
      dispatch(addCandidate(candidate));
      
      dispatch(selectCandidate(candidate.id));

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

          {/* Display extracted skills */}
          {autoFilledData.skills && autoFilledData.skills.length > 0 && (
            <Form.Item label="Skills Found in Resume">
              <div style={{ padding: '8px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
                <Text style={{ fontSize: '12px', color: '#52c41a', display: 'block', marginBottom: '8px' }}>✓ Auto-detected from your resume:</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {autoFilledData.skills.map((skill: string, index: number) => (
                    <span key={index} style={{
                      padding: '2px 8px',
                      backgroundColor: '#1890ff',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Form.Item>
          )}

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