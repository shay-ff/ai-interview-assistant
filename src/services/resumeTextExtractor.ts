import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class ResumeTextExtractor {
  // Exact regex patterns as specified
  private static readonly emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private static readonly phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{6,12}/g;

  /**
   * Extract text from PDF using PDF.js
   */
  static async extractPdfText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from DOCX using Mammoth
   */
  static async extractDocxText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.trim();
    } catch (error) {
      console.error('DOCX text extraction failed:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  /**
   * Extract text from file based on type
   */
  static async extractText(file: File): Promise<string> {
    const fileType = file.type.toLowerCase();
    
    if (fileType.includes('pdf')) {
      return this.extractPdfText(file);
    } else if (fileType.includes('document') || fileType.includes('docx')) {
      return this.extractDocxText(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Extract email addresses using exact regex
   */
  static extractEmails(text: string): string[] {
    const matches = text.match(this.emailRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Extract phone numbers using exact regex and validate
   */
  static extractPhones(text: string): string[] {
    const matches = text.match(this.phoneRegex) || [];
    const validPhones: string[] = [];

    for (const match of matches) {
      try {
        // Try to parse and validate the phone number
        if (isValidPhoneNumber(match)) {
          const parsed = parsePhoneNumber(match);
          validPhones.push(parsed.formatInternational());
        }
      } catch {
        // If parsing fails, keep original if it looks like a phone
        if (match.replace(/\D/g, '').length >= 6) {
          validPhones.push(match);
        }
      }
    }

    return [...new Set(validPhones)]; // Remove duplicates
  }

  /**
   * Extract name using heuristic: first title-cased line near top
   */
  static extractName(text: string): string | null {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Look in first 10 lines for a name
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      
      // Skip lines that are obviously not names
      if (line.includes('@') || line.includes('http') || line.includes('www.') || 
          line.length > 50 || line.length < 2) {
        continue;
      }
      
      // Check if it's title case and looks like a name
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        const isTitleCase = words.every(word => 
          word.length > 0 && 
          word[0] === word[0].toUpperCase() && 
          word.slice(1) === word.slice(1).toLowerCase()
        );
        
        if (isTitleCase) {
          return line;
        }
      }
    }
    
    return null;
  }

  /**
   * Validate if extracted information is complete
   */
  static validateExtractedInfo(name: string | null, emails: string[], phones: string[]): {
    isValid: boolean;
    missing: string[];
  } {
    const missing: string[] = [];
    
    if (!name) missing.push('name');
    if (emails.length === 0) missing.push('email');
    if (phones.length === 0) missing.push('phone');
    
    return {
      isValid: missing.length === 0,
      missing
    };
  }
}