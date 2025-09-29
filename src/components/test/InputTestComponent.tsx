import React, { useState } from 'react';
import { Card, Input, Button, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;

// Simple test component to verify input functionality
const InputTestComponent: React.FC = () => {
  const [testInput, setTestInput] = useState('');

  const handleSubmit = () => {
    console.log('Input value:', testInput);
    alert(`You typed: ${testInput}`);
    setTestInput('');
  };

  return (
    <Card title="Input Test" style={{ margin: 20 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <TextArea
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="Test typing here..."
          rows={3}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          disabled={!testInput.trim()}
        >
          Test Submit
        </Button>
      </Space>
    </Card>
  );
};

export default InputTestComponent;