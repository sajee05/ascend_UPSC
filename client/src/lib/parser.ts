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
        continue; // Skip malformed blocks
      }
      
      const questionPart = parts[0].split('#QuestionEnd')[0].trim();
      const answerPart = parts[1].split('#AnswerEnd')[0].trim();
      
      // Extract question number and text
      const questionMatch = questionPart.match(/Q(\d+)\)\s*(.*)/s);
      
      if (!questionMatch) {
        continue; // Skip if question format is invalid
      }
      
      const questionNumber = parseInt(questionMatch[1]);
      const fullText = questionMatch[2].trim();
      
      // Find where options start (looking for pattern like "a)", "A)", etc.)
      const optionStartRegex = /\n\s*[a-dA-D][\)\.]|\n\s*\([a-dA-D]\)|\n\s*[ivx]+\)/;
      const optionStartMatch = fullText.match(optionStartRegex);
      
      if (!optionStartMatch) {
        continue; // Skip if options cannot be identified
      }
      
      const optionStartIndex = optionStartMatch.index;
      
      // Extract the question text (everything before options)
      const questionText = fullText.substring(0, optionStartIndex).trim();
      
      // Extract options
      const optionsText = fullText.substring(optionStartIndex).trim();
      const optionLines = optionsText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Helper function to normalize option format
      const normalizeOption = (option: string): string => {
        // Remove leading markers like "a)", "A.", "(a)", etc.
        return option.replace(/^[a-dA-D][\)\.]\s*|^\([a-dA-D]\)\s*|^[ivx]+\)\s*/, '').trim();
      };
      
      // Extract options A, B, C, D
      const options: Record<string, string> = {
        A: '', B: '', C: '', D: ''
      };
      
      const optionKeys = ['A', 'B', 'C', 'D'];
      
      for (let i = 0; i < Math.min(optionLines.length, 4); i++) {
        options[optionKeys[i]] = normalizeOption(optionLines[i]);
      }
      
      // Extract correct answer from answer part
      const answerMatch = answerPart.match(/Answer:\s*([a-dA-D])[\.|\)]?\s*(.*)/i);
      
      if (!answerMatch) {
        continue; // Skip if answer format is invalid
      }
      
      const correctAnswerLetter = answerMatch[1].toUpperCase();
      const correctAnswerText = answerMatch[2].trim();
      
      questions.push({
        questionNumber,
        questionText,
        optionA: options.A,
        optionB: options.B,
        optionC: options.C,
        optionD: options.D,
        correctAnswer: correctAnswerLetter,
        correctAnswerText
      });
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
