// API endpoint for finalizing interview and generating comprehensive summary
// This would typically be a serverless function (Vercel/Netlify) or backend route

import type { Answer } from '../src/types/interview';
import type { QuestionDifficulty } from '../src/types/common';

interface FinalizeInterviewRequest {
  candidateId: string;
  sessionId: string;
  answers: Array<{
    questionId: string;
    questionText: string;
    answer: string;
    timeSpent: number;
    timeLimit: number;
    difficulty: QuestionDifficulty;
    score?: number;
  }>;
  resumeText: string;
  candidateName: string;
}

interface FinalizeInterviewResponse {
  sessionId: string;
  candidateId: string;
  overallScore: number; // 0-100
  performanceLevel: 'excellent' | 'good' | 'average' | 'needs-improvement';
  summary: string;
  detailedAnalysis: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    skillAssessment: {
      technical: number;
      communication: number;
      problemSolving: number;
      experience: number;
    };
    performanceByDifficulty: {
      easy: { score: number; count: number };
      medium: { score: number; count: number };
      hard: { score: number; count: number };
    };
    timeManagement: {
      averageTimeUsed: number; // percentage
      timeEfficiency: number; // 0-100
    };
  };
  finalizedAt: string;
  nextSteps: string[];
}

// Mock implementation - replace with actual AI service call
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      candidateId, 
      sessionId, 
      answers, 
      resumeText, 
      candidateName 
    }: FinalizeInterviewRequest = req.body;

    if (!candidateId || !sessionId || !answers || answers.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: candidateId, sessionId, answers' 
      });
    }

    // Calculate overall performance metrics
    const overallScore = calculateOverallScore(answers);
    const performanceLevel = getPerformanceLevel(overallScore);
    const detailedAnalysis = generateDetailedAnalysis(answers);
    const summary = generateInterviewSummary(candidateName, overallScore, detailedAnalysis);
    const nextSteps = generateNextSteps(performanceLevel, detailedAnalysis);

    const response: FinalizeInterviewResponse = {
      sessionId,
      candidateId,
      overallScore,
      performanceLevel,
      summary,
      detailedAnalysis,
      finalizedAt: new Date().toISOString(),
      nextSteps
    };

    // In a real implementation, you might:
    // 1. Store final results in database
    // 2. Generate PDF report
    // 3. Send email notifications
    // 4. Update candidate status in ATS
    // 5. Trigger follow-up workflows
    // 6. Generate comparative analytics

    res.status(200).json(response);

  } catch (error) {
    console.error('Error finalizing interview:', error);
    res.status(500).json({ 
      error: 'Failed to finalize interview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function calculateOverallScore(answers: FinalizeInterviewRequest['answers']): number {
  if (answers.length === 0) return 0;
  
  const totalScore = answers.reduce((sum, answer) => {
    return sum + (answer.score || 0);
  }, 0);
  
  return Math.round(totalScore / answers.length);
}

function getPerformanceLevel(score: number): FinalizeInterviewResponse['performanceLevel'] {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  return 'needs-improvement';
}

function generateDetailedAnalysis(answers: FinalizeInterviewRequest['answers']) {
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];
  
  // Analyze performance by difficulty
  const performanceByDifficulty = {
    easy: { score: 0, count: 0 },
    medium: { score: 0, count: 0 },
    hard: { score: 0, count: 0 }
  };
  
  let totalTimeUsed = 0;
  let totalTimeLimit = 0;
  
  answers.forEach(answer => {
    const difficulty = answer.difficulty;
    const score = answer.score || 0;
    
    performanceByDifficulty[difficulty].score += score;
    performanceByDifficulty[difficulty].count += 1;
    
    totalTimeUsed += answer.timeSpent;
    totalTimeLimit += answer.timeLimit;
    
    // Generate insights based on performance
    if (score >= 80) {
      if (difficulty === 'hard') {
        strengths.push(`Excellent performance on complex ${difficulty} question`);
      }
    } else if (score < 50) {
      if (difficulty === 'easy') {
        weaknesses.push(`Struggled with basic ${difficulty} question`);
      }
    }
  });
  
  // Calculate averages
  Object.keys(performanceByDifficulty).forEach(key => {
    const diff = performanceByDifficulty[key as keyof typeof performanceByDifficulty];
    if (diff.count > 0) {
      diff.score = Math.round(diff.score / diff.count);
    }
  });
  
  const averageTimeUsed = totalTimeLimit > 0 ? (totalTimeUsed / totalTimeLimit) * 100 : 0;
  const timeEfficiency = calculateTimeEfficiency(averageTimeUsed);
  
  // Generate general strengths and weaknesses
  if (performanceByDifficulty.hard.score > 70) {
    strengths.push("Strong problem-solving abilities");
  }
  if (performanceByDifficulty.easy.score > 80) {
    strengths.push("Clear communication of basic concepts");
  }
  if (timeEfficiency > 80) {
    strengths.push("Excellent time management");
  }
  
  if (performanceByDifficulty.medium.score < 60) {
    weaknesses.push("Needs improvement on intermediate-level questions");
    recommendations.push("Practice more medium-complexity problems");
  }
  if (averageTimeUsed < 50) {
    weaknesses.push("May be rushing through responses");
    recommendations.push("Take more time to provide detailed answers");
  }
  if (averageTimeUsed > 95) {
    weaknesses.push("Time management could be improved");
    recommendations.push("Practice answering questions more concisely");
  }
  
  return {
    strengths: strengths.length > 0 ? strengths : ["Completed the interview"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["None identified"],
    recommendations: recommendations.length > 0 ? recommendations : ["Continue practicing"],
    skillAssessment: {
      technical: performanceByDifficulty.hard.score || 50,
      communication: Math.min(100, (performanceByDifficulty.easy.score || 50) + 10),
      problemSolving: performanceByDifficulty.medium.score || 50,
      experience: calculateOverallScore(answers)
    },
    performanceByDifficulty,
    timeManagement: {
      averageTimeUsed: Math.round(averageTimeUsed),
      timeEfficiency: Math.round(timeEfficiency)
    }
  };
}

function calculateTimeEfficiency(averageTimeUsed: number): number {
  // Optimal time usage is around 70-90%
  if (averageTimeUsed >= 70 && averageTimeUsed <= 90) return 100;
  if (averageTimeUsed >= 60 && averageTimeUsed < 70) return 85;
  if (averageTimeUsed >= 50 && averageTimeUsed < 60) return 70;
  if (averageTimeUsed >= 90 && averageTimeUsed <= 100) return 85;
  return Math.max(30, 100 - Math.abs(averageTimeUsed - 80));
}

function generateInterviewSummary(
  candidateName: string, 
  overallScore: number, 
  analysis: any
): string {
  const level = getPerformanceLevel(overallScore);
  const timeEfficiency = analysis.timeManagement.timeEfficiency;
  
  let summary = `${candidateName} completed the technical interview with an overall score of ${overallScore}/100, `;
  
  switch (level) {
    case 'excellent':
      summary += "demonstrating excellent technical skills and communication abilities. ";
      break;
    case 'good':
      summary += "showing good technical understanding with solid communication skills. ";
      break;
    case 'average':
      summary += "displaying average performance with room for improvement. ";
      break;
    case 'needs-improvement':
      summary += "showing areas that need significant improvement before proceeding. ";
      break;
  }
  
  summary += `Time management was ${timeEfficiency > 80 ? 'excellent' : timeEfficiency > 60 ? 'good' : 'needs improvement'}. `;
  
  if (analysis.strengths.length > 0) {
    summary += `Key strengths include: ${analysis.strengths.slice(0, 2).join(' and ')}. `;
  }
  
  if (analysis.weaknesses.length > 0 && level !== 'excellent') {
    summary += `Areas for development: ${analysis.weaknesses.slice(0, 2).join(' and ')}.`;
  }
  
  return summary;
}

function generateNextSteps(
  performanceLevel: FinalizeInterviewResponse['performanceLevel'],
  analysis: any
): string[] {
  const nextSteps = [];
  
  switch (performanceLevel) {
    case 'excellent':
      nextSteps.push("Proceed to final round interviews");
      nextSteps.push("Schedule team introductions");
      nextSteps.push("Prepare offer discussion");
      break;
    case 'good':
      nextSteps.push("Consider for next interview round");
      nextSteps.push("Review with hiring manager");
      nextSteps.push("Conduct reference checks");
      break;
    case 'average':
      nextSteps.push("Additional technical assessment recommended");
      nextSteps.push("Consider pairing session or code review");
      nextSteps.push("Gather more feedback from team");
      break;
    case 'needs-improvement':
      nextSteps.push("Provide constructive feedback to candidate");
      nextSteps.push("Suggest areas for skill development");
      nextSteps.push("Consider junior role or mentorship program");
      break;
  }
  
  if (analysis.timeManagement.timeEfficiency < 60) {
    nextSteps.push("Recommend practicing interview timing");
  }
  
  return nextSteps;
}