import type { Question, QuestionGenerationResult } from '../types/interview';
import type { ContactInfo } from '../types/candidate';
import { LocalAIService } from './localAIService';
import { AI_SERVICE_CONFIGS, DEFAULT_CONFIG, ENV_KEYS, type AIServiceConfig } from './aiConfig';

interface AnswerValidationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
}

/**
 * Enhanced AI Service with Groq integration and fallback
 * Prioritizes Groq for fast, high-quality responses
 */
export class EnhancedAIService {
  private localService: LocalAIService;
  private config: AIServiceConfig;

  constructor(providerName: string = 'groq') {
    this.localService = new LocalAIService();
    this.config = this.loadConfig(providerName);
    
    // Auto-fallback to local if Groq API key not available
    if (providerName === 'groq' && !this.config.apiKey) {
      console.warn('Groq API key not found, falling back to local AI');
      this.config = this.loadConfig('local');
    }
  }

  /**
   * Generate personalized questions with enhanced AI
   */
  async generateQuestions(
    resumeText: string,
    contactInfo: ContactInfo
  ): Promise<QuestionGenerationResult> {
    try {
      if (this.config.provider !== 'local') {
        console.log(`Using ${this.config.provider} for question generation`);
        return await this.tryCloudProvider(resumeText, contactInfo);
      }
    } catch (error) {
      console.warn(`${this.config.provider} AI service failed:`, error);
      
      if (!this.config.fallbackToLocal) {
        throw error;
      }
    }

    console.log('Using local AI service for question generation');
    return this.localService.generatePersonalizedQuestions(resumeText, contactInfo);
  }

  /**
   * Generate enhanced resume summary
   */
  async generateResumeSummary(
    resumeText: string,
    contactInfo: ContactInfo
  ): Promise<string> {
    try {
      if (this.config.provider !== 'local') {
        console.log(`Using ${this.config.provider} for resume summary`);
        return await this.tryCloudSummary(resumeText, contactInfo);
      }
    } catch (error) {
      console.warn(`${this.config.provider} summary service failed:`, error);
    }

    console.log('Using local AI service for resume summary');
    return this.localService.generateResumeSummary(resumeText, contactInfo);
  }

  /**
   * Validate and score candidate answer with AI
   */
  async validateAnswer(
    question: string,
    answer: string,
    timeSpent: number,
    timeLimit: number
  ): Promise<AnswerValidationResult> {
    try {
      if (this.config.provider !== 'local') {
        console.log(`Using ${this.config.provider} for answer validation`);
        return await this.tryCloudValidation(question, answer, timeSpent, timeLimit);
      }
    } catch (error) {
      console.warn(`${this.config.provider} validation failed:`, error);
    }

    console.log('Using local validation');
    return this.localValidation(question, answer, timeSpent, timeLimit);
  }

  /**
   * Check if AI service is available
   */
  async isAvailable(): Promise<boolean> {
    if (this.config.provider === 'local') {
      return true;
    }

    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AIServiceConfig {
    return { ...this.config };
  }

  /**
   * Switch to different AI provider
   */
  switchProvider(providerName: string): void {
    this.config = this.loadConfig(providerName);
  }

  // Private methods
  private loadConfig(providerName: string): AIServiceConfig {
    const config = AI_SERVICE_CONFIGS[providerName] || DEFAULT_CONFIG;
    
    // Inject API keys from environment
    if (config.provider === 'openai') {
      config.apiKey = import.meta.env[ENV_KEYS.OPENAI_API_KEY];
    } else if (config.provider === 'anthropic') {
      config.apiKey = import.meta.env[ENV_KEYS.ANTHROPIC_API_KEY];
    } else if (config.provider === 'groq') {
      config.apiKey = import.meta.env[ENV_KEYS.GROQ_API_KEY];
    }

    return config;
  }

  private async tryCloudProvider(
    resumeText: string,
    contactInfo: ContactInfo
  ): Promise<QuestionGenerationResult> {
    if (!this.config.apiKey && this.config.provider !== 'ollama') {
      throw new Error(`API key required for ${this.config.provider}`);
    }

    const prompt = this.buildQuestionPrompt(resumeText, contactInfo);
    const response = await this.callCloudAPI(prompt);
    
    return this.parseCloudResponse(response);
  }

  private async tryCloudSummary(
    resumeText: string,
    contactInfo: ContactInfo
  ): Promise<string> {
    if (!this.config.apiKey && this.config.provider !== 'ollama') {
      throw new Error(`API key required for ${this.config.provider}`);
    }

    const prompt = this.buildSummaryPrompt(resumeText, contactInfo);
    const response = await this.callCloudAPI(prompt);
    
    return response.trim();
  }

  private async tryCloudValidation(
    question: string,
    answer: string,
    timeSpent: number,
    timeLimit: number
  ): Promise<AnswerValidationResult> {
    if (!this.config.apiKey && this.config.provider !== 'ollama') {
      throw new Error(`API key required for ${this.config.provider}`);
    }

    const prompt = this.buildValidationPrompt(question, answer, timeSpent, timeLimit);
    const response = await this.callCloudAPI(prompt);
    
    return this.parseValidationResponse(response);
  }

  private localValidation(
    _question: string,
    answer: string,
    timeSpent: number,
    timeLimit: number
  ): AnswerValidationResult {
    // Simple local validation logic
    const answerLength = answer.trim().length;
    const timeRatio = timeSpent / timeLimit;
    
    let score = 50; // Base score
    
    // Length-based scoring
    if (answerLength > 200) score += 20;
    else if (answerLength > 100) score += 10;
    else if (answerLength < 20) score -= 20;
    
    // Time-based scoring
    if (timeRatio < 0.5) score += 10; // Answered quickly
    else if (timeRatio > 0.9) score -= 10; // Used almost all time
    
    // Basic keyword analysis
    const keywords = ['experience', 'project', 'team', 'challenge', 'solution', 'learned'];
    const foundKeywords = keywords.filter(word => 
      answer.toLowerCase().includes(word)
    );
    score += foundKeywords.length * 5;
    
    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      feedback: this.generateLocalFeedback(score, answerLength, timeRatio),
      strengths: foundKeywords.length > 2 ? ['Good use of relevant terminology', 'Detailed response'] : ['Response provided'],
      improvements: score < 70 ? ['Consider providing more specific examples', 'Elaborate on your experience'] : [],
      confidence: 0.6, // Local validation has lower confidence
    };
  }

  private generateLocalFeedback(score: number, answerLength: number, timeRatio: number): string {
    if (score >= 80) {
      return `Excellent answer! Well-structured response with ${answerLength > 200 ? 'comprehensive' : 'good'} detail. ${timeRatio < 0.8 ? 'Efficient time management.' : ''}`;
    } else if (score >= 60) {
      return `Good answer with room for improvement. ${answerLength < 100 ? 'Consider providing more detail.' : 'Good level of detail.'} ${timeRatio > 0.9 ? 'Consider working on time management.' : ''}`;
    } else {
      return `Answer needs improvement. ${answerLength < 50 ? 'More detailed explanation needed.' : ''} ${timeRatio > 0.95 ? 'Focus on concise, timely responses.' : ''}`;
    }
  }

  private buildQuestionPrompt(resumeText: string, contactInfo: ContactInfo): string {
    return `
As an expert technical interviewer, analyze this resume and generate exactly 5 personalized interview questions that are directly relevant to the candidate's experience, skills, and background.

Candidate Name: ${contactInfo.name}
Resume Content:
${resumeText}

IMPORTANT INSTRUCTIONS:
1. READ the resume carefully and identify the candidate's:
   - Technical skills and programming languages
   - Work experience and projects
   - Industry/domain expertise
   - Years of experience level
   - Education and certifications

2. Generate questions that are SPECIFIC to their background:
   - Reference their actual projects, technologies, or companies mentioned
   - Ask about specific challenges they would have faced in their roles
   - Tailor difficulty based on their experience level
   - Include behavioral questions relevant to their career progression

3. Question distribution:
   - 2 easy questions (90 seconds each) - Basic concepts in their field
   - 2 medium questions (120 seconds each) - Problem-solving in their domain
   - 1 hard question (180 seconds) - Advanced scenarios or leadership

4. Categories should reflect their expertise:
   - Technical Skills (specific to their stack)
   - Problem Solving (relevant to their domain)
   - Experience (based on their actual work history)
   - Leadership/Teamwork (if they have management experience)

Return ONLY a JSON array with this exact format:
[
  {
    "text": "Question text that references their specific experience/skills",
    "difficulty": "easy|medium|hard",
    "timeLimit": 90,
    "category": "Category name"
  }
]

No additional text or explanation. Make the questions feel like they're from someone who actually read their resume.`;
  }

  private buildSummaryPrompt(resumeText: string, contactInfo: ContactInfo): string {
    return `
Analyze this resume and create a comprehensive professional summary that will be used to generate personalized interview questions.

Candidate: ${contactInfo.name}
Resume Content:
${resumeText}

Extract and summarize:
1. Experience level (entry-level/junior/mid-level/senior/lead/executive)
2. Primary technical skills and programming languages
3. Domain expertise (web dev, mobile, AI/ML, data, DevOps, etc.)
4. Years of experience (estimate from work history)
5. Notable projects or achievements
6. Industry background
7. Education and certifications
8. Leadership or management experience

Provide a detailed summary (3-4 sentences) that captures their professional profile and would enable an interviewer to ask highly relevant, personalized questions.

Return only the summary text, no additional formatting.`;
  }

  private buildValidationPrompt(
    question: string,
    answer: string,
    timeSpent: number,
    timeLimit: number
  ): string {
    return `
Evaluate this interview answer and provide detailed feedback.

Question: ${question}
Answer: ${answer}
Time Spent: ${timeSpent}s out of ${timeLimit}s

Evaluate based on:
1. Relevance to the question
2. Technical accuracy (if applicable)
3. Clarity and structure
4. Specific examples provided
5. Time management

Return ONLY a JSON object with this exact format:
{
  "score": 85,
  "feedback": "Detailed feedback paragraph here",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "confidence": 0.9
}

Score should be 0-100. No additional text.`;
  }

  private async callCloudAPI(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      let requestBody: any;
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Configure request based on provider
      if (this.config.provider === 'openai' || this.config.provider === 'groq') {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        requestBody = {
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
        };
      } else if (this.config.provider === 'anthropic') {
        headers['x-api-key'] = this.config.apiKey!;
        headers['anthropic-version'] = '2023-06-01';
        requestBody = {
          model: this.config.model,
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        };
      } else if (this.config.provider === 'ollama') {
        requestBody = {
          model: this.config.model,
          prompt: prompt,
          stream: false,
        };
      }

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse response based on provider
      if (this.config.provider === 'anthropic') {
        return data.content[0].text;
      } else if (this.config.provider === 'ollama') {
        return data.response;
      } else {
        return data.choices[0].message.content;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseCloudResponse(response: string): QuestionGenerationResult {
    try {
      const questions = JSON.parse(response);
      
      // Convert to our Question format
      const formattedQuestions: Question[] = questions.map((q: any, index: number) => ({
        id: `ai_${Date.now()}_${index}`,
        text: q.text,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit,
        category: q.category,
        order: index + 1,
        createdAt: new Date(),
      }));

      return {
        questions: formattedQuestions,
        totalGenerated: formattedQuestions.length,
        confidence: 0.95, // High confidence for AI-generated content
        summary: `Generated ${formattedQuestions.length} personalized questions using ${this.config.provider}`,
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }

  private parseValidationResponse(response: string): AnswerValidationResult {
    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error(`Failed to parse validation response: ${error}`);
    }
  }

  private async healthCheck(): Promise<void> {
    const simplePrompt = 'Hello';
    await this.callCloudAPI(simplePrompt);
  }
}

// Export singleton instance with Groq as default
export const aiService = new EnhancedAIService('groq');

// Export class for custom instances
export { LocalAIService };