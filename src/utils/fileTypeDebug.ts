// Debug utility for file type detection
export const debugFileType = (file: File) => {
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();
  const fileType = file.type || '';
  
  const debugInfo = {
    fileName: file.name,
    fileExtension,
    mimeType: file.type,
    fileSize: file.size,
    sizeInMB: (file.size / 1024 / 1024).toFixed(2),
    isPdf: fileType === 'application/pdf' || 
           fileType === 'application/x-pdf' || 
           fileType === 'text/pdf' ||
           fileExtension === 'pdf',
    isDocx: fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            (fileType === 'application/zip' && fileExtension === 'docx') ||
            fileExtension === 'docx',
    isValid: false
  };
  
  debugInfo.isValid = debugInfo.isPdf || debugInfo.isDocx;
  
  console.log('🔍 File Type Debug Info:', debugInfo);
  
  return debugInfo;
};

// Make it available globally
(window as any).debugFileType = debugFileType;
