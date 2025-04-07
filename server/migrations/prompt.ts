/**
 * This file contains the prompt for Gemini AI to help categorize
 * questions into subjects and topics during the migration process.
 */

// This function returns a prompt for the AI to categorize a question
export function migrationPrompt(questionText: string, options: string[]): string {
  return `
You are an expert UPSC exam question classifier.

Please analyze the following question and determine the most appropriate subject and topic it belongs to.

QUESTION:
${questionText}

${options.length > 0 ? `ANSWER OPTIONS:\n${options.join('\n')}` : ''}

Available subjects and topics:

1. Polity
   - Constitution (Indian Constitution: Features, Amendments, and Evolution)
   - Parliament (Parliament Structure and Functions)
   - Executive (President, Prime Minister, and Council of Ministers)
   - Judiciary (Supreme Court, High Courts, and Judicial System)
   - Federalism (Federal Structure, Centre-State Relations)

2. History
   - Ancient History (Ancient Indian History and Indus Valley Civilization)
   - Medieval History (Medieval Indian History, Delhi Sultanate, Mughals)
   - Modern History (British Rule and Freedom Movement)
   - Post-Independence (India after Independence)

3. Geography
   - Physical Geography (Mountains, Rivers, Climate of India)
   - Economic Geography (Resources, Industries, and Agriculture)
   - World Geography (World Climate, Resources, and Geopolitics)

4. Economics
   - Macroeconomics (National Income, Inflation, Monetary Policy)
   - Indian Economy (Economic Reforms, Planning, and Development)
   - International Economics (Trade, Balance of Payments, Global Institutions)

5. Science
   - Physics and Chemistry
   - Biology and Biotechnology
   - Space and Technology
   - Environmental Science

6. Environment
   - Ecology and Ecosystems
   - Biodiversity and Conservation
   - Environmental Policies
   - Climate Change

7. Current Affairs
   - National Events
   - International Relations
   - Government Policies
   - Contemporary Issues

8. Art & Culture
   - Indian Heritage
   - Religion and Philosophy
   - Architecture and Monuments
   - Performing Arts and Literature

Provide your response in JSON format as follows:
{
  "subject": "Name of the subject from the list",
  "topic": "Name of the topic from the list",
  "confidence": "high/medium/low",
  "explanation": "Brief explanation of why this classification fits"
}

Make sure to ONLY respond with valid JSON.
`;
}