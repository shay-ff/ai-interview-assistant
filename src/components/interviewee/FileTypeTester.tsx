import React, { useRef } from 'react';
import { Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const FileTypeTester: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('🧪 FILE TYPE TESTER - Raw File Object:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      webkitRelativePath: (file as any).webkitRelativePath
    });

    // Test all possible PDF MIME types
    const possiblePdfTypes = [
      'application/pdf',
      'application/x-pdf', 
      'text/pdf',
      'application/octet-stream',
      'binary/octet-stream'
    ];

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();
    
    const isPdfByType = possiblePdfTypes.includes(file.type);
    const isPdfByExtension = fileExtension === 'pdf';
    
    console.log('🧪 FILE TYPE TESTER - Analysis:', {
      fileName,
      fileExtension,
      mimeType: file.type,
      isPdfByType,
      isPdfByExtension,
      wouldBeAccepted: isPdfByType || isPdfByExtension
    });

    if (isPdfByType || isPdfByExtension) {
      message.success(`✅ File would be accepted! MIME: ${file.type}, Extension: ${fileExtension}`);
    } else {
      message.error(`❌ File would be rejected! MIME: ${file.type}, Extension: ${fileExtension}`);
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ margin: '20px 0', padding: '20px', border: '1px dashed #ccc', borderRadius: '8px' }}>
      <h4>🧪 File Type Tester (Debug Tool)</h4>
      <p>Use this to test your PDF file without going through the main upload flow:</p>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <Button
        icon={<UploadOutlined />}
        onClick={() => fileInputRef.current?.click()}
      >
        Test File Type Detection
      </Button>
      
      <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
        Check the browser console (F12) for detailed analysis results.
      </p>
    </div>
  );
};

export default FileTypeTester;
