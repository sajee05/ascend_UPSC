
export const DEFAULT_PARSING_PROMPT_TITLE = "Analyze and format the provided UPSC question text into a structured format following the specified rules.";


import { QuestionWithTags, SubjectStats, UserAnswer } from "@shared/schema";

// Default prompts
export const DEFAULT_EXPLANATION_PROMPT = 
`Analyze this UPSC question and provide a detailed explanation of why the correct answer is right and why the other options are wrong. 

Format your response using Markdown, with clear sections:
1. **Question Analysis**: Brief explanation of what the question is asking
2. **Correct Answer**: Detailed explanation of why the correct option is right
3. **Incorrect Options**: For each wrong option, explain why it's incorrect
4. **Key Takeaways**: 2-3 bullet points summarizing the main concepts

Include factual information with precise citations where possible. If you're uncertain about any statement, mark it with a ⭐ symbol. Focus on providing accurate information that would help a UPSC aspirant understand the concept thoroughly.`;

export const DEFAULT_SUBJECT_TAGGING_PROMPT = 
`Analyze this UPSC question and classify it under the most relevant subject(s) and subtopics from the following comprehensive list:

- Economics: Economics BASICS, NATIONAL INCOME, INFLATION, RBI & MONETARY POLICY, BANKING, FINANCE, TAX, MONEY & STOCKS, TRADE, INTERNATIONAL BODIES, REPORTS, AGRICULTURE, EMPLOYMENT, MISC, BUDGET, SURVEY, SCHEMES
  
- Ancient History (A&C): IVC, VEDIC CULTURE, MAHAJANPADAS, JAINISM, BUDDHISM, MAURYA, PRE GUPTA, GUPTA, SOUTH, VARDHAN, TRIPARTITE, SCULPTURE, ARCHITECTURE, TEMPLE, PAINTING, JAINISM/BUDDHISM (Art Aspect), MUSIC, DANCE, AWARDS
  
- Medieval History (A&C): VIJAYNAGAR, SULTANATE, MUGHAL, BAHAMANI, MARATHA, EUROPEANS (Early phase, relevant to Medieval interactions/decline)
  
- Modern History: CIVIL UPRISINGS, PEASANT MOVEMENTS, TRIBAL REVOLTS, SEPOY MUTINY, 1857, SOCIO RELIGIOUS REFORMS, SOCIO CULTURAL REFORMS, MODERN NATIONALISM, INC, MODERATES, MILITANT NATIONALISM, FIRST PHASE, WWI, GANDHI, NCM, SWARAJ SWARAJIST, SIMON+, CDM, RTC, WWII, QIM, PAKISTAN, INA, POST WAR, INDEPENDENCE AND PARTITION, LEGAL, ADMIN, JUDICIAL (Developments), ECONOMIC IMPACT, PRESS, EDUCATION, ADVENT OF EUROPEANS, EXPANSION
  
- Polity: ACTS, FEATURES, P and FED SYSTEM, PREMBLE, FR, DPSP, FD, EMERGENCY, AMD, BS, CITIZENSHIP, P,VP,G,PM,COM,CC,CM,SCOM (Executives), PARL+, STATE LEG. (Legislatures), SC, HC, SUB COURT, JA, JR, PIL (Judiciary), PR, MUNI, CS, IS, U&T, UT, SA TA (Local Govt, Services, Special Areas), CONSTI, NON CONSTI, ELECTION (Bodies)
  
- Geography: EARTH, LANDFORMS, MINERALS, GEOMORPHICS, INDIA PHYSIOGRAPHY, INDIA DRAINAGE SYSTEM, CLIMATE, ATMOSPHERE, G C LEONG CLIMATE & VEGETATION, INDIA CLIMATE AND VEGETATION, OCEANOGRAPHY, HUMAN GEOG, LAND, WATER, MINERAL ENERGY ETC, MAPPING INDIA, MAPPING WORLD
  
- Environment: BASICS, FUNCTIONS, TERRESTRIAL, AQUATIC, POLLUTION, BIODIVERSITY AND CONSERVATION, CLIMATE AND CONSERVATION, AGRICULTURE, NATIONAL ACTS, POLICIES, BODIES, INTERNATIONAL ORG, CONVENTIONS, RAMSAR SITES, TIGER RESERVES, ELEPHANT RESERVES, BIOSPHERE RESERVES, NATIONAL PARKS
  
- Science and Technology: BIOLOGY, BIOTECH, HEALTH AND DISEASE, PHYSICS, CHEMISTRY, SPACE, IT, NANOTECH, DEFENCE, EMERGING TECH
  
- CSAT: NUMBER SYSTEM, PERCENTAGE, AVERAGE, RATIO & PROPORTION, PROFIT AND LOSS, SPEED DISTANCE TIME, LCM/HCF, SYLLOGISM, STATEMENTS

Return only the most relevant subject followed by specific subtopics as comma-separated tags, no explanation or elaboration. For example: "Economics, BANKING, FINANCE" or "Modern History, GANDHI, NCM".`;

export const DEFAULT_ANALYTICS_PROMPT = 
`You're analyzing UPSC mock test performance data. Based on the following statistics, provide 
actionable study advice targeting the weakest areas and recognizing strengths.

Focus on:
1. Connecting subject performance to meta-cognitive patterns
2. Identifying priority areas for revision
3. Suggesting specific study techniques based on the data
4. Highlighting improvement trends (if available)

Keep your response concise, practical, and focused on actionable advice. Use bullet points.`;

export const DEFAULT_STUDY_PLAN_PROMPT = 
`As a UPSC exam coach, create a detailed 7-day study plan based on the candidate's performance data below.
The plan should address their weakest areas while maintaining strengths.

For each day, provide:
1. Key subjects/topics to focus on (specify 2-3 priority areas)
2. Recommended study approach (e.g., revision, practice tests, note-making)
3. Time allocation suggestions (morning/afternoon/evening blocks)
4. One specific resource recommendation for each focus area

Make the plan practical, balanced, and targeted to optimize their preparation strategy.
Include a brief explanation of why you've structured the plan this way.`;

export const DEFAULT_LEARNING_PATTERN_PROMPT = 
`Analyze the student's learning patterns based on the UPSC mock test data provided.
Focus specifically on metacognitive insights (confidence levels, knowledge self-assessment, guesswork patterns).

Provide insights on:
1. How the student's self-assessment correlates with actual performance
2. Patterns in their confidence levels across different subjects
3. When they rely on guesswork vs. knowledge
4. Their time management patterns across subjects

Include 3-5 specific, actionable recommendations to improve their metacognitive approach to studying.
Be specific, insightful, and focused on psychological aspects of learning rather than just content knowledge.`;

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

// Function to get study plan recommendations
export async function getStudyPlanRecommendations(
  stats: {
    overallStats: SubjectStats;
    subjectStats: SubjectStats[];
  },
  apiKey: string,
  model: string,
  prompt: string = DEFAULT_STUDY_PLAN_PROMPT
): Promise<string> {
  try {
    // Format the statistics for the model (same as getAnalyticsInsights)
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
          maxOutputTokens: 1200, // Increased for longer study plan
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as GeminiResponse;
    return data.candidates[0]?.content.parts[0].text || 'No study plan available.';
  } catch (error) {
    console.error('Error getting study plan:', error);
    return 'Unable to generate study plan at this time. Please try again later.';
  }
}

// Function to get learning pattern analysis
export async function getLearningPatternAnalysis(
  stats: {
    overallStats: SubjectStats;
    subjectStats: SubjectStats[];
  },
  apiKey: string,
  model: string,
  prompt: string = DEFAULT_LEARNING_PATTERN_PROMPT
): Promise<string> {
  try {
    // Format the statistics for the model (same as getAnalyticsInsights)
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
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as GeminiResponse;
    return data.candidates[0]?.content.parts[0].text || 'No learning pattern analysis available.';
  } catch (error) {
    console.error('Error getting learning pattern analysis:', error);
    return 'Unable to generate learning pattern analysis at this time. Please try again later.';
  }
}

// Function to generate AI explanation for a question
export async function getQuestionExplanation(
  question: QuestionWithTags,
  userAnswer: UserAnswer,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  try {
    // Format the question and answers for the model
    const formattedQuestion = `
Question: ${question.questionText}

Options:
A) ${question.optionA}
B) ${question.optionB}
C) ${question.optionC}
D) ${question.optionD}

Correct Answer: ${question.correctAnswer}) ${question.correctAnswerText}
User Selected: ${userAnswer.selectedOption}) ${
      userAnswer.selectedOption === "A" ? question.optionA :
      userAnswer.selectedOption === "B" ? question.optionB :
      userAnswer.selectedOption === "C" ? question.optionC : 
      question.optionD
    }
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { text: formattedQuestion }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as GeminiResponse;
    return data.candidates[0]?.content.parts[0].text || 'No explanation available.';
  } catch (error) {
    console.error('Error getting question explanation:', error);
    return 'Unable to generate explanation at this time. Please try again later.';
  }
}
