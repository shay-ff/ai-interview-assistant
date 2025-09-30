import type { ContactInfo } from '../types/candidate';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

export class ValidationService {
  static validateContactInfo(contactInfo: ContactInfo): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Required fields validation
    if (!contactInfo.name || contactInfo.name.trim() === '') {
      errors.push('Name is required');
      score -= 30;
    } else if (contactInfo.name.length < 2) {
      warnings.push('Name seems too short');
      score -= 5;
    }

    if (!contactInfo.email || contactInfo.email.trim() === '') {
      errors.push('Email is required');
      score -= 25;
    } else if (!this.isValidEmail(contactInfo.email)) {
      errors.push('Invalid email format');
      score -= 20;
    }

    if (!contactInfo.phone || contactInfo.phone.trim() === '') {
      warnings.push('Phone number is recommended');
      score -= 10;
    } else if (!this.isValidPhone(contactInfo.phone)) {
      warnings.push('Phone number format may be incorrect');
      score -= 5;
    }

    // Skills validation
    if (!contactInfo.skills || contactInfo.skills.length === 0) {
      warnings.push('No skills detected - this may affect interview quality');
      score -= 15;
    } else if (contactInfo.skills.length < 3) {
      warnings.push('Very few skills detected');
      score -= 5;
    }

    // Experience validation
    if (!contactInfo.experience) {
      warnings.push('Experience level not detected');
      score -= 10;
    }

    // Education validation
    if (!contactInfo.education) {
      warnings.push('Education information not detected');
      score -= 5;
    }

    // Text quality validation
    if (contactInfo.text.length < 100) {
      warnings.push('Resume text seems very short');
      score -= 10;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Check if it's a valid US phone number (10 digits) or international (7-15 digits)
    return digits.length >= 7 && digits.length <= 15;
  }

  static getValidationMessage(result: ValidationResult): string {
    if (result.isValid && result.warnings.length === 0) {
      return 'Resume validation passed successfully!';
    }

    let message = '';
    
    if (result.errors.length > 0) {
      message += `Errors: ${result.errors.join(', ')}. `;
    }
    
    if (result.warnings.length > 0) {
      message += `Warnings: ${result.warnings.join(', ')}. `;
    }

    message += `Validation score: ${result.score}/100.`;
    
    return message;
  }

  static getScoreColor(score: number): string {
    if (score >= 80) return '#52c41a'; // green
    if (score >= 60) return '#faad14'; // orange
    return '#ff4d4f'; // red
  }
}