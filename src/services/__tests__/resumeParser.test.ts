import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResumeParserService } from '../resumeParser';
import type { ContactInfo } from '../../types/candidate';

// Mock PDF.js
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
  version: '3.0.0'
}));

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn()
  }
}));

// Mock File.arrayBuffer for Node.js environment
class MockFile extends File {
  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    super(bits, name, options);
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    const text = this.stream().getReader();
    return new Promise((resolve) => {
      const chunks: Uint8Array[] = [];
      const pump = (): Promise<void> => {
        return text.read().then(({ done, value }) => {
          if (done) {
            const buffer = new ArrayBuffer(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
            const view = new Uint8Array(buffer);
            let offset = 0;
            chunks.forEach(chunk => {
              view.set(chunk, offset);
              offset += chunk.length;
            });
            resolve(buffer);
            return;
          }
          chunks.push(value);
          return pump();
        });
      };
      pump();
    });
  }
}

// Override global File for tests
(global as any).File = MockFile;

describe('ResumeParserService', () => {
  let service: ResumeParserService;

  beforeEach(() => {
    service = new ResumeParserService();
    vi.clearAllMocks();
  });

  describe('parseResume', () => {
    it('should throw error for unsupported file type', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      await expect(service.parseResume(file)).rejects.toThrow(
        'Unsupported file type: text/plain. Only PDF and DOCX files are supported.'
      );
    });

    it('should throw error for file size exceeding limit', async () => {
      // Create a large file (11MB)
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      await expect(service.parseResume(file)).rejects.toThrow(
        'File size exceeds 10MB limit.'
      );
    });

    it('should parse PDF file successfully', async () => {
      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              { str: 'John' },
              { str: ' ' },
              { str: 'Doe' },
              { str: '\n' },
              { str: 'Software' },
              { str: ' ' },
              { str: 'Engineer' },
              { str: '\n' },
              { str: 'john.doe@email.com' },
              { str: '\n' },
              { str: '(555) 123-4567' }
            ]
          })
        })
      };

      const pdfjsLib = await import('pdfjs-dist');
      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf)
      } as any);

      const file = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });
      const result = await service.parseResume(file);

      expect(result.text).toBe('John   Doe \n Software   Engineer \n john.doe@email.com \n (555) 123-4567');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@email.com');
      expect(result.phone).toBe('(555) 123-4567');
    });

    it('should parse DOCX file successfully', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: 'Jane Smith\nSoftware Developer\njane.smith@company.com\n555-987-6543',
        messages: []
      });

      const file = new File(['docx content'], 'resume.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const result = await service.parseResume(file);

      expect(result.text).toBe('Jane Smith\nSoftware Developer\njane.smith@company.com\n555-987-6543');
      expect(result.name).toBe('Jane Smith');
      expect(result.email).toBe('jane.smith@company.com');
      expect(result.phone).toBe('(555) 987-6543');
    });

    it('should handle PDF parsing errors gracefully', async () => {
      const pdfjsLib = await import('pdfjs-dist');
      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.reject(new Error('Invalid PDF'))
      } as any);

      const file = new File(['invalid pdf'], 'resume.pdf', { type: 'application/pdf' });
      
      await expect(service.parseResume(file)).rejects.toThrow(
        'Failed to parse resume: Failed to parse PDF file. The file may be corrupted or password-protected.'
      );
    });

    it('should handle DOCX parsing errors gracefully', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockRejectedValue(new Error('Invalid DOCX'));

      const file = new File(['invalid docx'], 'resume.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      await expect(service.parseResume(file)).rejects.toThrow(
        'Failed to parse resume: Failed to parse DOCX file. The file may be corrupted or in an unsupported format.'
      );
    });
  });

  describe('extractContactInfo', () => {
    it('should extract complete contact information', () => {
      const text = `John Doe
Senior Software Engineer
john.doe@email.com
Phone: (555) 123-4567
Experience: 5 years`;

      const result = (service as any).extractContactInfo(text);

      expect(result.text).toBe(text);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@email.com');
      expect(result.phone).toBe('(555) 123-4567');
    });

    it('should extract email from various formats', () => {
      const testCases = [
        'Contact me at john.doe@company.com for more info',
        'Email: jane_smith123@university.edu',
        'Reach out: bob+work@startup.io'
      ];

      testCases.forEach((text, index) => {
        const result = (service as any).extractContactInfo(text);
        expect(result.email).toBeDefined();
      });
    });

    it('should extract phone numbers from various formats', () => {
      const testCases = [
        { text: 'Phone: (555) 123-4567', expected: '(555) 123-4567' },
        { text: 'Call me at 555-123-4567', expected: '(555) 123-4567' },
        { text: 'Mobile: 555.123.4567', expected: '(555) 123-4567' },
        { text: 'Tel: +1 555 123 4567', expected: '(555) 123-4567' },
        { text: 'Contact: 5551234567', expected: '(555) 123-4567' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = (service as any).extractContactInfo(text);
        expect(result.phone).toBe(expected);
      });
    });

    it('should extract names from the beginning of text', () => {
      const testCases = [
        { text: 'John Doe\nSenior Software Engineer', expected: 'John Doe' },
        { text: 'Mary Jane Watson\nWeb Developer', expected: 'Mary Jane Watson' },
        { text: 'Robert Smith Jr\nSenior Analyst', expected: 'Robert Smith Jr' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = (service as any).extractContactInfo(text);
        expect(result.name).toBe(expected);
      });
    });

    it('should handle missing contact information gracefully', () => {
      const text = 'This is a resume without clear contact information.';
      
      const result = (service as any).extractContactInfo(text);

      expect(result.text).toBe(text);
      expect(result.name).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.missing).toEqual(['name', 'email', 'phone']);
    });

    it('should handle partial contact information', () => {
      const text = 'john.doe@email.com\nExperienced developer';
      
      const result = (service as any).extractContactInfo(text);

      expect(result.email).toBe('john.doe@email.com');
      expect(result.name).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.missing).toEqual(['name', 'phone']);
    });

    it('should not extract email-like strings that are not emails', () => {
      const text = 'Version 2.0@company released';
      
      const result = (service as any).extractContactInfo(text);

      expect(result.email).toBeUndefined();
    });

    it('should extract phone-like strings that match the pattern', () => {
      const text = 'Error code: 123-456-7890 occurred';
      
      const result = (service as any).extractContactInfo(text);

      // The regex will match this pattern, which is expected behavior
      expect(result.phone).toBe('(123) 456-7890');
    });

    it('should handle international phone numbers', () => {
      const text = 'Phone: +1-555-123-4567';
      
      const result = (service as any).extractContactInfo(text);

      expect(result.phone).toBe('(555) 123-4567');
    });

    it('should extract first email when multiple emails are present', () => {
      const text = 'Primary: john@company.com Secondary: john.doe@personal.com';
      
      const result = (service as any).extractContactInfo(text);

      expect(result.email).toBe('john@company.com');
    });

    it('should extract first phone when multiple phones are present', () => {
      const text = 'Work: (555) 123-4567 Home: (555) 987-6543';
      
      const result = (service as any).extractContactInfo(text);

      expect(result.phone).toBe('(555) 123-4567');
    });
  });

  describe('file validation', () => {
    it('should accept PDF files', async () => {
      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({ 
            items: [{ str: 'Test content' }] 
          })
        })
      };

      const pdfjsLib = await import('pdfjs-dist');
      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf)
      } as any);

      const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      
      const result = await service.parseResume(file);
      expect(result).toBeDefined();
      expect(result.text).toBe('Test content');
    });

    it('should accept DOCX files', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: 'Test content',
        messages: []
      });

      const file = new File(['content'], 'resume.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const result = await service.parseResume(file);
      expect(result).toBeDefined();
      expect(result.text).toBe('Test content');
    });

    it('should reject unsupported file types', async () => {
      const unsupportedTypes = [
        'text/plain',
        'application/msword',
        'image/jpeg',
        'application/json'
      ];

      for (const type of unsupportedTypes) {
        const file = new File(['content'], `file.${type.split('/')[1]}`, { type });
        await expect(service.parseResume(file)).rejects.toThrow('Unsupported file type');
      }
    });
  });
});