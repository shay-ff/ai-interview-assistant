import type { Question, QuestionGenerationResult } from '../types/interview';
import type { QuestionDifficulty } from '../types/common';
import type { ContactInfo } from '../types/candidate';

interface SkillMatch {
  skill: string;
  confidence: number;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'general';
}

export class LocalAIService {
  private readonly SKILL_PATTERNS = {
    frontend: [
      'react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'sass', 'less',
      'jsx', 'tsx', 'webpack', 'vite', 'babel', 'redux', 'mobx', 'tailwind', 'bootstrap'
    ],
    backend: [
      'node', 'express', 'fastify', 'nest', 'python', 'django', 'flask', 'java', 'spring',
      'php', 'laravel', 'ruby', 'rails', 'go', 'rust', 'c#', '.net', 'asp.net'
    ],
    database: [
      'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server',
      'dynamodb', 'firebase', 'supabase', 'prisma', 'typeorm', 'mongoose'
    ],
    devops: [
      'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'github actions',
      'gitlab ci', 'terraform', 'ansible', 'nginx', 'apache', 'linux'
    ],
    general: [
      'git', 'agile', 'scrum', 'testing', 'jest', 'cypress', 'api', 'rest', 'graphql',
      'microservices', 'clean code', 'solid', 'design patterns'
    ]
  };

  private readonly EXPERIENCE_INDICATORS = {
    junior: ['intern', 'trainee', 'fresher', 'graduate', 'entry level', '0-2 years', 'beginner'],
    mid: ['developer', 'engineer', '2-5 years', '3-6 years', 'mid level', 'intermediate'],
    senior: ['senior', 'lead', 'architect', 'principal', '5+ years', '7+ years', 'expert', 'team lead']
  };

  /**
   * Generate personalized questions based on resume content
   */
  async generatePersonalizedQuestions(
    resumeText: string, 
    contactInfo: ContactInfo
  ): Promise<QuestionGenerationResult> {
    const skills = this.extractSkills(resumeText);
    const experienceLevel = this.determineExperienceLevel(resumeText);
    const questions = this.selectQuestionsForProfile(skills, experienceLevel);
    
    return {
      questions,
      totalGenerated: questions.length,
      summary: this.generateCandidateSummary(skills, experienceLevel, contactInfo),
      confidence: this.calculateConfidence(skills, resumeText),
      detectedSkills: skills.map(s => s.skill),
      experienceLevel
    };
  }

  /**
   * Generate resume summary
   */
  generateResumeSummary(resumeText: string, contactInfo: ContactInfo): string {
    const skills = this.extractSkills(resumeText);
    const experienceLevel = this.determineExperienceLevel(resumeText);
    
    const topSkills = skills
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(s => s.skill);

    const skillsByCategory = this.groupSkillsByCategory(skills);
    
    let summary = `${contactInfo.name || 'Candidate'} appears to be a ${experienceLevel}-level developer`;
    
    if (topSkills.length > 0) {
      summary += ` with expertise in ${topSkills.join(', ')}`;
    }

    // Add category-specific insights
    const categories = Object.keys(skillsByCategory).filter(cat => skillsByCategory[cat].length > 0);
    if (categories.length > 0) {
      summary += `. Strong background in ${categories.join(' and ')} technologies`;
    }

    // Add experience context
    const yearsMatch = resumeText.match(/(\d+)[\+\s]*years?/gi);
    if (yearsMatch) {
      const maxYears = Math.max(...yearsMatch.map(y => parseInt(y.match(/\d+/)?.[0] || '0')));
      if (maxYears > 0) {
        summary += ` with approximately ${maxYears} years of experience`;
      }
    }

    return summary + '.';
  }

  /**
   * Extract skills from resume text using pattern matching
   */
  private extractSkills(text: string): SkillMatch[] {
    const normalizedText = text.toLowerCase();
    const skills: SkillMatch[] = [];

    Object.entries(this.SKILL_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach(skill => {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = normalizedText.match(regex);
        
        if (matches) {
          const confidence = Math.min(matches.length * 0.3 + 0.4, 1.0);
          skills.push({
            skill: skill.charAt(0).toUpperCase() + skill.slice(1),
            confidence,
            category: category as any
          });
        }
      });
    });

    // Remove duplicates and sort by confidence
    return skills
      .filter((skill, index, self) => 
        index === self.findIndex(s => s.skill.toLowerCase() === skill.skill.toLowerCase())
      )
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Determine experience level from resume text
   */
  private determineExperienceLevel(text: string): 'junior' | 'mid' | 'senior' {
    const normalizedText = text.toLowerCase();
    
    let scores = { junior: 0, mid: 0, senior: 0 };

    Object.entries(this.EXPERIENCE_INDICATORS).forEach(([level, indicators]) => {
      indicators.forEach(indicator => {
        const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = normalizedText.match(regex);
        if (matches) {
          scores[level as keyof typeof scores] += matches.length;
        }
      });
    });

    // Extract years of experience
    const yearsMatch = normalizedText.match(/(\d+)[\+\s]*years?/gi);
    if (yearsMatch) {
      const maxYears = Math.max(...yearsMatch.map(y => parseInt(y.match(/\d+/)?.[0] || '0')));
      if (maxYears >= 7) scores.senior += 3;
      else if (maxYears >= 3) scores.mid += 2;
      else scores.junior += 1;
    }

    // Return level with highest score
    const maxScore = Math.max(scores.junior, scores.mid, scores.senior);
    if (scores.senior === maxScore) return 'senior';
    if (scores.mid === maxScore) return 'mid';
    return 'junior';
  }

  /**
   * Select questions based on candidate profile
   */
  private selectQuestionsForProfile(
    skills: SkillMatch[], 
    experienceLevel: 'junior' | 'mid' | 'senior'
  ): Question[] {
    const selectedQuestions: Question[] = [];
    const skillsByCategory = this.groupSkillsByCategory(skills);

    // Always include general questions
    selectedQuestions.push(...this.getGeneralQuestions(experienceLevel, 2));

    // Add skill-specific questions
    Object.entries(skillsByCategory).forEach(([category, categorySkills]) => {
      if (categorySkills.length > 0) {
        const questionsForCategory = this.getQuestionsForCategory(
          category as any, 
          experienceLevel, 
          Math.min(2, categorySkills.length)
        );
        selectedQuestions.push(...questionsForCategory);
      }
    });

    // Ensure we have 5 questions total
    while (selectedQuestions.length < 5) {
      const generalQuestions = this.getGeneralQuestions(experienceLevel, 1);
      selectedQuestions.push(...generalQuestions);
    }

    return selectedQuestions.slice(0, 5);
  }

  private groupSkillsByCategory(skills: SkillMatch[]): Record<string, SkillMatch[]> {
    return skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, SkillMatch[]>);
  }

  private getGeneralQuestions(level: 'junior' | 'mid' | 'senior', count: number): Question[] {
    const generalQuestions = {
      junior: [
        {
          id: `gen_j_${Date.now()}_1`,
          text: "Tell me about a challenging project you've worked on and how you approached it.",
          difficulty: 'easy' as QuestionDifficulty,
          timeLimit: 90,
          category: 'General Experience',
          order: 1,
          createdAt: new Date()
        },
        {
          id: `gen_j_${Date.now()}_2`,
          text: "How do you stay updated with new technologies and programming trends?",
          difficulty: 'easy' as QuestionDifficulty,
          timeLimit: 60,
          category: 'Learning & Growth',
          order: 2,
          createdAt: new Date()
        }
      ],
      mid: [
        {
          id: `gen_m_${Date.now()}_1`,
          text: "Describe a time when you had to debug a complex issue. What was your approach?",
          difficulty: 'medium' as QuestionDifficulty,
          timeLimit: 120,
          category: 'Problem Solving',
          order: 1,
          createdAt: new Date()
        },
        {
          id: `gen_m_${Date.now()}_2`,
          text: "How do you handle code reviews and ensure code quality in your team?",
          difficulty: 'medium' as QuestionDifficulty,
          timeLimit: 90,
          category: 'Team Collaboration',
          order: 2,
          createdAt: new Date()
        }
      ],
      senior: [
        {
          id: `gen_s_${Date.now()}_1`,
          text: "Describe your approach to system design and architecture decisions.",
          difficulty: 'hard' as QuestionDifficulty,
          timeLimit: 180,
          category: 'Architecture & Design',
          order: 1,
          createdAt: new Date()
        },
        {
          id: `gen_s_${Date.now()}_2`,
          text: "How do you mentor junior developers and ensure team growth?",
          difficulty: 'hard' as QuestionDifficulty,
          timeLimit: 120,
          category: 'Leadership',
          order: 2,
          createdAt: new Date()
        }
      ]
    };

    return generalQuestions[level].slice(0, count);
  }

  private getQuestionsForCategory(
    _category: 'frontend' | 'backend' | 'database' | 'devops' | 'general',
    level: 'junior' | 'mid' | 'senior',
    count: number
  ): Question[] {
    // This would contain skill-specific questions
    // For now, returning general questions but in production, 
    // you'd have category-specific question banks
    return this.getGeneralQuestions(level, count);
  }

  private generateCandidateSummary(
    _skills: SkillMatch[], 
    _experienceLevel: string, 
    contactInfo: ContactInfo
  ): string {
    return this.generateResumeSummary(contactInfo.text || '', contactInfo);
  }

  private calculateConfidence(skills: SkillMatch[], resumeText: string): number {
    if (skills.length === 0) return 0.3;
    
    const avgConfidence = skills.reduce((sum, skill) => sum + skill.confidence, 0) / skills.length;
    const textLength = resumeText.length;
    const lengthBonus = Math.min(textLength / 1000, 0.3); // Bonus for longer, detailed resumes
    
    return Math.min(avgConfidence + lengthBonus, 1.0);
  }
}

export const localAIService = new LocalAIService();