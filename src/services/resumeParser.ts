import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { ContactInfo } from '../types/candidate';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class ResumeParserService {
  private readonly supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  async parseResume(file: File): Promise<ContactInfo> {
    try {
      // Validate file type
      if (!this.supportedTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}. Only PDF and DOCX files are supported.`);
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit.');
      }

      let text: string;

      // Parse based on file type
      if (file.type === 'application/pdf') {
        text = await this.parsePDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await this.parseDOCX(file);
      } else {
        throw new Error('Unsupported file format');
      }

      // Extract contact information
      const contactInfo = this.extractContactInfo(text);
      
      // Debug logging - remove in production
      console.log('Resume Parsing Results:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extractedText: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        contactInfo
      });
      
      return contactInfo;
    } catch (error) {
      console.error('Resume parsing failed:', error);
      throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parsePDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file. The file may be corrupted or password-protected.');
    }
  }

  private async parseDOCX(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (result.messages.length > 0) {
        console.warn('DOCX parsing warnings:', result.messages);
      }

      return result.value.trim();
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX file. The file may be corrupted or in an unsupported format.');
    }
  }

  private extractContactInfo(text: string): ContactInfo {
    const contactInfo: ContactInfo = {
      text,
      name: undefined,
      email: undefined,
      phone: undefined,
      missing: [],
      skills: [],
      experience: undefined,
      education: undefined,
      location: undefined,
      linkedin: undefined,
      github: undefined,
      portfolio: undefined,
    };

    // Extract email using regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatch = text.match(emailRegex);
    if (emailMatch && emailMatch.length > 0) {
      contactInfo.email = emailMatch[0];
    }

    // Extract phone number using regex (supports various formats)
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch && phoneMatch.length > 0) {
      // Clean up the phone number
      const cleanPhone = phoneMatch[0].replace(/[^\d]/g, '').replace(/^1/, '');
      if (cleanPhone.length === 10) {
        contactInfo.phone = `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
      } else {
        contactInfo.phone = cleanPhone;
      }
    }

    // Extract name (heuristic approach - look for name patterns at the beginning)
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Look for lines with 2-4 capitalized words (likely a name)
      const namePattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/;
      const match = line.match(namePattern);
      if (match && !line.includes('@') && !line.match(/\d/) && !line.toLowerCase().includes('engineer') && !line.toLowerCase().includes('developer')) {
        contactInfo.name = match[1];
        break;
      }
    }

    // Extract additional information
    this.extractSkills(text, contactInfo);
    this.extractExperience(text, contactInfo);
    this.extractEducation(text, contactInfo);
    this.extractLocation(text, contactInfo);
    this.extractSocialLinks(text, contactInfo);

    // Track missing fields
    if (!contactInfo.name) contactInfo.missing.push('name');
    if (!contactInfo.email) contactInfo.missing.push('email');
    if (!contactInfo.phone) contactInfo.missing.push('phone');

    return contactInfo;
  }

  private extractSkills(text: string, contactInfo: ContactInfo): void {
    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'C++', 'C#',
      'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'HTML', 'CSS',
      'SASS', 'LESS', 'Webpack', 'Babel', 'Jest', 'Cypress', 'Selenium', 'Agile', 'Scrum', 'DevOps',
      'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'R', 'Go', 'Rust', 'PHP',
      'Ruby', 'Swift', 'Kotlin', 'Flutter', 'React Native', 'Express', 'Django', 'Flask', 'Spring',
      'Laravel', 'Rails', 'GraphQL', 'REST API', 'Microservices', 'CI/CD', 'Jenkins', 'GitLab',
      'GitHub Actions', 'Terraform', 'Ansible', 'Linux', 'Windows', 'macOS', 'iOS', 'Android'
    ];

    const foundSkills: string[] = [];
    const lowerText = text.toLowerCase();

    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    contactInfo.skills = foundSkills;
  }

  private extractExperience(text: string, contactInfo: ContactInfo): void {
    // Look for experience patterns
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi,
      /(\d+)\+?\s*years?\s*(?:in|of)/gi,
      /experience[:\s]*(\d+)\+?\s*years?/gi
    ];

    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match) {
        contactInfo.experience = match[0];
        break;
      }
    }
  }

  private extractEducation(text: string, contactInfo: ContactInfo): void {
    const educationPatterns = [
      /(?:Bachelor|Master|PhD|B\.S\.|M\.S\.|Ph\.D\.|B\.A\.|M\.A\.)[\s\w,.-]*/gi,
      /(?:University|College|Institute)[\s\w,.-]*/gi,
      /(?:Computer Science|Engineering|Mathematics|Physics|Chemistry|Biology)[\s\w,.-]*/gi
    ];

    for (const pattern of educationPatterns) {
      const match = text.match(pattern);
      if (match && match.length > 0) {
        contactInfo.education = match[0];
        break;
      }
    }
  }

  private extractLocation(text: string, contactInfo: ContactInfo): void {
    // Look for location patterns (city, state, country)
    const locationPattern = /(?:Located in|Based in|Location)[:\s]*([A-Za-z\s,.-]+)/gi;
    const match = text.match(locationPattern);
    if (match) {
      contactInfo.location = match[1].trim();
    }
  }

  private extractSocialLinks(text: string, contactInfo: ContactInfo): void {
    // Extract LinkedIn
    const linkedinPattern = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([a-zA-Z0-9-]+)/gi;
    const linkedinMatch = text.match(linkedinPattern);
    if (linkedinMatch) {
      contactInfo.linkedin = `https://linkedin.com/in/${linkedinMatch[0].split('/').pop()}`;
    }

    // Extract GitHub
    const githubPattern = /(?:github\.com\/)([a-zA-Z0-9-]+)/gi;
    const githubMatch = text.match(githubPattern);
    if (githubMatch) {
      contactInfo.github = `https://github.com/${githubMatch[0].split('/').pop()}`;
    }

    // Extract portfolio/personal website
    const portfolioPattern = /(?:portfolio|website|personal)[:\s]*(https?:\/\/[^\s]+)/gi;
    const portfolioMatch = text.match(portfolioPattern);
    if (portfolioMatch) {
      contactInfo.portfolio = portfolioMatch[1];
    }
  }
}