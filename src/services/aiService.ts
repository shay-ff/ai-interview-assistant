import type { Question } from '../types/interview';
import type { QuestionDifficulty } from '../types/common';

interface QuestionTemplate {
  text: string;
  category: string;
  keywords: string[];
}

export class AIQuestionService {
  private readonly QUESTIONS_PER_DIFFICULTY = 2;
  private readonly TIME_LIMITS = {
    easy: 20, // 20 seconds
    medium: 60, // 60 seconds
    hard: 120, // 120 seconds
  };

  // Full Stack React/Node question banks - Optimized for time limits
  private readonly easyQuestions: QuestionTemplate[] = [
    {
      text: 'What is the difference between let, const, and var? (Quick answer expected)',
      category: 'JavaScript Fundamentals',
      keywords: ['javascript', 'js', 'frontend', 'web'],
    },
    {
      text: 'What is JSX in React? One sentence explanation.',
      category: 'React Basics',
      keywords: ['react', 'jsx', 'frontend', 'component'],
    },
    {
      text: 'What is package.json for? (Quick answer)',
      category: 'Node.js Basics',
      keywords: ['node', 'nodejs', 'backend', 'npm'],
    },
    {
      text: 'How do you handle onClick events in React?',
      category: 'React Events',
      keywords: ['react', 'events', 'onclick', 'frontend'],
    },
    {
      text: 'What is the difference between == and === ?',
      category: 'JavaScript Fundamentals',
      keywords: ['javascript', 'comparison', 'equality'],
    },
    {
      text: 'What are props in React? One sentence.',
      category: 'React Props',
      keywords: ['react', 'props', 'component', 'data'],
    },
    {
      text: 'What is npm? Quick explanation.',
      category: 'Package Management',
      keywords: ['npm', 'node', 'packages', 'install'],
    },
    {
      text: 'How to create a basic HTTP server in Node.js?',
      category: 'Node.js HTTP',
      keywords: ['node', 'http', 'server', 'backend'],
    },
  ];

  private readonly mediumQuestions: QuestionTemplate[] = [
    {
      text: 'Explain React useState hook with a simple example (60s limit).',
      category: 'React State Management',
      keywords: ['react', 'state', 'usestate', 'hooks'],
    },
    {
      text: 'What is Express.js middleware? Give one example (60s).',
      category: 'Express Middleware',
      keywords: ['express', 'middleware', 'node', 'backend'],
    },
    {
      text: 'Explain useEffect hook in React (60s).',
      category: 'React Lifecycle',
      keywords: ['react', 'lifecycle', 'useeffect', 'hooks'],
    },
    {
      text: 'What are promises and async/await in JavaScript? (60s)',
      category: 'Async JavaScript',
      keywords: ['async', 'await', 'promises', 'javascript'],
    },
    {
      text: 'SQL vs NoSQL databases - when to use each? (60s)',
      category: 'Database Design',
      keywords: ['database', 'sql', 'nosql', 'mongodb', 'mysql'],
    },
    {
      text: 'How to implement JWT authentication in Node.js? (60s)',
      category: 'Authentication',
      keywords: ['jwt', 'auth', 'token', 'security', 'node'],
    },
    {
      text: 'When would you use Redux over React state? (60s)',
      category: 'State Management',
      keywords: ['redux', 'state', 'management', 'react'],
    },
    {
      text: 'How to handle CORS in Express.js? (60s)',
      category: 'CORS & Security',
      keywords: ['cors', 'express', 'security', 'headers'],
    },
  ];

  private readonly hardQuestions: QuestionTemplate[] = [
    {
      text: 'Briefly explain React performance optimization techniques (2 min).',
      category: 'React Optimization',
      keywords: [
        'optimization',
        'performance',
        'lazy',
        'memoization',
        'splitting',
      ],
    },
    {
      text: 'Describe a RESTful API design for user authentication (2 min).',
      category: 'API Design',
      keywords: ['api', 'rest', 'auth', 'validation', 'security'],
    },
    {
      text: 'How would you handle database transactions in Node.js? (2 min)',
      category: 'Database Transactions',
      keywords: ['transactions', 'consistency', 'concurrent', 'database'],
    },
    {
      text: 'Explain how to implement a custom React hook (2 min).',
      category: 'Advanced React',
      keywords: ['hooks', 'custom', 'react', 'state'],
    },
    {
      text: 'What caching strategies would you use for a Node.js app? (2 min)',
      category: 'Caching & Performance',
      keywords: ['caching', 'redis', 'performance', 'scalability'],
    },
    {
      text: 'Describe server-side rendering vs client-side rendering (2 min).',
      category: 'SSR & Performance',
      keywords: ['ssr', 'server-side', 'rendering', 'performance', 'seo'],
    },
    {
      text: 'How would you structure a real-time chat app architecture? (2 min)',
      category: 'System Design',
      keywords: [
        'architecture',
        'websocket',
        'realtime',
        'performance',
      ],
    },
    {
      text: 'Explain microservices vs monolithic architecture (2 min).',
      category: 'Microservices',
      keywords: [
        'microservices',
        'architecture',
        'monolithic',
        'deployment',
      ],
    },
  ];

  generateQuestions(resumeText: string): Question[] {
    try {
      console.log('🤖 Generating Full Stack interview questions...');

      // Validate and sanitize input
      const safeResumeText = typeof resumeText === 'string' ? resumeText : '';

      const questions: Question[] = [];
      let questionOrder = 1;

      // Generate 2 Easy questions
      const easyQuestions = this.generateEasyQuestions(safeResumeText);
      questions.push(
        ...easyQuestions.slice(0, this.QUESTIONS_PER_DIFFICULTY).map((q) => ({
          ...q,
          order: questionOrder++,
        }))
      );

      // Generate 2 Medium questions
      const mediumQuestions = this.generateMediumQuestions(safeResumeText);
      questions.push(
        ...mediumQuestions.slice(0, this.QUESTIONS_PER_DIFFICULTY).map((q) => ({
          ...q,
          order: questionOrder++,
        }))
      );

      // Generate 2 Hard questions
      const hardQuestions = this.generateHardQuestions(safeResumeText);
      questions.push(
        ...hardQuestions.slice(0, this.QUESTIONS_PER_DIFFICULTY).map((q) => ({
          ...q,
          order: questionOrder++,
        }))
      );

      console.log(`✅ Generated ${questions.length} questions:`, {
        easy: questions.filter((q) => q.difficulty === 'easy').length,
        medium: questions.filter((q) => q.difficulty === 'medium').length,
        hard: questions.filter((q) => q.difficulty === 'hard').length,
      });

      return questions;
    } catch (error) {
      console.error('❌ Error generating questions:', error);
      return this.getFallbackQuestions();
    }
  }

  private generateEasyQuestions(resumeText: string): Question[] {
    const contextualQuestions = this.selectContextualQuestions(
      this.easyQuestions,
      resumeText,
      this.QUESTIONS_PER_DIFFICULTY + 2 // Get extra for variety
    );

    return contextualQuestions.map((template) =>
      this.createQuestion(template, 'easy')
    );
  }

  private generateMediumQuestions(resumeText: string): Question[] {
    const contextualQuestions = this.selectContextualQuestions(
      this.mediumQuestions,
      resumeText,
      this.QUESTIONS_PER_DIFFICULTY + 2
    );

    return contextualQuestions.map((template) =>
      this.createQuestion(template, 'medium')
    );
  }

  private generateHardQuestions(resumeText: string): Question[] {
    const contextualQuestions = this.selectContextualQuestions(
      this.hardQuestions,
      resumeText,
      this.QUESTIONS_PER_DIFFICULTY + 2
    );

    return contextualQuestions.map((template) =>
      this.createQuestion(template, 'hard')
    );
  }

  private selectContextualQuestions(
    questionBank: QuestionTemplate[],
    resumeText: string,
    count: number
  ): QuestionTemplate[] {
    // Handle malformed input gracefully
    const safeResumeText = typeof resumeText === 'string' ? resumeText : '';
    const resumeLower = safeResumeText.toLowerCase();

    // Score questions based on keyword matches
    const scoredQuestions = questionBank.map((question) => {
      const keywordMatches = question.keywords.filter((keyword) =>
        resumeLower.includes(keyword.toLowerCase())
      ).length;

      return {
        question,
        score: keywordMatches,
        randomFactor: Math.random(), // Add randomness for variety
      };
    });

    // Sort by relevance score and random factor
    scoredQuestions.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      return b.randomFactor - a.randomFactor; // Random tiebreaker
    });

    // Return top questions with some randomization
    const selectedQuestions = scoredQuestions
      .slice(0, count)
      .map((item) => item.question);

    // Shuffle the selected questions for variety
    return this.shuffleArray(selectedQuestions);
  }

  private createQuestion(
    template: QuestionTemplate,
    difficulty: QuestionDifficulty
  ): Question {
    return {
      id: this.generateQuestionId(),
      text: template.text,
      difficulty,
      timeLimit: this.TIME_LIMITS[difficulty],
      category: template.category,
      order: 0, // Will be set by caller
      createdAt: new Date(),
    };
  }

  private generateQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getFallbackQuestions(): Question[] {
    console.log('🔄 Using fallback questions...');

    // Return a basic set of questions if generation fails
    return [
      {
        id: 'fallback_1',
        text: 'What is React and why would you use it for building user interfaces?',
        difficulty: 'easy' as QuestionDifficulty,
        timeLimit: 20,
        category: 'React Basics',
        order: 1,
        createdAt: new Date(),
      },
      {
        id: 'fallback_2',
        text: 'Explain the difference between frontend and backend development.',
        difficulty: 'easy' as QuestionDifficulty,
        timeLimit: 20,
        category: 'Web Development',
        order: 2,
        createdAt: new Date(),
      },
      {
        id: 'fallback_3',
        text: 'How do you manage state in a React application?',
        difficulty: 'medium' as QuestionDifficulty,
        timeLimit: 60,
        category: 'React State',
        order: 3,
        createdAt: new Date(),
      },
      {
        id: 'fallback_4',
        text: 'What is Express.js and how do you create a basic API with it?',
        difficulty: 'medium' as QuestionDifficulty,
        timeLimit: 60,
        category: 'Node.js/Express',
        order: 4,
        createdAt: new Date(),
      },
      {
        id: 'fallback_5',
        text: 'Design a full-stack application architecture for a todo list app. Include database design, API endpoints, and frontend components.',
        difficulty: 'hard' as QuestionDifficulty,
        timeLimit: 120,
        category: 'System Design',
        order: 5,
        createdAt: new Date(),
      },
      {
        id: 'fallback_6',
        text: 'How would you optimize the performance of a React application that handles large datasets?',
        difficulty: 'hard' as QuestionDifficulty,
        timeLimit: 120,
        category: 'Performance Optimization',
        order: 6,
        createdAt: new Date(),
      },
    ];
  }

  // Utility method for testing and debugging
  getQuestionStats(): {
    easy: number;
    medium: number;
    hard: number;
    total: number;
  } {
    return {
      easy: this.easyQuestions.length,
      medium: this.mediumQuestions.length,
      hard: this.hardQuestions.length,
      total:
        this.easyQuestions.length +
        this.mediumQuestions.length +
        this.hardQuestions.length,
    };
  }
}
