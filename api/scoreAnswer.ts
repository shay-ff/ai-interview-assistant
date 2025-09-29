// API endpoint for scoring interview answers
// This would typically be a serverless function (Vercel/Netlify) or backend route

import type { Answer } from '../src/types/interview';
import type { QuestionDifficulty } from '../src/types/common';

interface ScoreAnswerRequest {
  questionId: string;
  questionText: string;
  answer: string;
  timeSpent: number;
  timeLimit: number;
  difficulty: QuestionDifficulty;
  candidateId: string;
}

interface ScoreAnswerResponse {
  questionId: string;
  score: number; // 0-100
  feedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number; // 0-1, AI confidence in scoring
  timeEfficiency: number; // 0-100, how well time was used
  rubric: {
    content: number; // 0-100
    clarity: number; // 0-100
    depth: number; // 0-100
    relevance: number; // 0-100
  };
}

// Mock implementation - replace with actual AI service call
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      questionId, 
      questionText, 
      answer, 
      timeSpent, 
      timeLimit, 
      difficulty,
      candidateId 
    }: ScoreAnswerRequest = req.body;

    if (!questionId || !questionText || !answer || !candidateId) {
      return res.status(400).json({ 
        error: 'Missing required fields: questionId, questionText, answer, candidateId' 
      });
    }

    // Mock scoring logic - replace with actual AI scoring
    const baseScore = calculateMockScore(answer, difficulty);
    const timeEfficiency = calculateTimeEfficiency(timeSpent, timeLimit);
    const adjustedScore = Math.min(100, baseScore + (timeEfficiency > 75 ? 5 : 0));

    const response: ScoreAnswerResponse = {
      questionId,
      score: adjustedScore,
      feedback: generateMockFeedback(answer, difficulty, adjustedScore),
      strengths: generateStrengths(answer, difficulty),
      improvements: generateImprovements(answer, difficulty, adjustedScore),
      confidence: 0.85, // High confidence in mock scoring
      timeEfficiency,
      rubric: {
        content: baseScore,
        clarity: Math.min(100, baseScore + Math.random() * 10 - 5),
        depth: calculateDepthScore(answer, difficulty),
        relevance: calculateRelevanceScore(answer, questionText)
      }
    };

    // In a real implementation, you might:
    // 1. Call OpenAI/Claude API to analyze the answer
    // 2. Use NLP techniques for sentiment/content analysis
    // 3. Store scoring results in database
    // 4. Apply machine learning models for consistent scoring
    // 5. Compare against benchmarks/reference answers

    res.status(200).json(response);

  } catch (error) {
    console.error('Error scoring answer:', error);
    res.status(500).json({ 
      error: 'Failed to score answer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Mock scoring functions - replace with actual AI logic
function calculateMockScore(answer: string, difficulty: QuestionDifficulty): number {
  const wordCount = answer.trim().split(/\s+/).length;
  const hasKeywords = /\b(experience|project|challenge|solution|approach|design|implement|develop)\b/i.test(answer);
  
  let baseScore = 0;
  
  // Length-based scoring
  if (wordCount < 10) baseScore = 30;
  else if (wordCount < 20) baseScore = 50;
  else if (wordCount < 40) baseScore = 70;
  else baseScore = 85;
  
  // Keyword bonus
  if (hasKeywords) baseScore += 10;
  
  // Difficulty adjustment
  switch (difficulty) {
    case 'easy':
      return Math.min(100, baseScore);
    case 'medium':
      return Math.min(100, baseScore - 5);
    case 'hard':
      return Math.min(100, baseScore - 10);
    default:
      return baseScore;
  }
}

function calculateTimeEfficiency(timeSpent: number, timeLimit: number): number {
  const ratio = timeSpent / timeLimit;
  if (ratio <= 0.5) return 60; // Too fast, might lack depth
  if (ratio <= 0.8) return 100; // Optimal timing
  if (ratio <= 1.0) return 85; // Used almost all time
  return 70; // Overtime
}

function calculateDepthScore(answer: string, difficulty: QuestionDifficulty): number {
  const sentences = answer.split(/[.!?]+/).length;
  const hasExamples = /\b(example|instance|case|situation|project)\b/i.test(answer);
  
  let depthScore = Math.min(100, sentences * 15);
  if (hasExamples) depthScore += 15;
  
  return Math.min(100, depthScore);
}

function calculateRelevanceScore(answer: string, questionText: string): number {
  // Simple keyword overlap scoring
  const answerWords = answer.toLowerCase().split(/\s+/);
  const questionWords = questionText.toLowerCase().split(/\s+/);
  const commonWords = answerWords.filter(word => 
    questionWords.includes(word) && word.length > 3
  );
  
  return Math.min(100, (commonWords.length / Math.max(questionWords.length * 0.3, 1)) * 100);
}

function generateMockFeedback(answer: string, difficulty: QuestionDifficulty, score: number): string {
  if (score >= 85) {
    return "Excellent response! Your answer demonstrates strong understanding and provides clear, relevant examples. Well structured and comprehensive.";
  } else if (score >= 70) {
    return "Good response with solid understanding. Consider adding more specific examples or details to strengthen your answer.";
  } else if (score >= 50) {
    return "Adequate response but could benefit from more depth and specific examples. Try to elaborate on your experience and provide concrete details.";
  } else {
    return "Your response needs more development. Consider providing specific examples, explaining your reasoning, and demonstrating deeper understanding of the topic.";
  }
}

function generateStrengths(answer: string, difficulty: QuestionDifficulty): string[] {
  const strengths = [];
  
  if (answer.length > 100) strengths.push("Comprehensive response");
  if (/\b(example|project|experience)\b/i.test(answer)) strengths.push("Provided relevant examples");
  if (/\b(solution|approach|method)\b/i.test(answer)) strengths.push("Demonstrated problem-solving thinking");
  if (difficulty === 'hard' && answer.length > 150) strengths.push("Tackled complex question with detail");
  
  return strengths.length > 0 ? strengths : ["Attempted to answer the question"];
}

function generateImprovements(answer: string, difficulty: QuestionDifficulty, score: number): string[] {
  const improvements = [];
  
  if (answer.length < 50) improvements.push("Provide more detailed responses");
  if (!/\b(example|project|experience)\b/i.test(answer)) improvements.push("Include specific examples from your experience");
  if (score < 70) improvements.push("Focus on directly answering the question asked");
  if (difficulty === 'hard' && answer.length < 100) improvements.push("Elaborate more on complex technical concepts");
  
  return improvements.length > 0 ? improvements : ["Continue practicing interview responses"];
}