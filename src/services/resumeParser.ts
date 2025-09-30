import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { ContactInfo } from '../types/candidate';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export class ResumeParserService {
  

  async parseResume(file: File): Promise<ContactInfo> {
    try {
      console.log('🔍 Starting resume parse:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.split('.').pop();
      
      const isPdfByExtension = fileExtension === 'pdf';
      const isDocxByExtension = fileExtension === 'docx';
      
      const isPdfByMime = file.type && (
        file.type === 'application/pdf' ||
        file.type === 'application/x-pdf' ||
        file.type === 'text/pdf' ||
        file.type === 'application/octet-stream'
      );
      
      const isDocxByMime = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const isPdf = isPdfByExtension || isPdfByMime;
      const isDocx = isDocxByExtension || isDocxByMime;

      console.log('📋 File validation:', {
        fileExtension,
        isPdfByExtension,
        isPdfByMime,
        isDocxByExtension,
        isDocxByMime,
        finalIsPdf: isPdf,
        finalIsDocx: isDocx
      });

      if (!isPdf && !isDocx) {
        throw new Error(`Unsupported file type. File: ${file.name}, Extension: ${fileExtension}, MIME: ${file.type || 'unknown'}. Only PDF and DOCX files are supported.`);
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit.');
      }

      let text: string;

      if (isPdfByExtension || (isPdf && !isDocx)) {
        console.log('📄 Parsing as PDF...');
        text = await this.parsePDF(file);
      } else if (isDocxByExtension || isDocx) {
        console.log('📝 Parsing as DOCX...');
        text = await this.parseDOCX(file);
      } else {
        throw new Error('Could not determine file format');
      }

      console.log('✅ Text extracted, length:', text.length);

      const contactInfo = this.extractContactInfo(text);
      
      console.log('📊 Resume Parsing Results:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extractedTextLength: text.length,
        extractedTextPreview: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        contactInfo
      });
      
      return contactInfo;
    } catch (error) {
      console.error('❌ Resume parsing failed:', error);
      throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parsePDF(file: File): Promise<string> {
    try {
      console.log('📖 Reading PDF file...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('📖 Array buffer size:', arrayBuffer.byteLength);
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('📖 PDF loaded, pages:', pdf.numPages);
      
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
        console.log(`📄 Page ${pageNum} extracted, length: ${pageText.length}`);
      }

      console.log('✅ PDF parsing complete, total text length:', fullText.length);
      return fullText.trim();
    } catch (error) {
      console.error('❌ PDF parsing error:', error);
      throw new Error('Failed to parse PDF file. The file may be corrupted or password-protected.');
    }
  }

  private async parseDOCX(file: File): Promise<string> {
    try {
      console.log('📖 Reading DOCX file...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('📖 Array buffer size:', arrayBuffer.byteLength);
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (result.messages.length > 0) {
        console.warn('⚠️ DOCX parsing warnings:', result.messages);
      }

      console.log('✅ DOCX parsing complete, text length:', result.value.length);
      return result.value.trim();
    } catch (error) {
      console.error('❌ DOCX parsing error:', error);
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

    // Extract email - more robust pattern
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatch = text.match(emailRegex);
    if (emailMatch && emailMatch.length > 0) {
      contactInfo.email = emailMatch[0];
    }

    // Extract phone number - IMPROVED to handle international formats
    // Matches: +91-7903947117, +1 (555) 123-4567, 555-123-4567, (555) 123-4567, etc.
    const phonePatterns = [
      // International format with country code: +91-7903947117, +1-555-123-4567
      /\+?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
      // US/Canada format: (555) 123-4567 or 555-123-4567
      /\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      // Indian format: 9876543210 (10 digits)
      /\b[6-9]\d{9}\b/g,
      // Generic international: +XX XXXXXXXXXX
      /\+\d{1,3}\s?\d{6,14}/g
    ];

    for (const pattern of phonePatterns) {
      const phoneMatch = text.match(pattern);
      if (phoneMatch && phoneMatch.length > 0) {
        // Take the first valid match and clean it
        let phone = phoneMatch[0].trim();
        
        // If it starts with country code, keep it as-is
        if (phone.startsWith('+')) {
          contactInfo.phone = phone;
        } else {
          // Clean up and format
          const digitsOnly = phone.replace(/[^\d]/g, '');
          
          // If 10 digits, format as (XXX) XXX-XXXX
          if (digitsOnly.length === 10) {
            contactInfo.phone = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
          } else {
            // Keep original format for other lengths
            contactInfo.phone = phone;
          }
        }
        // Phone number found
        break;
      }
    }

    // Extract name - IMPROVED algorithm
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Strategy 1: Look for name in first few lines
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      
      // Skip lines with special characters, numbers, emails, or common keywords
      if (
        line.includes('@') || 
        line.includes('http') ||
        line.includes('#') ||
        line.includes('§') ||
        line.includes('Ð') ||
        /\d{3,}/.test(line) || // Skip lines with 3+ consecutive digits
        line.toLowerCase().includes('resume') ||
        line.toLowerCase().includes('curriculum') ||
        line.toLowerCase().includes('vitae') ||
        line.toLowerCase().includes('engineer') ||
        line.toLowerCase().includes('developer') ||
        line.toLowerCase().includes('analyst') ||
        line.toLowerCase().includes('manager')
      ) {
        continue;
      }

      // Look for 2-4 capitalized words (typical name pattern)
      const namePattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})$/;
      const match = line.match(namePattern);
      
      if (match) {
        const potentialName = match[1].trim();
        // Validate it's not too long (names are typically 2-4 words)
        const wordCount = potentialName.split(/\s+/).length;
        if (wordCount >= 2 && wordCount <= 4) {
          contactInfo.name = potentialName;
          break;
        }
      }
      
      // Strategy 2: If first line has 2-3 words with capital letters, likely the name
      if (i === 0) {
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
          const allCapitalized = words.every(w => /^[A-Z]/.test(w));
          if (allCapitalized && !line.includes('*') && line.length < 50) {
            contactInfo.name = words.join(' ');
            break;
          }
        }
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
      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'HTML', 'CSS',
      'SASS', 'LESS', 'Webpack', 'Babel', 'Jest', 'Cypress', 'Selenium', 'Agile', 'Scrum', 'DevOps',
      'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'R', 'Go', 'Rust', 'PHP',
      'Ruby', 'Swift', 'Kotlin', 'Flutter', 'React Native', 'Express', 'Django', 'Flask', 'Spring',
      'Laravel', 'Rails', 'GraphQL', 'REST API', 'Microservices', 'CI/CD', 'Jenkins', 'GitLab',
      'GitHub Actions', 'Terraform', 'Ansible', 'Linux', 'Windows', 'macOS', 'iOS', 'Android',
      'NumPy', 'Pandas', 'Power BI', 'Tableau', 'Excel', 'Data Analysis', 'Statistics', 'Matplotlib',
      'Seaborn', 'Scikit-learn', 'Keras', 'OpenCV', 'NLP', 'Deep Learning', 'ETL', 'BigQuery',
      'Snowflake', 'Spark', 'Hadoop', 'Kafka', 'Redis', 'Elasticsearch', 'Redshift', 'Airflow'
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
      /(?:Bachelor|Master|PhD|B\.S\.|M\.S\.|Ph\.D\.|B\.A\.|M\.A\.|B\.Tech|M\.Tech|B\.E\.|M\.E\.)[\s\w,.-]*/gi,
      /(?:University|College|Institute)[\s\w,.-]*/gi,
      /(?:Computer Science|Engineering|Mathematics|Physics|Chemistry|Biology|Information Technology)[\s\w,.-]*/gi
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
    // Improved location patterns
    const locationPatterns = [
      /(?:Located in|Based in|Location)[:\s]*([A-Za-z\s,.-]+)/gi,
      /(?:Bangalore|Mumbai|Delhi|Hyderabad|Pune|Chennai|Kolkata|Ahmedabad),\s*(?:India|IN)/gi,
      /(?:New York|San Francisco|Los Angeles|Seattle|Austin|Boston),\s*(?:USA|US)/gi,
      /([A-Za-z]+,\s*[A-Za-z]+)/g // Generic City, Country/State pattern
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match.length > 0) {
        contactInfo.location = match[0].replace(/(?:Located in|Based in|Location)[:\s]*/gi, '').trim();
        break;
      }
    }
  }

  private extractSocialLinks(text: string, contactInfo: ContactInfo): void {
    // Extract LinkedIn - improved pattern
    const linkedinPattern = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([a-zA-Z0-9-]+)/gi;
    const linkedinMatch = text.match(linkedinPattern);
    if (linkedinMatch && linkedinMatch.length > 0) {
      const username = linkedinMatch[0].split('/').pop();
      contactInfo.linkedin = `https://linkedin.com/in/${username}`;
    }

    // Extract GitHub - improved pattern
    const githubPattern = /(?:github\.com\/)([a-zA-Z0-9-]+)/gi;
    const githubMatch = text.match(githubPattern);
    if (githubMatch && githubMatch.length > 0) {
      const username = githubMatch[0].split('/').pop();
      contactInfo.github = `https://github.com/${username}`;
    }

    // Extract portfolio/personal website
    const portfolioPattern = /(?:portfolio|website|personal)[:\s]*(https?:\/\/[^\s]+)/gi;
    const portfolioMatch = text.match(portfolioPattern);
    if (portfolioMatch && portfolioMatch.length > 0) {
      contactInfo.portfolio = portfolioMatch[0].replace(/(?:portfolio|website|personal)[:\s]*/gi, '').trim();
    }

    // Generic URL extraction for portfolio
    if (!contactInfo.portfolio) {
      const urlPattern = /(https?:\/\/[^\s]+(?:portfolio|personal|website)[^\s]*)/gi;
      const urlMatch = text.match(urlPattern);
      if (urlMatch && urlMatch.length > 0) {
        contactInfo.portfolio = urlMatch[0];
      }
    }
  }
}