import React, { useState } from 'react';
import { Upload, Button, Card, Typography, Alert, Space, Progress, Tag, App } from 'antd';
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
import { ResumeTextExtractor } from '../../services/resumeTextExtractor';
import { ValidationService } from '../../services/validationService';
import { ResumeDebugModal } from '../common/ResumeDebugModal';
import ManualDataForm from './ManualDataForm';
import FileTypeTester from './FileTypeTester';
import DebugApi from '../../utils/debugApi';
import { addCandidate, selectCandidate } from '../../store/slices/candidateSlice';
import type { ContactInfo, Candidate, ResumeFileMetadata } from '../../types/candidate';
import type { InterviewStatus } from '../../types/common';

// Helper function to convert File to ResumeFileMetadata
const fileToResumeMetadata = (file: File, content?: string): ResumeFileMetadata => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    content: content, // Store the parsed text content
  };
};

const { Title, Text } = Typography;

interface ResumeUploadProps {
  onUploadComplete: () => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUploadComplete }) => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
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
  const [manualFormVisible, setManualFormVisible] = useState(false);
  const [pendingContactInfo, setPendingContactInfo] = useState<ContactInfo | null>(null);

  const resumeParser = new ResumeParserService();

  const handleUpload = async () => {
    console.log('=== UPLOAD PROCESS STARTED ===');
    console.log('1️⃣ FileList length:', fileList.length);
    console.log('1️⃣ FileList contents:', fileList);

    if (fileList.length === 0) {
      message.error('Please select a file first');
      return;
    }

    const file = fileList[0];
    console.log('2️⃣ File from fileList:', {
      name: file.name,
      size: file.size,
      type: file.type,
      uid: file.uid,
      status: file.status,
      hasOriginFileObj: !!file.originFileObj,
      originFileObj: file.originFileObj,
      isFile: file instanceof File,
      fileKeys: Object.keys(file)
    });

    const fileToUpload = (file.originFileObj || file) as File;
    console.log('3️⃣ FileToUpload:', {
      name: fileToUpload.name,
      size: fileToUpload.size,
      type: fileToUpload.type,
      isFile: fileToUpload instanceof File,
      constructor: fileToUpload.constructor.name,
      hasArrayBuffer: typeof fileToUpload.arrayBuffer === 'function'
    });

    if (!(fileToUpload instanceof File)) {
      message.error('Invalid File Object');
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (fileToUpload.size > maxSize) {
      message.error('File size must be less than 5MB');
      setUploading(false);
      return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(fileToUpload.type)) {
      message.error('Only PDF and DOCX files are supported');
      setUploading(false);
      return;
    }

    setUploading(true);

    try {
      // Extract text using the new text extractor
      console.log('🔍 Extracting text from file...');
      const extractedText = await ResumeTextExtractor.extractText(fileToUpload);
      
      // Extract contact information using exact regex patterns
      const emails = ResumeTextExtractor.extractEmails(extractedText);
      const phones = ResumeTextExtractor.extractPhones(extractedText);
      const extractedName = ResumeTextExtractor.extractName(extractedText);
      
      // Validate extracted information
      const extractionValidation = ResumeTextExtractor.validateExtractedInfo(extractedName, emails, phones);
      
      const contactInfo: ContactInfo = {
        name: extractedName || '',
        email: emails[0] || '',
        phone: phones[0] || '',
        text: extractedText,
        missing: extractionValidation.missing,
        skills: [], // Will be filled by resume parser if needed
        experience: '',
        education: '',
        location: '',
        linkedin: '',
        github: '',
        portfolio: '',
      };

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
      console.log('Resume data stored in debug API:', debugData);

      // Check if manual fallback is needed
      if (!extractionValidation.isValid) {
        console.log('❌ Missing required fields:', extractionValidation.missing);
        setPendingContactInfo(contactInfo);
        setManualFormVisible(true);
        message.warning(`Please provide missing information: ${extractionValidation.missing.join(', ')}`);
        setUploading(false);
        return;
      }

      // Create candidate object and add to Redux store
      const candidate: Candidate = {
        id: `candidate_${Date.now()}`,
        name: contactInfo.name || 'Unknown',
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        resumeFile: fileToResumeMetadata(fileToUpload, contactInfo.text), // Store full content
        score: 0, // Will be calculated during interview
        summary: contactInfo.text.substring(0, 200) + (contactInfo.text.length > 200 ? '...' : ''),
        interviewDate: new Date(),
        status: 'pending' as InterviewStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add candidate to Redux store
      dispatch(addCandidate(candidate));
      // Auto-select the candidate for interview
      dispatch(selectCandidate(candidate.id));

      message.success('Resume parsed successfully! All required information found.');
      setFileList([]);
      onUploadComplete();

    } catch (error) {
      console.error('Resume parsing failed:', error);
      message.error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Remove unused resumeParser and old validation logic

      // Validate the parsed data
      const validation = ValidationService.validateContactInfo(contactInfo);
      setValidationResult(validation);

      // Check if we need manual confirmation
      if (!validation.isValid || validation.score < 70) {
        // Show manual form for confirmation/correction
        setPendingContactInfo(contactInfo);
        setManualFormVisible(true);
        message.warning('Please review and confirm your information before proceeding.');
      } else {
        // Auto-proceed with high confidence data
        dispatch(addCandidate(candidate));
        // Auto-select the candidate for interview
        dispatch(selectCandidate(candidate.id));

        if (validation.warnings.length > 0) {
          message.warning(ValidationService.getValidationMessage(validation));
        } else {
          message.success('Resume parsed and validated successfully!');
        }

        onUploadComplete();
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      message.error(
        `Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'
        }`
      );

      // Offer manual entry option
      setPendingContactInfo({
        text: '',
        missing: ['name', 'email', 'phone'],
        name: undefined,
        email: undefined,
        phone: undefined,
        skills: [],
        experience: undefined,
        education: undefined,
        location: undefined,
        linkedin: undefined,
        github: undefined,
        portfolio: undefined,
      });
      setValidationResult({
        isValid: false,
        errors: ['Resume parsing failed'],
        warnings: ['Please enter your information manually'],
        score: 0
      });
      setManualFormVisible(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDebugClick = () => {
    setDebugModalVisible(true);
  };

  const handleManualFormConfirm = (updatedContactInfo: ContactInfo) => {
    // Create candidate with updated information
    const file = fileList[0];

    const fileToUpload = (file.originFileObj || file) as File;
    if (!(fileToUpload instanceof File)) {
      return;
    }


    const candidate: Candidate = {
      id: `candidate_${Date.now()}`,
      name: updatedContactInfo.name || 'Unknown',
      email: updatedContactInfo.email || '',
      phone: updatedContactInfo.phone || '',
      resumeFile: fileToResumeMetadata(fileToUpload, updatedContactInfo.text), // Store full content
      score: 0,
      summary: updatedContactInfo.text.substring(0, 200) + (updatedContactInfo.text.length > 200 ? '...' : ''),
      interviewDate: new Date(),
      status: 'pending' as InterviewStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Update parsed data with user corrections
    setParsedData({
      fileName: file.name,
      fileSize: file.size || 0,
      fileType: file.type || '',
      contactInfo: updatedContactInfo,
    });

    // Store updated data in debug API
    DebugApi.storeResumeData({
      fileName: file.name,
      fileSize: file.size || 0,
      fileType: file.type || '',
      contactInfo: updatedContactInfo,
    });

    dispatch(addCandidate(candidate));
    // Auto-select the candidate for interview
    dispatch(selectCandidate(candidate.id));
    setManualFormVisible(false);
    setPendingContactInfo(null);
    onUploadComplete();
  };

  const handleManualFormCancel = () => {
    setManualFormVisible(false);
    setPendingContactInfo(null);
    // Reset file list to allow re-upload
    setFileList([]);
    setParsedData(null);
    setValidationResult(null);
  };

  const handleManualEntry = () => {
    setPendingContactInfo({
      text: '',
      missing: ['name', 'email', 'phone'],
      name: undefined,
      email: undefined,
      phone: undefined,
      skills: [],
      experience: undefined,
      education: undefined,
      location: undefined,
      linkedin: undefined,
      github: undefined,
      portfolio: undefined,
    });
    setValidationResult({
      isValid: false,
      errors: ['Manual entry required'],
      warnings: ['Please fill in your information'],
      score: 0
    });
    setManualFormVisible(true);
  };

  const uploadProps: UploadProps = {
    accept: '.pdf,.docx',
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      console.log('🔍 DETAILED FILE ANALYSIS:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      });

      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.split('.').pop();
      const fileType = file.type || '';

      // Primary check: file extension (most reliable)
      const isValidExtension = fileExtension === 'pdf' || fileExtension === 'docx';

      // Secondary check: MIME type (as backup)
      const possiblePdfTypes = [
        'application/pdf',
        'application/x-pdf',
        'text/pdf',
        'application/octet-stream'
      ];

      const isPdf = possiblePdfTypes.includes(fileType) || fileExtension === 'pdf';
      const isDocx = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        (fileType === 'application/zip' && fileExtension === 'docx') ||
        fileExtension === 'docx';

      console.log('🔍 VALIDATION RESULTS:', {
        fileName,
        fileExtension,
        fileType,
        isPdf,
        isDocx,
        isValidExtension,
        isValid: isValidExtension
      });

      // Reject if extension is not valid
      if (!isValidExtension) {
        console.error('❌ FILE REJECTED:', {
          reason: 'Invalid file extension',
          fileType,
          fileExtension,
          fileName
        });
        message.error(`Invalid file type. Only PDF and DOCX files are supported. Your file: ${fileName}`);
        return Upload.LIST_IGNORE;
      }

      // Check file size
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return Upload.LIST_IGNORE;
      }

      // File is valid
      console.log('✅ FILE ACCEPTED:', fileName);
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
          <Space size="middle" direction="vertical" style={{ width: '100%' }}>
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

            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">Don't have a resume file?</Text>
              <br />
              <Button
                type="link"
                size="large"
                onClick={handleManualEntry}
                style={{ padding: '4px 8px' }}
              >
                Enter Information Manually
              </Button>
            </div>

            {/* Temporary debug info */}
            <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
              <Text type="secondary">
                Having upload issues? Check browser console (F12) for detailed file analysis.
              </Text>
            </div>

            {/* Debug tool */}
            <FileTypeTester />
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

      <ManualDataForm
        visible={manualFormVisible}
        parsedData={pendingContactInfo}
        onConfirm={handleManualFormConfirm}
        onCancel={handleManualFormCancel}
        validationResult={validationResult}
      />
    </div>
  );
};

export default ResumeUpload;