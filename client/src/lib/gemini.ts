import { QuestionWithTags, SubjectStats } from "@shared/schema";

// Default prompts
export const DEFAULT_SUBJECT_TAGGING_PROMPT = 
`Analyze this UPSC question and classify it under the most relevant subject(s) from this list: 
Polity, Economy, History, Geography, Environment, Science, International Relations.

Also add subtopic tags as appropriate based on the question content.

Return only comma-separated tags, no explanation.`;

export const DEFAULT_ANALYTICS_PROMPT = 
`You're analyzing UPSC mock test performance data. Based on the following statistics, provide 
actionable study advice targeting the weakest areas and recognizing strengths.

Focus on:
1. Connecting subject performance to meta-cognitive patterns
2. Identifying priority areas for revision
3. Suggesting specific study techniques based on the data
4. Highlighting improvement trends (if available)

Keep your response concise, practical, and focused on actionable advice. Use bullet points.`;

// Interface for Gemini API response
interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

// Function to call Gemini API for subject tagging
export async function getSubjectTags(
  questionText: string,
  options: string[],
  apiKey: string,
  model: string,
  prompt: string
): Promise<string[]> {
  try {
    const content = `${questionText}\n\n${options.join('\n')}`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { text: content }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 100,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as GeminiResponse;
    const tagsText = data.candidates[0]?.content.parts[0].text || '';
    
    // Split by commas and trim each tag
    return tagsText
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  } catch (error) {
    console.error('Error getting subject tags:', error);
    return [];
  }
}

// Function to call Gemini API for analytics insights
export async function getAnalyticsInsights(
  stats: {
    overallStats: SubjectStats;
    subjectStats: SubjectStats[];
  },
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  try {
    // Format the statistics for the model
    const formattedStats = `
OVERALL PERFORMANCE:
- Total Questions: ${stats.overallStats.attempts}
- Score: ${stats.overallStats.score.toFixed(2)}
- Accuracy: ${stats.overallStats.accuracy.toFixed(1)}%
- Confidence: High ${stats.overallStats.confidenceHigh}, Medium ${stats.overallStats.confidenceMid}, Low ${stats.overallStats.confidenceLow}
- Knowledge: Yes ${stats.overallStats.knowledgeYes}, Technique: Yes ${stats.overallStats.techniqueYes}, Guesswork: Yes ${stats.overallStats.guessworkYes}

SUBJECT PERFORMANCE:
${stats.subjectStats.map(subject => `
${subject.subject}:
- Questions: ${subject.attempts}
- Accuracy: ${subject.accuracy.toFixed(1)}%
- Score: ${subject.score.toFixed(2)}
- Avg Time: ${subject.avgTimeSeconds.toFixed(0)}s
- Confidence: High ${subject.confidenceHigh}, Medium ${subject.confidenceMid}, Low ${subject.confidenceLow}
- Knowledge: Yes ${subject.knowledgeYes}, Technique: Yes ${subject.techniqueYes}, Guesswork: Yes ${subject.guessworkYes}
`).join('')}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { text: formattedStats }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 800,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as GeminiResponse;
    return data.candidates[0]?.content.parts[0].text || 'No insights available.';
  } catch (error) {
    console.error('Error getting analytics insights:', error);
    return 'Unable to generate insights at this time. Please try again later.';
  }
}
