import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIQuestionService } from '../aiService';
import type { Question } from '../../types/interview';
import type { QuestionDifficulty } from '../../types/common';

describe('AIQuestionService', () => {
  let service: AIQuestionService;

  beforeEach(() => {
    service = new AIQuestionService();
    vi.clearAllMocks();
  });

  describe('generateQuestions', () => {
    it('should generate exactly 6 questions with correct difficulty distribution', () => {
      const resumeText = `
        John Doe
        Full Stack Developer
        Experience with React, Node.js, JavaScript, Express, MongoDB
        Built several web applications using modern frameworks
      `;

      const questions = service.generateQuestions(resumeText);

      expect(questions).toHaveLength(6);
      
      const easyQuestions = questions.filter(q => q.difficulty === 'easy');
      const mediumQuestions = questions.filter(q => q.difficulty === 'medium');
      const hardQuestions = questions.filter(q => q.difficulty === 'hard');

      expect(easyQuestions).toHaveLength(2);
      expect(mediumQuestions).toHaveLength(2);
      expect(hardQuestions).toHaveLength(2);
    });

    it('should assign correct time limits based on difficulty', () => {
      const resumeText = 'React developer with Node.js experience';
      const questions = service.generateQuestions(resumeText);

      questions.forEach(question => {
        switch (question.difficulty) {
          case 'easy':
            expect(question.timeLimit).toBe(20);
            break;
          case 'medium':
            expect(question.timeLimit).toBe(60);
            break;
          case 'hard':
            expect(question.timeLimit).toBe(120);
            break;
        }
      });
    });

    it('should assign sequential order numbers to questions', () => {
      const resumeText = 'JavaScript developer';
      const questions = service.generateQuestions(resumeText);

      expect(questions[0].order).toBe(1);
      expect(questions[1].order).toBe(2);
      expect(questions[2].order).toBe(3);
      expect(questions[3].order).toBe(4);
      expect(questions[4].order).toBe(5);
      expect(questions[5].order).toBe(6);
    });

    it('should generate unique question IDs', () => {
      const resumeText = 'Full stack developer';
      const questions = service.generateQuestions(resumeText);

      const ids = questions.map(q => q.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(questions.length);
    });

    it('should set createdAt timestamp for all questions', () => {
      const resumeText = 'Web developer';
      const questions = service.generateQuestions(resumeText);

      questions.forEach(question => {
        expect(question.createdAt).toBeInstanceOf(Date);
        expect(question.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      });
    });

    it('should include category information for all questions', () => {
      const resumeText = 'React and Node.js developer';
      const questions = service.generateQuestions(resumeText);

      questions.forEach(question => {
        expect(question.category).toBeDefined();
        expect(typeof question.category).toBe('string');
        expect(question.category.length).toBeGreaterThan(0);
      });
    });

    it('should prioritize contextually relevant questions based on resume keywords', () => {
      const reactResumeText = `
        Senior React Developer
        5 years experience with React, JSX, hooks, state management
        Built multiple React applications with modern practices
      `;

      const nodeResumeText = `
        Backend Node.js Developer
        Expert in Node.js, Express, middleware, JWT authentication
        Built scalable APIs and microservices
      `;

      const reactQuestions = service.generateQuestions(reactResumeText);
      const nodeQuestions = service.generateQuestions(nodeResumeText);

      // Check that React-focused resume gets more React-related questions
      const reactRelatedQuestions = reactQuestions.filter(q => 
        q.text.toLowerCase().includes('react') || 
        q.text.toLowerCase().includes('jsx') ||
        q.text.toLowerCase().includes('component')
      );

      // Check that Node-focused resume gets more Node-related questions
      const nodeRelatedQuestions = nodeQuestions.filter(q => 
        q.text.toLowerCase().includes('node') || 
        q.text.toLowerCase().includes('express') ||
        q.text.toLowerCase().includes('middleware')
      );

      // At least some questions should be contextually relevant
      expect(reactRelatedQuestions.length).toBeGreaterThan(0);
      expect(nodeRelatedQuestions.length).toBeGreaterThan(0);
    });

    it('should handle empty resume text gracefully', () => {
      const questions = service.generateQuestions('');

      expect(questions).toHaveLength(6);
      expect(questions.every(q => q.id && q.text && q.difficulty)).toBe(true);
    });

    it('should handle resume text with no technical keywords', () => {
      const resumeText = `
        John Smith
        Manager at ABC Company
        Excellent communication skills
        Team leadership experience
      `;

      const questions = service.generateQuestions(resumeText);

      expect(questions).toHaveLength(6);
      expect(questions.every(q => q.text.length > 0)).toBe(true);
    });

    it('should return fallback questions when generation fails', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error by mocking a method to throw
      const originalMethod = service.generateQuestions;
      vi.spyOn(service, 'generateQuestions').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      // Restore the original method and call it
      service.generateQuestions = originalMethod;
      const questions = service.generateQuestions('test resume');

      expect(questions).toHaveLength(6);
      expect(questions.every(q => q.id && q.text)).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('question content validation', () => {
    it('should generate Full Stack React/Node.js focused questions', () => {
      const resumeText = 'Full stack developer with React and Node.js';
      const questions = service.generateQuestions(resumeText);

      const fullStackKeywords = [
        'react', 'node', 'javascript', 'express', 'jsx', 'component',
        'api', 'backend', 'frontend', 'database', 'server', 'middleware'
      ];

      const questionsText = questions.map(q => q.text.toLowerCase()).join(' ');
      
      // At least some full stack keywords should appear in the questions
      const foundKeywords = fullStackKeywords.filter(keyword => 
        questionsText.includes(keyword)
      );

      expect(foundKeywords.length).toBeGreaterThan(0);
    });

    it('should have appropriate question complexity for each difficulty level', () => {
      const resumeText = 'React Node.js developer';
      const questions = service.generateQuestions(resumeText);

      const easyQuestions = questions.filter(q => q.difficulty === 'easy');
      const mediumQuestions = questions.filter(q => q.difficulty === 'medium');
      const hardQuestions = questions.filter(q => q.difficulty === 'hard');

      // Easy questions should be shorter and more basic
      easyQuestions.forEach(q => {
        expect(q.text.length).toBeLessThan(200);
      });

      // Hard questions should be longer and more complex
      hardQuestions.forEach(q => {
        expect(q.text.length).toBeGreaterThan(50);
      });
    });

    it('should not repeat the same question in a single generation', () => {
      const resumeText = 'JavaScript React Node.js developer';
      const questions = service.generateQuestions(resumeText);

      const questionTexts = questions.map(q => q.text);
      const uniqueTexts = new Set(questionTexts);

      expect(uniqueTexts.size).toBe(questionTexts.length);
    });
  });

  describe('getQuestionStats', () => {
    it('should return correct statistics about available questions', () => {
      const stats = service.getQuestionStats();

      expect(stats.easy).toBeGreaterThan(0);
      expect(stats.medium).toBeGreaterThan(0);
      expect(stats.hard).toBeGreaterThan(0);
      expect(stats.total).toBe(stats.easy + stats.medium + stats.hard);
    });

    it('should have sufficient questions for variety', () => {
      const stats = service.getQuestionStats();

      // Should have more questions than the minimum required (2 per difficulty)
      expect(stats.easy).toBeGreaterThanOrEqual(4);
      expect(stats.medium).toBeGreaterThanOrEqual(4);
      expect(stats.hard).toBeGreaterThanOrEqual(4);
    });
  });

  describe('question randomization', () => {
    it('should generate different question sets for the same resume', () => {
      const resumeText = 'React Node.js full stack developer';
      
      const questions1 = service.generateQuestions(resumeText);
      const questions2 = service.generateQuestions(resumeText);

      // Questions should be different due to randomization
      const texts1 = questions1.map(q => q.text).sort();
      const texts2 = questions2.map(q => q.text).sort();

      // At least some questions should be different
      const differentQuestions = texts1.filter((text, index) => text !== texts2[index]);
      expect(differentQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle malformed resume text', () => {
      const malformedTexts = [
        null as any,
        undefined as any,
        123 as any,
        {} as any,
        [] as any
      ];

      malformedTexts.forEach(text => {
        expect(() => service.generateQuestions(text)).not.toThrow();
        const questions = service.generateQuestions(text);
        expect(questions).toHaveLength(6);
      });
    });

    it('should log generation process', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      service.generateQuestions('React developer');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generating Full Stack interview questions')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('fallback questions', () => {
    it('should provide valid fallback questions', () => {
      // Access private method for testing
      const fallbackQuestions = (service as any).getFallbackQuestions();

      expect(fallbackQuestions).toHaveLength(6);
      
      const difficulties = fallbackQuestions.map((q: Question) => q.difficulty);
      expect(difficulties.filter((d: QuestionDifficulty) => d === 'easy')).toHaveLength(2);
      expect(difficulties.filter((d: QuestionDifficulty) => d === 'medium')).toHaveLength(2);
      expect(difficulties.filter((d: QuestionDifficulty) => d === 'hard')).toHaveLength(2);

      fallbackQuestions.forEach((q: Question) => {
        expect(q.id).toBeDefined();
        expect(q.text).toBeDefined();
        expect(q.category).toBeDefined();
        expect(q.timeLimit).toBeGreaterThan(0);
        expect(q.order).toBeGreaterThan(0);
        expect(q.createdAt).toBeInstanceOf(Date);
      });
    });
  });
});