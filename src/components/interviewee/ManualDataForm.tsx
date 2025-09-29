import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Typography, Divider, App } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { ContactInfo } from '../../types/candidate';

const { Title, Text } = Typography;

interface ManualDataFormProps {
  visible: boolean;
  parsedData: ContactInfo | null;
  onConfirm: (data: ContactInfo) => void;
  onCancel: () => void;
  validationResult?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number;
  };
}

const ManualDataForm: React.FC<ManualDataFormProps> = ({
  visible,
  parsedData,
  onConfirm,
  onCancel,
  validationResult
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (visible && parsedData) {
      // Pre-fill form with parsed data
      form.setFieldsValue({
        name: parsedData.name || '',
        email: parsedData.email || '',
        phone: parsedData.phone || '',
        location: parsedData.location || '',
        experience: parsedData.experience || '',
        education: parsedData.education || '',
        linkedin: parsedData.linkedin || '',
        github: parsedData.github || '',
        portfolio: parsedData.portfolio || '',
      });
    }
  }, [visible, parsedData, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Create updated contact info
      const updatedData: ContactInfo = {
        ...parsedData!,
        name: values.name,
        email: values.email,
        phone: values.phone,
        location: values.location,
        experience: values.experience,
        education: values.education,
        linkedin: values.linkedin,
        github: values.github,
        portfolio: values.portfolio,
        missing: [], // Clear missing fields since user filled them
      };

      onConfirm(updatedData);
      message.success('Information confirmed successfully!');
    } catch (error) {
      console.error('Form validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getValidationColor = (score?: number) => {
    if (!score) return '#d9d9d9';
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <Modal
      title="Confirm Your Information"
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={null}
      destroyOnHidden
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Validation Summary */}
        {validationResult && (
          <div style={{ marginBottom: '24px' }}>
            <Title level={5}>Parsing Results</Title>
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '6px',
              border: `2px solid ${getValidationColor(validationResult.score)}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Validation Score: {validationResult.score}/100</Text>
                <Text style={{ color: getValidationColor(validationResult.score) }}>
                  {validationResult.isValid ? '✓ Valid' : '⚠ Needs Review'}
                </Text>
              </div>
              
              {validationResult.errors.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="danger" strong>Required fields missing:</Text>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {validationResult.errors.map((error, index) => (
                      <li key={index} style={{ color: '#ff4d4f', fontSize: '12px' }}>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationResult.warnings.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="warning" strong>Recommendations:</Text>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index} style={{ color: '#faad14', fontSize: '12px' }}>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <Divider />

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Title level={5}>Personal Information</Title>
          
          <Form.Item
            name="name"
            label="Full Name"
            rules={[
              { required: true, message: 'Please enter your full name' },
              { min: 2, message: 'Name must be at least 2 characters' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Enter your full name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="your.email@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please enter your phone number' },
              { pattern: /^[\d\s\-\+\(\)]+$/, message: 'Please enter a valid phone number' }
            ]}
          >
            <Input 
              prefix={<PhoneOutlined />} 
              placeholder="(555) 123-4567"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="Location"
          >
            <Input 
              prefix={<EnvironmentOutlined />} 
              placeholder="City, State, Country"
              size="large"
            />
          </Form.Item>

          <Divider />

          <Title level={5}>Professional Information</Title>

          <Form.Item
            name="experience"
            label="Years of Experience"
          >
            <Input 
              placeholder="e.g., 5 years of software development experience"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="education"
            label="Education"
          >
            <Input 
              placeholder="e.g., Bachelor of Science in Computer Science, University Name"
              size="large"
            />
          </Form.Item>

          <Divider />

          <Title level={5}>Online Presence (Optional)</Title>

          <Form.Item
            name="linkedin"
            label="LinkedIn Profile"
          >
            <Input 
              placeholder="https://linkedin.com/in/yourprofile"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="github"
            label="GitHub Profile"
          >
            <Input 
              placeholder="https://github.com/yourusername"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="portfolio"
            label="Portfolio/Website"
          >
            <Input 
              placeholder="https://yourportfolio.com"
              size="large"
            />
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Space size="middle">
            <Button 
              size="large" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              size="large" 
              loading={loading}
              onClick={handleSubmit}
            >
              Confirm & Continue
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default ManualDataForm;
