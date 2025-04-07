import { InsertQuestion } from "@shared/schema";

// Expected file structure:
// #QuestionStart
// Q1) Question text...
// a) Option A
// b) Option B
// c) Option C
// d) Option D
// #QuestionEnd
// #AnswerStart
// Answer: a) Option A text
// #AnswerEnd

interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string; // A, B, C, or D
  correctAnswerText: string;
}

export interface ParseResult {
  success: boolean;
  questions: ParsedQuestion[];
  errorMessage?: string;
}

// Function to detect and preserve table structure
function preserveTableFormatting(text: string): string {
  // Look for table patterns - lines containing multiple pipe characters
  const lines = text.split('\n');
  const processedLines: string[] = [];
  let insideTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a table line (has pipes or dashes forming table structure)
    if (line.includes('|') || line.includes('----')) {
      insideTable = true;
      // Preserve the exact formatting for table lines
      processedLines.push(line);
    } else if (insideTable) {
      // Check if we've exited the table
      if (line.trim() === '') {
        insideTable = false;
      }
      processedLines.push(line);
    } else {
      processedLines.push(line);
    }
  }
  
  return processedLines.join('\n');
}

// Parse the uploaded text file
export function parseTestFile(fileContent: string): ParseResult {
  try {
    // Split the file content by question blocks
    const questions: ParsedQuestion[] = [];
    const questionBlocks = fileContent.split('#QuestionStart').filter(block => block.trim().length > 0);

    if (questionBlocks.length === 0) {
      return { 
        success: false, 
        questions: [],
        errorMessage: "No questions found in the file. Make sure the file follows the required format with #QuestionStart tags."
      };
    }

    for (const block of questionBlocks) {
      // Split the block into question and answer parts
      const parts = block.split('#AnswerStart');
      
      if (parts.length !== 2) {
        console.log("Skipping malformed block - no #AnswerStart tag found");
        continue; // Skip malformed blocks
      }
      
      const questionPart = parts[0].split('#QuestionEnd')[0].trim();
      const answerPart = parts[1].split('#AnswerEnd')[0].trim();
      
      console.log("Processing question part:", questionPart);
      console.log("Processing answer part:", answerPart);
      
      // Extract question number and text
      const questionMatch = questionPart.match(/Q(\d+)\)\s*([\s\S]*)/);
      
      if (!questionMatch) {
        console.log("Skipping question with invalid format - no Q number found");
        continue; // Skip if question format is invalid
      }
      
      const questionNumber = parseInt(questionMatch[1]);
      const fullText = questionMatch[2].trim();
      
      // Process the text to preserve table formatting
      const processedText = preserveTableFormatting(fullText);
      
      // Extract options directly (assuming they're already formatted as a), b), etc.)
      const lines = processedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Find the option lines (looking for lines that start with a), b), etc.)
      const optionLines = lines.filter(line => /^[a-dA-D]\)/.test(line));
      
      if (optionLines.length < 2) {
        console.log("Skipping question - insufficient options found:", optionLines);
        continue; // Skip if not enough options found
      }
      
      // Extract question text (everything before the first option)
      const firstOptionIndex = lines.findIndex(line => /^[a-dA-D]\)/.test(line));
      const questionTextLines = lines.slice(0, firstOptionIndex);
      const questionText = questionTextLines.join('\n');
      
      // Helper function to normalize option format
      const normalizeOption = (option: string): string => {
        // Remove leading markers like "a)", "A)", etc.
        return option.replace(/^[a-dA-D]\)\s*/, '').trim();
      };
      
      // Extract options A, B, C, D
      const options: Record<string, string> = {
        A: '', B: '', C: '', D: ''
      };
      
      for (const line of optionLines) {
        const optionMatch = line.match(/^([a-dA-D])\)(.*)/);
        if (optionMatch) {
          const letterKey = optionMatch[1].toUpperCase();
          options[letterKey] = normalizeOption(line);
        }
      }
      
      // Extract correct answer from answer part
      // Format is typically "Answer: a) Option text"
      let correctAnswerLetter = '';
      let correctAnswerText = '';
      
      const answerMatch = answerPart.match(/Answer:\s*([a-dA-D])\)(.*)/i);
      
      if (answerMatch) {
        correctAnswerLetter = answerMatch[1].toUpperCase();
        correctAnswerText = answerMatch[2].trim();
      } else {
        console.log("Trying alternate answer format (no parenthesis)");
        // Try alternate format: "Answer: a Option text"
        const altAnswerMatch = answerPart.match(/Answer:\s*([a-dA-D])\s+(.*)/i);
        
        if (!altAnswerMatch) {
          console.log("Skipping question - invalid answer format:", answerPart);
          continue; // Skip if answer format is invalid
        }
        
        correctAnswerLetter = altAnswerMatch[1].toUpperCase();
        correctAnswerText = altAnswerMatch[2].trim();
      }
      
      questions.push({
        questionNumber,
        questionText,
        optionA: options.A || "No option provided",
        optionB: options.B || "No option provided",
        optionC: options.C || "No option provided",
        optionD: options.D || "No option provided",
        correctAnswer: correctAnswerLetter,
        correctAnswerText
      });
      
      console.log("Successfully parsed question:", questionNumber);
    }

    if (questions.length === 0) {
      return { 
        success: false, 
        questions: [],
        errorMessage: "No valid questions could be parsed from the file. Check the file format."
      };
    }

    return { success: true, questions };
  } catch (error) {
    console.error("Error parsing test file:", error);
    return { 
      success: false, 
      questions: [],
      errorMessage: "An error occurred while parsing the file. Please check the file format."
    };
  }
}

// Convert parsed questions to the format expected by the database
export function convertParsedQuestions(
  testId: number, 
  parsedQuestions: ParsedQuestion[]
): InsertQuestion[] {
  return parsedQuestions.map(question => ({
    testId,
    questionNumber: question.questionNumber,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctAnswer: question.correctAnswer,
    correctAnswerText: question.correctAnswerText,
  }));
}
