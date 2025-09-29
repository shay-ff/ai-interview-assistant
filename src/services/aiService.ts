import type { Question, QuestionGenerationResult } from '../types/interview';
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

  // Full Stack React/Node question banks
  private readonly easyQuestions: QuestionTemplate[] = [
    {
      text: 'What is the difference between let, const, and var in JavaScript?',
      category: 'JavaScript Fundamentals',
      keywords: ['javascript', 'js', 'frontend', 'web'],
    },
    {
      text: 'Explain what JSX is and how it differs from regular HTML.',
      category: 'React Basics',
      keywords: ['react', 'jsx', 'frontend', 'component'],
    },
    {
      text: 'What is the purpose of package.json in a Node.js project?',
      category: 'Node.js Basics',
      keywords: ['node', 'nodejs', 'backend', 'npm'],
    },
    {
      text: 'How do you handle events in React components?',
      category: 'React Events',
      keywords: ['react', 'events', 'onclick', 'frontend'],
    },
    {
      text: 'What is the difference between == and === in JavaScript?',
      category: 'JavaScript Fundamentals',
      keywords: ['javascript', 'comparison', 'equality'],
    },
    {
      text: 'Explain what props are in React and how to use them.',
      category: 'React Props',
      keywords: ['react', 'props', 'component', 'data'],
    },
    {
      text: 'What is npm and how do you install packages with it?',
      category: 'Package Management',
      keywords: ['npm', 'node', 'packages', 'install'],
    },
    {
      text: 'How do you create a basic HTTP server in Node.js?',
      category: 'Node.js HTTP',
      keywords: ['node', 'http', 'server', 'backend'],
    },
  ];

  private readonly mediumQuestions: QuestionTemplate[] = [
    {
      text: 'Explain the concept of state in React and how to manage it using useState hook.',
      category: 'React State Management',
      keywords: ['react', 'state', 'usestate', 'hooks'],
    },
    {
      text: 'What is middleware in Express.js and how do you implement custom middleware?',
      category: 'Express Middleware',
      keywords: ['express', 'middleware', 'node', 'backend'],
    },
    {
      text: 'Describe the React component lifecycle and the useEffect hook.',
      category: 'React Lifecycle',
      keywords: ['react', 'lifecycle', 'useeffect', 'hooks'],
    },
    {
      text: 'How do you handle asynchronous operations in JavaScript? Explain promises and async/await.',
      category: 'Async JavaScript',
      keywords: ['async', 'await', 'promises', 'javascript'],
    },
    {
      text: 'What is the difference between SQL and NoSQL databases? When would you use each?',
      category: 'Database Design',
      keywords: ['database', 'sql', 'nosql', 'mongodb', 'mysql'],
    },
    {
      text: 'Explain how to implement authentication in a Node.js application using JWT.',
      category: 'Authentication',
      keywords: ['jwt', 'auth', 'token', 'security', 'node'],
    },
    {
      text: "What is Redux and when would you use it over React's built-in state management?",
      category: 'State Management',
      keywords: ['redux', 'state', 'management', 'react'],
    },
    {
      text: 'How do you handle CORS issues in a Node.js/Express application?',
      category: 'CORS & Security',
      keywords: ['cors', 'express', 'security', 'headers'],
    },
  ];

  private readonly hardQuestions: QuestionTemplate[] = [
    {
      text: 'Design a scalable architecture for a real-time chat application using React and Node.js. Consider WebSockets, database design, and performance optimization.',
      category: 'System Design',
      keywords: [
        'architecture',
        'scalable',
        'websocket',
        'realtime',
        'performance',
      ],
    },
    {
      text: 'Explain how you would implement server-side rendering (SSR) with React and discuss the trade-offs compared to client-side rendering.',
      category: 'SSR & Performance',
      keywords: ['ssr', 'server-side', 'rendering', 'performance', 'seo'],
    },
    {
      text: 'How would you optimize a React application for performance? Discuss code splitting, lazy loading, and memoization strategies.',
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
      text: 'Design a RESTful API for an e-commerce platform. Include authentication, data validation, error handling, and rate limiting.',
      category: 'API Design',
      keywords: ['api', 'rest', 'ecommerce', 'validation', 'rate-limiting'],
    },
    {
      text: 'Explain how you would implement a microservices architecture using Node.js. Discuss service communication, data consistency, and deployment strategies.',
      category: 'Microservices',
      keywords: [
        'microservices',
        'architecture',
        'communication',
        'deployment',
      ],
    },
    {
      text: 'How would you handle database transactions and ensure data consistency in a Node.js application with multiple concurrent users?',
      category: 'Database Transactions',
      keywords: ['transactions', 'consistency', 'concurrent', 'database'],
    },
    {
      text: 'Implement a custom React hook for managing complex form state with validation. Explain your design decisions.',
      category: 'Advanced React',
      keywords: ['hooks', 'custom', 'form', 'validation', 'state'],
    },
    {
      text: 'Design a caching strategy for a high-traffic Node.js application. Consider Redis, CDN, and application-level caching.',
      category: 'Caching & Performance',
      keywords: ['caching', 'redis', 'cdn', 'performance', 'scalability'],
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
