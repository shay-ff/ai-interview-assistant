import type { Question, Answer } from '../types/interview';
import type { QuestionDifficulty } from '../types/common';

// Optimized AI Service for Groq API with batching
export class OptimizedAIService {
  private static readonly API_BASE_URL = '/api'; // Use relative path for development

  /**
   * Generate all interview questions upfront (Groq Call #1)
   */
  static async generateQuestions(
    resumeText: string,
    difficulty: QuestionDifficulty = 'medium',
    count: number = 5
  ): Promise<Question[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          difficulty,
          count,
          category: 'technical'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate questions: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to Question format
      return data.questions.map((q: any, index: number) => ({
        id: q.id || `q_${Date.now()}_${index}`,
        text: q.text || q.question,
        difficulty: q.difficulty || difficulty,
        timeLimit: this.getTimeLimit(q.difficulty || difficulty),
        category: q.category || 'technical',
        order: index + 1,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback to mock questions when API is not available
      return this.generateMockQuestions(difficulty, count);
    }
  }

  /**
   * Generate mock questions when API is unavailable
   */
  private static generateMockQuestions(_difficulty: QuestionDifficulty, count: number): Question[] {
    const mockQuestions = [
      {
        id: 'mock_1',
        text: 'Tell me about your experience with React and modern frontend development.',
        difficulty: 'medium' as QuestionDifficulty,
        timeLimit: 60,
        category: 'frontend',
        order: 1,
        createdAt: new Date(),
      },
      {
        id: 'mock_2', 
        text: 'How do you handle state management in large React applications?',
        difficulty: 'medium' as QuestionDifficulty,
        timeLimit: 60,
        category: 'react',
        order: 2,
        createdAt: new Date(),
      },
      {
        id: 'mock_3',
        text: 'Describe your approach to optimizing web application performance.',
        difficulty: 'hard' as QuestionDifficulty,
        timeLimit: 120,
        category: 'performance',
        order: 3,
        createdAt: new Date(),
      },
      {
        id: 'mock_4',
        text: 'What is your experience with TypeScript and why is it beneficial?',
        difficulty: 'easy' as QuestionDifficulty,
        timeLimit: 30,
        category: 'typescript',
        order: 4,
        createdAt: new Date(),
      },
      {
        id: 'mock_5',
        text: 'How do you ensure code quality and maintainability in your projects?',
        difficulty: 'medium' as QuestionDifficulty,
        timeLimit: 60,
        category: 'best-practices',
        order: 5,
        createdAt: new Date(),
      }
    ];

    return mockQuestions.slice(0, count);
  }

  /**
   * Evaluate all answers in a single batch call (Groq Call #2)
   */
  static async evaluateInterviewBatch(
    questions: Question[],
    answers: Answer[],
    resumeText: string
  ): Promise<{
    overallScore: number;
    summary: string;
    detailedEvaluation: {
      questionId: string;
      score: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
    }[];
    recommendations: string[];
  }> {
    try {
      // Prepare Q&A pairs for batch evaluation
      const qapairs = questions.map(question => {
        const answer = answers.find(a => a.questionId === question.id);
        return {
          questionId: question.id,
          question: question.text,
          answer: answer?.text || '',
          timeSpent: answer?.timeSpent || 0,
          difficulty: question.difficulty,
          category: question.category,
        };
      });

      const response = await fetch(`${this.API_BASE_URL}/evaluate-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          qapairs: qapairs,
          totalQuestions: questions.length,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to evaluate interview: ${response.statusText}`);
      }

      const evaluation = await response.json();
      
      return {
        overallScore: evaluation.overallScore || 0,
        summary: evaluation.summary || 'Interview completed',
        detailedEvaluation: evaluation.detailedEvaluation || [],
        recommendations: evaluation.recommendations || [],
      };
    } catch (error) {
      console.error('Error evaluating interview batch:', error);
      // Return mock evaluation when API is not available
      return this.generateMockEvaluation(questions, answers);
    }
  }

  /**
   * Generate mock evaluation when API is unavailable
   */
  private static generateMockEvaluation(questions: Question[], answers: Answer[]) {
    const answeredCount = answers.filter(a => a.text.trim()).length;
    const totalCount = questions.length;
    const baseScore = Math.round((answeredCount / totalCount) * 70) + Math.floor(Math.random() * 20) + 10;

    return {
      overallScore: Math.min(baseScore, 100),
      summary: `Great job completing ${answeredCount}/${totalCount} questions! You showed good technical understanding and communication skills.`,
      detailedEvaluation: questions.map((q, _index) => {
        const answer = answers.find(a => a.questionId === q.id);
        const score = answer?.text.trim() ? Math.floor(Math.random() * 30) + 60 : 0;
        
        return {
          questionId: q.id,
          score,
          feedback: answer?.text.trim() 
            ? `Good response showing understanding of ${q.category}. Consider adding more specific examples.`
            : 'No answer provided for this question.',
          strengths: answer?.text.trim() ? ['Clear communication', 'Technical knowledge'] : [],
          improvements: answer?.text.trim() ? ['Add more examples', 'Be more specific'] : ['Answer all questions']
        };
      }),
      recommendations: [
        'Continue practicing technical explanations',
        'Work on providing concrete examples',
        'Keep up the good communication skills'
      ]
    };
  }

  /**
   * Get time limit based on difficulty
   */
  private static getTimeLimit(difficulty: QuestionDifficulty): number {
    switch (difficulty) {
      case 'easy':
        return 20; // 20 seconds
      case 'medium':
        return 60; // 60 seconds  
      case 'hard':
        return 120; // 120 seconds
      default:
        return 60;
    }
  }

  /**
   * Validate service availability
   */
  static async checkService(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('AI Service health check failed:', error);
      return false;
    }
  }
}

export default OptimizedAIService;