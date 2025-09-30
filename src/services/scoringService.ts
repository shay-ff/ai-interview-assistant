import type { Answer, Question } from '../types/interview';
import type { Candidate } from '../types/candidate';

export class ScoringService {
  private readonly DIFFICULTY_WEIGHTS = {
    easy: 1,
    medium: 1.5,
    hard: 2,
  };

  private readonly MAX_TIMING_BONUS = 0.2; // 20% bonus for quick answers

  calculateScore(answers: Answer[], questions: Question[]): number {
    if (answers.length === 0 || questions.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let totalWeight = 0;

    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        const answerScore = this.evaluateAnswer(answer, question);
        const weight = this.DIFFICULTY_WEIGHTS[question.difficulty];
        totalScore += answerScore * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
  }

  generateSummary(candidate: Candidate, answers: Answer[]): string {
    if (answers.length === 0) {
      return 'No answers provided during the interview.';
    }

    const score = candidate.score;
    let performance = '';
    
    if (score >= 90) {
      performance = 'Excellent';
    } else if (score >= 80) {
      performance = 'Very Good';
    } else if (score >= 70) {
      performance = 'Good';
    } else if (score >= 60) {
      performance = 'Fair';
    } else {
      performance = 'Needs Improvement';
    }

    const avgAnswerLength = answers.reduce((sum, answer) => sum + answer.text.length, 0) / answers.length;
    const avgTimeSpent = answers.reduce((sum, answer) => sum + answer.timeSpent, 0) / answers.length;

    let summary = `${performance} performance with a score of ${score}%. `;
    
    if (avgAnswerLength > 200) {
      summary += 'Provided detailed and comprehensive answers. ';
    } else if (avgAnswerLength > 100) {
      summary += 'Gave adequate explanations. ';
    } else {
      summary += 'Answers were brief but to the point. ';
    }

    if (avgTimeSpent < 30) {
      summary += 'Responded quickly to questions. ';
    } else if (avgTimeSpent < 60) {
      summary += 'Took reasonable time to think through answers. ';
    } else {
      summary += 'Took time to carefully consider responses. ';
    }

    // Add specific insights based on answer quality
    const shortAnswers = answers.filter(a => a.text.length < 50).length;
    const longAnswers = answers.filter(a => a.text.length > 300).length;

    if (shortAnswers > answers.length / 2) {
      summary += 'Consider providing more detailed explanations in future interviews. ';
    }

    if (longAnswers > 0) {
      summary += 'Demonstrated thorough understanding of complex topics. ';
    }

    return summary.trim();
  }

  private evaluateAnswer(answer: Answer, question: Question): number {
    let baseScore = this.evaluateAnswerContent(answer.text);
    const timingBonus = this.calculateTimingBonus(answer.timeSpent, question.timeLimit);
    
    return Math.min(100, baseScore + timingBonus);
  }

  private evaluateAnswerContent(answerText: string): number {
    if (!answerText || answerText.trim().length === 0) {
      return 0;
    }

    const text = answerText.toLowerCase().trim();
    let score = 30; // Base score for providing an answer

    // Length-based scoring
    if (text.length > 200) {
      score += 20; // Detailed answer
    } else if (text.length > 100) {
      score += 15; // Adequate answer
    } else if (text.length > 50) {
      score += 10; // Brief answer
    }

    // Technical keywords (basic scoring)
    const technicalKeywords = [
      'function', 'variable', 'array', 'object', 'class', 'method',
      'api', 'database', 'server', 'client', 'framework', 'library',
      'react', 'node', 'javascript', 'typescript', 'html', 'css',
      'async', 'await', 'promise', 'callback', 'event', 'component'
    ];

    const keywordCount = technicalKeywords.filter(keyword => 
      text.includes(keyword)
    ).length;

    score += Math.min(20, keywordCount * 2); // Up to 20 points for technical terms

    // Structure indicators
    if (text.includes('first') || text.includes('second') || text.includes('then')) {
      score += 5; // Structured answer
    }

    if (text.includes('example') || text.includes('for instance')) {
      score += 5; // Provides examples
    }

    if (text.includes('because') || text.includes('since') || text.includes('due to')) {
      score += 5; // Provides reasoning
    }

    return Math.min(100, score);
  }

  private calculateTimingBonus(timeSpent: number, timeLimit: number): number {
    if (timeSpent >= timeLimit) {
      return 0; // No bonus for using full time
    }

    // Calculate percentage of time saved
    const timeSaved = (timeLimit - timeSpent) / timeLimit;
    
    // Bonus is proportional to time saved, up to MAX_TIMING_BONUS
    const bonus = timeSaved * this.MAX_TIMING_BONUS * 100;
    
    return Math.min(this.MAX_TIMING_BONUS * 100, bonus);
  }

  // Utility method for getting score breakdown
  getScoreBreakdown(answers: Answer[], questions: Question[]): {
    totalScore: number;
    answerScores: Array<{
      questionId: string;
      baseScore: number;
      timingBonus: number;
      finalScore: number;
      weight: number;
    }>;
  } {
    const answerScores = answers.map(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) {
        return {
          questionId: answer.questionId,
          baseScore: 0,
          timingBonus: 0,
          finalScore: 0,
          weight: 1,
        };
      }

      const baseScore = this.evaluateAnswerContent(answer.text);
      const timingBonus = this.calculateTimingBonus(answer.timeSpent, question.timeLimit);
      const finalScore = Math.min(100, baseScore + timingBonus);
      const weight = this.DIFFICULTY_WEIGHTS[question.difficulty];

      return {
        questionId: answer.questionId,
        baseScore,
        timingBonus,
        finalScore,
        weight,
      };
    });

    const totalScore = this.calculateScore(answers, questions);

    return {
      totalScore,
      answerScores,
    };
  }
}