import { QuestionWithTags, SubjectStats, UserAnswer } from "@shared/schema";

// Default prompts
export const DEFAULT_PARSING_PROMPT_TITLE = `Your Task:** You are an expert data formatter. Your goal is to convert all questions, answers, and explanatios fom the provided input text into a specific, structured format. Adhere strictly to the rules below.

**Input:** The input text will contain one or more questions, typically with multiple-choice options, a designated correct answer, and an accompanying explanation.

**Output Format:** For *each* question found in the input, you MUST structure the output exactly as follows:

#QuestionStart
Q1) [Insert the full question text here]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

#QuestionStart
Q2) [Insert the full question text here (i) statement 1 if any, (ii) statement 2 if any]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

#QuestionStart
Q3) [Insert the full question text here
table in text blocks if any (identify from pdf)
|---------------------------------|
abc | xyz |
|---------------------------------|]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

#QuestionStart
Q4) [Insert the full question text here (⭐ Please Re-check)]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

*Mandatory Rules & Constraints:**

1. **Exact Formatting:** Ensure table formatting is exactly as it is above (add "|"" in between the options). If there statements in the questions, involve them just below the question without spacing, given you the output below to be used as a rigid example.Use the precise tags (\`#QuestionStart\`, \`#QuestionEnd\`, \`#AnswerStart\`, \`#AnswerEnd\`) and prefixes (\`Q1)\`, \`Answer:\`, \`Explanation:\`) as shown. Maintain the line breaks as demonstrated in the format structure and the example.
  
2. **100% Accuracy to Input:** Reproduce the question text, all options, the identified correct answer, and the explanation text *exactly* as they appear in the input provided format. Do not rephrase, summarize, or omit any part of the original content unless addressing rule #5, in which case add the correction with in a bracket along with explanation but dont modify original..
  
3. **Stay Within Scope:** (Remove any sources like-Laxmikant/NCERT/etc, coaching names like forum IAS/visionIAS, links mentioned)=from the explanation. Do NOT add any information, details, or context that is not explicitly present in the original input provided for that specific question.
  
4. **No Hallucination:** Ensure, the answer is not just "a" but "a) answer". Output Should be exactly like depicted in the example. with proper line spacing vertically. Do not invent questions, answers, options, or explanations. Stick strictly to the provided source material.
  
5. **Error Identification and Correction (Questions Only):**
  

 - Carefully review the \`Question and its respective answer\` text provided in the input for each question.
 - If you identify a clear general knowledge error, factual inaccuracy, or logical inconsistency , you MUST:
   - Place a star emoji (⭐) immediately *after* the question.
   - Immediately following the ⭐, write: "please re-check" enclosed in parentheses \`()\`. (see Q4) from above example)
 - **Important:** Apply this error correction *only* by indicating asa specified. Do *not* alter the question, options, or the indicated correct answer even if you suspect they are wrong in the source; reproduce them as given. If the source explanation itself seems factually flawed *according to common knowledge/factually/logically or inconsistency in option and its explanation*, apply the correction method by just indicating to recheck. I repeat, NEVER CHANGE ANY TEXT just indicate as described above.

6. **OCR correction:** it is possible the input provided to you maybe in jumbled or abruptly broken text format, convert it into normal paragraphs but DO NOT change the content. **Example**: *Jumbled-ocr Input*:
   The President of India is empowered to proclaim a national emergency only after receiving a
   written recommendation from the Union Cabinet.
   *nomralised*:
   The President of India is empowered to proclaim a national emergency only after receiving a written recommendation from the Union Cabinet.
  
7. CRITICAL! NEVER INSERT answer's explanation. just verify that correct answer and explanation given in the answer is matching internally. in the output only mention the correct option with option number i.e. a), b), c), d) and its answer in front of it. for eg: a) America
  

*Process all questions present in the input text according to these rules, only output the output no unnecessary text like "here is your output" + give it to me in code-block so that i can directly copy paste*.`;

export const DEFAULT_EXPLANATION_PROMPT = `Analyze this UPSC question and provide a detailed explanation of why the correct answer is right and why the other options are wrong.

Format your response using Markdown, with clear sections:

1. **Question Analysis**: Brief explanation of what the question is asking around 25 words.
2. **Correct Answer**: Detailed explanation of why the correct option is right around 50 words.
3. **Incorrect Options**: For each wrong option, explain why it's incorrect with respect to the question around 50 words each option (in case of inference dont just say that its not correct inferrence thats why its incorrect, explain the reasoning, similarly with statements, no absolute answers, explain it).
4. **Key Takeaways**: 2-3 bullet points summarizing the main concept / most relevant subtopics related to questions and options to UPSC under 25 words each.

Include factual information with precise citations where possible. before generating the output, proofread/fact check the whole text, each and every sentence very properly, if you think there is even an iota of doubt or scope of general/logical/factual error, add a star emoji ⭐ at the end of statement and write why you added it in the brackets next to the star emoji.`;

export const DEFAULT_SUBJECT_TAGGING_PROMPT = `Analyze this UPSC question and classify it under the most relevant subject from the following comprehensive list:

- Economics
- Current events of national and international importance
- Ancient History (Art & Culture)
- Medieval History (Art & Culture)
- Modern Indian History
- Polity and Governance
- Geography
- Environment & ecology
- Science and Technology
- CSAT (Quant)
- CSAT (Logic and Reasoning)
- CSAT (Reading comprehension)

Return *only one* THE most relevant subject to the question from the above list, no explanation or elaboration just the tag. For example: "Economics" OR "Ancient History (Art & Culture)" i.e. only output the subject with nothing extra.`;

export const DEFAULT_ANALYTICS_PROMPT = `You're analyzing UPSC mock test performance data. Based on the following statistics, provide
actionable study advice targeting the weakest areas and recognizing strengths.

Focus on:
1. Connecting subject performance to meta-cognitive patterns
2. Identifying priority areas for revision
3. Suggesting specific study techniques based on the data
4. Highlighting improvement trends (if available)

Keep your response concise, practical, and focused on actionable advice. Use bullet points.`;

export const DEFAULT_STUDY_PLAN_PROMPT = `As a UPSC exam coach, create a detailed 7-day study plan based on the candidate's performance data below with one hour target each day, the student already has a plan you only have a one hour advisory window for each day.
The plan should address their weakest areas while maintaining strengths.

For each day, provide:

1. Key subjects/topics to focus on (specify 2-3 priority areas)
2. Recommended study approach (e.g., revision, practice tests, note-making)
3. Time allocation suggestions (morning/afternoon/evening blocks)
4. One specific resource recommendation for each focus area

Make the plan practical, balanced, and targeted to optimize their preparation strategy.
Include a brief explanation of why you've structured the plan this way.`;

export const DEFAULT_LEARNING_PATTERN_PROMPT = `Analyze the student's learning patterns based on the UPSC mock test data provided.
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
  prompt: string,
): Promise<string[]> {
  try {
    const content = `${questionText}\n\n${options.join("\n")}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, { text: content }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 100,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const tagsText = data.candidates[0]?.content.parts[0].text || "";

    // Split by commas and trim each tag
    return tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  } catch (error) {
    console.error("Error getting subject tags:", error);
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
  prompt: string,
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
${stats.subjectStats
  .map(
    (subject) => `
${subject.subject}:
- Questions: ${subject.attempts}
- Accuracy: ${subject.accuracy.toFixed(1)}%
- Score: ${subject.score.toFixed(2)}
- Avg Time: ${subject.avgTimeSeconds.toFixed(0)}s
- Confidence: High ${subject.confidenceHigh}, Medium ${subject.confidenceMid}, Low ${subject.confidenceLow}
- Knowledge: Yes ${subject.knowledgeYes}, Technique: Yes ${subject.techniqueYes}, Guesswork: Yes ${subject.guessworkYes}
`,
  )
  .join("")}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, { text: formattedStats }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 800,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as GeminiResponse;
    return (
      data.candidates[0]?.content.parts[0].text || "No insights available."
    );
  } catch (error) {
    console.error("Error getting analytics insights:", error);
    return "Unable to generate insights at this time. Please try again later.";
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
  prompt: string = DEFAULT_STUDY_PLAN_PROMPT,
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
${stats.subjectStats
  .map(
    (subject) => `
${subject.subject}:
- Questions: ${subject.attempts}
- Accuracy: ${subject.accuracy.toFixed(1)}%
- Score: ${subject.score.toFixed(2)}
- Avg Time: ${subject.avgTimeSeconds.toFixed(0)}s
- Confidence: High ${subject.confidenceHigh}, Medium ${subject.confidenceMid}, Low ${subject.confidenceLow}
- Knowledge: Yes ${subject.knowledgeYes}, Technique: Yes ${subject.techniqueYes}, Guesswork: Yes ${subject.guessworkYes}
`,
  )
  .join("")}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, { text: formattedStats }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1200, // Increased for longer study plan
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as GeminiResponse;
    return (
      data.candidates[0]?.content.parts[0].text || "No study plan available."
    );
  } catch (error) {
    console.error("Error getting study plan:", error);
    return "Unable to generate study plan at this time. Please try again later.";
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
  prompt: string = DEFAULT_LEARNING_PATTERN_PROMPT,
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
${stats.subjectStats
  .map(
    (subject) => `
${subject.subject}:
- Questions: ${subject.attempts}
- Accuracy: ${subject.accuracy.toFixed(1)}%
- Score: ${subject.score.toFixed(2)}
- Avg Time: ${subject.avgTimeSeconds.toFixed(0)}s
- Confidence: High ${subject.confidenceHigh}, Medium ${subject.confidenceMid}, Low ${subject.confidenceLow}
- Knowledge: Yes ${subject.knowledgeYes}, Technique: Yes ${subject.techniqueYes}, Guesswork: Yes ${subject.guessworkYes}
`,
  )
  .join("")}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, { text: formattedStats }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as GeminiResponse;
    return (
      data.candidates[0]?.content.parts[0].text ||
      "No learning pattern analysis available."
    );
  } catch (error) {
    console.error("Error getting learning pattern analysis:", error);
    return "Unable to generate learning pattern analysis at this time. Please try again later.";
  }
}

// Function to generate AI explanation for a question
export async function getQuestionExplanation(
  question: QuestionWithTags,
  userAnswer: UserAnswer,
  apiKey: string,
  model: string,
  prompt: string,
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
      userAnswer.selectedOption === "A"
        ? question.optionA
        : userAnswer.selectedOption === "B"
          ? question.optionB
          : userAnswer.selectedOption === "C"
            ? question.optionC
            : question.optionD
    }
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, { text: formattedQuestion }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as GeminiResponse;
    return (
      data.candidates[0]?.content.parts[0].text || "No explanation available."
    );
  } catch (error) {
    console.error("Error getting question explanation:", error);
    return "Unable to generate explanation at this time. Please try again later.";
  }
}
