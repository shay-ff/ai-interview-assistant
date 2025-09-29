// Batch evaluation endpoint for optimized Groq API usage
export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    const { resumeText, qapairs, totalQuestions } = req.body;

    // Validate required fields
    if (!resumeText || !qapairs || !Array.isArray(qapairs)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'resumeText and qapairs array are required'
      });
    }

    // Single Groq API call for batch evaluation
    const evaluationPrompt = `
As an AI interview evaluator, analyze this complete interview session and provide comprehensive feedback.

CANDIDATE RESUME:
${resumeText}

INTERVIEW Q&A SESSION:
${qapairs.map((qa: any, index: number) => `
Question ${index + 1} (${qa.difficulty}):
${qa.question}

Candidate Answer:
${qa.answer || 'No answer provided'}

Time Spent: ${qa.timeSpent}s
`).join('\n')}

EVALUATION REQUIREMENTS:
1. Score each answer individually (0-100)
2. Provide specific feedback for each answer
3. Calculate overall interview score
4. Identify key strengths and improvement areas
5. Give actionable recommendations

FORMAT YOUR RESPONSE AS JSON:
{
  "overallScore": 75,
  "summary": "Brief overall assessment",
  "detailedEvaluation": [
    {
      "questionId": "q_id",
      "score": 80,
      "feedback": "Detailed feedback",
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    }
  ],
  "recommendations": ["recommendation1", "recommendation2"]
}
`;

    // Simulated Groq API response (replace with actual Groq integration)
    const simulatedResponse = {
      overallScore: calculateOverallScore(qapairs),
      summary: generateSummary(qapairs, resumeText),
      detailedEvaluation: qapairs.map((qa: any) => ({
        questionId: qa.questionId,
        score: evaluateAnswer(qa),
        feedback: generateFeedback(qa),
        strengths: identifyStrengths(qa),
        improvements: identifyImprovements(qa),
      })),
      recommendations: generateRecommendations(qapairs, resumeText),
    };

    console.log('Batch evaluation completed:', {
      totalQuestions,
      answeredQuestions: qapairs.filter((qa: any) => qa.answer?.trim()).length,
      overallScore: simulatedResponse.overallScore
    });

    return res.status(200).json(simulatedResponse);

  } catch (error) {
    console.error('Batch evaluation error:', error);
    return res.status(500).json({
      error: 'Evaluation failed',
      message: 'Failed to process interview evaluation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper functions for evaluation logic
function calculateOverallScore(qapairs: any[]): number {
  const scores = qapairs.map(qa => evaluateAnswer(qa));
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function evaluateAnswer(qa: any): number {
  const answer = qa.answer?.trim() || '';
  if (!answer) return 0;
  
  // Basic scoring logic
  let score = 40; // Base score for attempting
  
  // Length bonus
  if (answer.length > 20) score += 20;
  if (answer.length > 100) score += 20;
  
  // Difficulty modifier
  if (qa.difficulty === 'easy') score = Math.min(score + 10, 100);
  if (qa.difficulty === 'hard') score = Math.max(score - 10, 0);
  
  // Time efficiency bonus
  const expectedTime = getDifficultyTime(qa.difficulty);
  if (qa.timeSpent <= expectedTime * 0.8) score += 10;
  
  return Math.min(score, 100);
}

function generateFeedback(qa: any): string {
  const answer = qa.answer?.trim() || '';
  if (!answer) return 'No answer provided. Consider reviewing this topic area.';
  
  return `Good attempt at answering this ${qa.difficulty} question. ${answer.length > 50 ? 'Detailed response shows understanding.' : 'Consider providing more detail in your explanations.'}`;
}

function identifyStrengths(qa: any): string[] {
  const strengths = [];
  const answer = qa.answer?.trim() || '';
  
  if (answer.length > 100) strengths.push('Detailed explanations');
  if (qa.timeSpent <= getDifficultyTime(qa.difficulty)) strengths.push('Good time management');
  if (answer) strengths.push('Attempted all questions');
  
  return strengths;
}

function identifyImprovements(qa: any): string[] {
  const improvements = [];
  const answer = qa.answer?.trim() || '';
  
  if (!answer) improvements.push('Provide answers to all questions');
  if (answer.length < 20) improvements.push('Give more detailed explanations');
  if (qa.timeSpent > getDifficultyTime(qa.difficulty) * 1.2) improvements.push('Work on time management');
  
  return improvements;
}

function generateSummary(qapairs: any[], resumeText: string): string {
  const answeredCount = qapairs.filter(qa => qa.answer?.trim()).length;
  const totalCount = qapairs.length;
  
  return `Candidate answered ${answeredCount}/${totalCount} questions. ${answeredCount === totalCount ? 'Shows good preparation and engagement.' : 'Consider preparing more thoroughly for technical questions.'}`;
}

function generateRecommendations(qapairs: any[], resumeText: string): string[] {
  const recommendations = [];
  const unansweredCount = qapairs.filter(qa => !qa.answer?.trim()).length;
  
  if (unansweredCount > 0) {
    recommendations.push('Practice answering technical questions within time limits');
  }
  
  recommendations.push('Continue building practical experience in relevant technologies');
  recommendations.push('Practice explaining technical concepts clearly and concisely');
  
  return recommendations;
}

function getDifficultyTime(difficulty: string): number {
  switch (difficulty) {
    case 'easy': return 20;
    case 'medium': return 60;
    case 'hard': return 120;
    default: return 60;
  }
}