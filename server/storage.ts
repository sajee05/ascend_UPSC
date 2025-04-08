import { 
  Attempt, Flashcard, InsertAttempt, InsertFlashcard, InsertQuestion, 
  InsertTag, InsertTest, InsertUserAnswer, Question, QuestionWithTags, 
  SubjectStats, Tag, Test, TestAnalytics, TestWithStats, UserAnswer,
  attempts, questions, tags, tests, userAnswers, flashcards,
  subjects, topics, questionSubjects, questionTopics, testSubjects,
  Subject, Topic, InsertQuestionSubject, InsertQuestionTopic, InsertTestSubject
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, asc, inArray } from "drizzle-orm";

// Helper function to ensure dates are properly converted to strings
function dateToString(date: Date | string | null): string | null {
  if (date === null) return null;
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return null;
}

// Interface for storage operations
export interface IStorage {
  // Tests
  createTest(test: InsertTest): Promise<Test>;
  getTest(id: number): Promise<Test | undefined>;
  getAllTests(): Promise<TestWithStats[]>;
  deleteTest(id: number): Promise<void>;
  
  // Questions
  addQuestionsToTest(questions: InsertQuestion[]): Promise<Question[]>;
  getQuestion(id: number): Promise<QuestionWithTags | undefined>;
  getQuestionsByTest(testId: number): Promise<QuestionWithTags[]>;
  getAllQuestions(): Promise<QuestionWithTags[]>; // Get all questions across all tests
  
  // Tags
  addTagsToQuestion(tags: InsertTag[]): Promise<Tag[]>;
  deleteTag(id: number): Promise<void>;
  getAllTags(): Promise<string[]>; // Get all unique tag names
  
  // Attempts
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  getAttempt(id: number): Promise<Attempt | undefined>;
  getAttemptsByTest(testId: number): Promise<Attempt[]>;
  updateAttempt(id: number, data: Partial<Attempt>): Promise<Attempt | undefined>;
  
  // User Answers
  createUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer>;
  getUserAnswersByAttempt(attemptId: number): Promise<UserAnswer[]>;
  updateUserAnswer(id: number, data: Partial<UserAnswer>): Promise<UserAnswer | undefined>;
  
  // Flashcards
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  getAllFlashcards(): Promise<(Flashcard & { question: QuestionWithTags })[]>;
  updateFlashcard(id: number, data: Partial<Flashcard>): Promise<Flashcard | undefined>;
  
  // Analytics
  getTestAnalytics(attemptId: number): Promise<TestAnalytics | undefined>;
  getOverallAnalytics(): Promise<{ 
    testCount: number;
    attemptCount: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalLeft: number;
    subjectStats: SubjectStats[];
    trendData: { date: string; accuracy: number; score: number }[];
  }>;
  
  // Other utilities
  getAnkiData(testId: number): Promise<{
    front: string;
    back: string;
    tags: string;
  }[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private tests: Map<number, Test>;
  private questions: Map<number, Question>;
  private tags: Map<number, Tag>;
  private attempts: Map<number, Attempt>;
  private userAnswers: Map<number, UserAnswer>;
  private flashcards: Map<number, Flashcard>;
  
  private currentTestId: number = 1;
  private currentQuestionId: number = 1;
  private currentTagId: number = 1;
  private currentAttemptId: number = 1;
  private currentUserAnswerId: number = 1;
  private currentFlashcardId: number = 1;

  constructor() {
    this.tests = new Map();
    this.questions = new Map();
    this.tags = new Map();
    this.attempts = new Map();
    this.userAnswers = new Map();
    this.flashcards = new Map();
  }

  // Test methods
  async createTest(testData: InsertTest): Promise<Test> {
    const id = this.currentTestId++;
    const test: Test = {
      ...testData,
      id,
      uploadedAt: dateToString(new Date()) || new Date().toISOString(),
    };
    this.tests.set(id, test);
    return test;
  }

  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }

  async deleteTest(id: number): Promise<void> {
    // Delete the test first
    this.tests.delete(id);
    
    // Find and delete all questions associated with this test
    const questionsToDelete = Array.from(this.questions.entries())
      .filter(([_, question]) => question.testId === id)
      .map(([qId, _]) => qId);
      
    // Find and delete all tags associated with the questions
    const tagsToDelete = Array.from(this.tags.entries())
      .filter(([_, tag]) => questionsToDelete.includes(tag.questionId))
      .map(([tagId, _]) => tagId);
      
    // Find and delete all attempts for this test
    const attemptsToDelete = Array.from(this.attempts.entries())
      .filter(([_, attempt]) => attempt.testId === id)
      .map(([attemptId, _]) => attemptId);
      
    // Find and delete all user answers for the deleted attempts
    const answersToDelete = Array.from(this.userAnswers.entries())
      .filter(([_, answer]) => attemptsToDelete.includes(answer.attemptId))
      .map(([answerId, _]) => answerId);
      
    // Find and delete all flashcards for the deleted questions
    const flashcardsToDelete = Array.from(this.flashcards.entries())
      .filter(([_, flashcard]) => questionsToDelete.includes(flashcard.questionId))
      .map(([flashcardId, _]) => flashcardId);
    
    // Delete everything
    questionsToDelete.forEach(qId => this.questions.delete(qId));
    tagsToDelete.forEach(tagId => this.tags.delete(tagId));
    attemptsToDelete.forEach(attemptId => this.attempts.delete(attemptId));
    answersToDelete.forEach(answerId => this.userAnswers.delete(answerId));
    flashcardsToDelete.forEach(flashcardId => this.flashcards.delete(flashcardId));
  }

  async getAllTests(): Promise<TestWithStats[]> {
    return Array.from(this.tests.values()).map(test => {
      const testAttempts = Array.from(this.attempts.values()).filter(a => a.testId === test.id);
      
      let bestScore = null;
      let lastAttemptDate: string | null = null;
      
      if (testAttempts.length > 0) {
        // Find the attempt with the highest score
        const completedAttempts = testAttempts.filter(a => a.completed);
        if (completedAttempts.length > 0) {
          const attemptScores = completedAttempts.map(attempt => {
            const answers = Array.from(this.userAnswers.values()).filter(a => a.attemptId === attempt.id);
            const correctAnswers = answers.filter(a => a.isCorrect).length;
            // Simple scoring: 2 points per correct answer
            return correctAnswers * 2;
          });
          bestScore = Math.max(...attemptScores);
          
          // Find the most recent attempt
          const sortedAttempts = [...completedAttempts].sort((a, b) => 
            new Date(b.endTime || "").getTime() - new Date(a.endTime || "").getTime()
          );
          if (sortedAttempts.length > 0 && sortedAttempts[0].endTime) {
            lastAttemptDate = sortedAttempts[0].endTime;
          }
        }
      }
      
      return {
        ...test,
        attempts: testAttempts.length,
        lastAttemptDate,
        bestScore,
      };
    }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  // Question methods
  async addQuestionsToTest(questionsData: InsertQuestion[]): Promise<Question[]> {
    const createdQuestions: Question[] = [];
    
    for (const questionData of questionsData) {
      const id = this.currentQuestionId++;
      const question: Question = {
        ...questionData,
        id,
      };
      this.questions.set(id, question);
      createdQuestions.push(question);
    }
    
    return createdQuestions;
  }

  async getQuestion(id: number): Promise<QuestionWithTags | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const questionTags = Array.from(this.tags.values()).filter(tag => tag.questionId === id);
    
    return {
      ...question,
      tags: questionTags,
    };
  }

  async getQuestionsByTest(testId: number): Promise<QuestionWithTags[]> {
    const testQuestions = Array.from(this.questions.values())
      .filter(question => question.testId === testId);
      
    return testQuestions.map(question => {
      const questionTags = Array.from(this.tags.values())
        .filter(tag => tag.questionId === question.id);
        
      return {
        ...question,
        tags: questionTags,
      };
    });
  }
  
  async getAllQuestions(): Promise<QuestionWithTags[]> {
    // Get all questions across all tests
    const allQuestions = Array.from(this.questions.values());
      
    return allQuestions.map(question => {
      const questionTags = Array.from(this.tags.values())
        .filter(tag => tag.questionId === question.id);
        
      return {
        ...question,
        tags: questionTags,
      };
    });
  }

  // Tag methods
  async addTagsToQuestion(tagsData: InsertTag[]): Promise<Tag[]> {
    const createdTags: Tag[] = [];
    
    for (const tagData of tagsData) {
      const id = this.currentTagId++;
      const tag: Tag = {
        ...tagData,
        id,
      };
      this.tags.set(id, tag);
      createdTags.push(tag);
    }
    
    return createdTags;
  }

  async deleteTag(id: number): Promise<void> {
    this.tags.delete(id);
  }
  
  async getAllTags(): Promise<string[]> {
    // Get unique tag names
    const tagSet = new Set<string>();
    Array.from(this.tags.values()).forEach(tag => {
      tagSet.add(tag.tagName);
    });
    return Array.from(tagSet);
  }

  // Attempt methods
  async createAttempt(attemptData: InsertAttempt): Promise<Attempt> {
    const id = this.currentAttemptId++;
    const attempt: Attempt = {
      ...attemptData,
      id,
      startTime: new Date().toISOString(),
      endTime: null,
      totalTimeSeconds: null,
      completed: false,
    };
    this.attempts.set(id, attempt);
    return attempt;
  }

  async getAttempt(id: number): Promise<Attempt | undefined> {
    return this.attempts.get(id);
  }

  async getAttemptsByTest(testId: number): Promise<Attempt[]> {
    return Array.from(this.attempts.values())
      .filter(attempt => attempt.testId === testId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async updateAttempt(id: number, data: Partial<Attempt>): Promise<Attempt | undefined> {
    const attempt = this.attempts.get(id);
    if (!attempt) return undefined;
    
    const updatedAttempt = {
      ...attempt,
      ...data,
    };
    
    this.attempts.set(id, updatedAttempt);
    return updatedAttempt;
  }

  // User Answer methods
  async createUserAnswer(answerData: InsertUserAnswer): Promise<UserAnswer> {
    const id = this.currentUserAnswerId++;
    
    // Check if there's a previous attempt for this question in this test
    let attemptNumber = 1;
    
    // First, find the current attempt
    const attempt = this.attempts.get(answerData.attemptId);
    
    if (attempt) {
      // Get all previous attempts for this test
      const previousAttempts = Array.from(this.attempts.values())
        .filter(a => a.testId === attempt.testId && a.id < answerData.attemptId);
      
      // Count how many times this question has been attempted before
      if (previousAttempts.length > 0) {
        const previousAnswers = Array.from(this.userAnswers.values())
          .filter(a => a.questionId === answerData.questionId &&
                  previousAttempts.some(pa => pa.id === a.attemptId));
                  
        if (previousAnswers.length > 0) {
          attemptNumber = previousAnswers.length + 1;
        }
      }
    }
    
    const now = new Date();
    const answer: UserAnswer = {
      ...answerData,
      id,
      attemptNumber,
      timestamp: dateToString(now) || now.toISOString(),
    };
    
    this.userAnswers.set(id, answer);
    
    // If this is an incorrect answer or left question, automatically create a flashcard
    if (answerData.isCorrect === false || answerData.isLeft === true) {
      try {
        console.log(`Creating flashcard for question ID: ${answerData.questionId}`);
        this.createFlashcard({ questionId: answerData.questionId });
      } catch (flashcardError) {
        console.error("Error creating flashcard:", flashcardError);
        // Continue with the answer submission even if flashcard creation fails
      }
    }
    
    return answer;
  }

  async getUserAnswersByAttempt(attemptId: number): Promise<UserAnswer[]> {
    return Array.from(this.userAnswers.values())
      .filter(answer => answer.attemptId === attemptId);
  }
  
  async updateUserAnswer(id: number, data: Partial<UserAnswer>): Promise<UserAnswer | undefined> {
    const answer = this.userAnswers.get(id);
    if (!answer) return undefined;
    
    const updatedAnswer = {
      ...answer,
      ...data
    };
    
    this.userAnswers.set(id, updatedAnswer);
    return updatedAnswer;
  }

  // Flashcard methods
  async createFlashcard(flashcardData: InsertFlashcard): Promise<Flashcard> {
    // Check if flashcard for this question already exists
    const existingFlashcard = Array.from(this.flashcards.values())
      .find(f => f.questionId === flashcardData.questionId);
      
    if (existingFlashcard) {
      return existingFlashcard;
    }
    
    const id = this.currentFlashcardId++;
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const flashcard: Flashcard = {
      ...flashcardData,
      id,
      createdAt: dateToString(now) || now.toISOString(),
      lastReviewedAt: null,
      nextReviewAt: dateToString(tomorrow) || tomorrow.toISOString(),
      easeFactor: 2.5,
      interval: 1,
      reviewCount: 0,
    };
    
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async getAllFlashcards(): Promise<(Flashcard & { question: QuestionWithTags })[]> {
    const result: (Flashcard & { question: QuestionWithTags })[] = [];
    
    for (const flashcard of Array.from(this.flashcards.values())) {
      const question = await this.getQuestion(flashcard.questionId);
      if (question) {
        result.push({
          ...flashcard,
          question
        });
      }
    }
    
    return result;
  }

  async updateFlashcard(id: number, data: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const flashcard = this.flashcards.get(id);
    if (!flashcard) return undefined;
    
    const updatedFlashcard = {
      ...flashcard,
      ...data,
    };
    
    this.flashcards.set(id, updatedFlashcard);
    return updatedFlashcard;
  }

  // Analytics methods
  async getTestAnalytics(attemptId: number): Promise<TestAnalytics | undefined> {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) return undefined;
    
    const test = this.tests.get(attempt.testId);
    if (!test) return undefined;
    
    const answers = await this.getUserAnswersByAttempt(attemptId);
    if (answers.length === 0) return undefined;
    
    // Get questions for this test
    const questions = await this.getQuestionsByTest(attempt.testId);
    
    // Map question IDs to questions for easy lookup
    const questionMap = new Map<number, QuestionWithTags>();
    questions.forEach(q => questionMap.set(q.id, q));
    
    // Get all subjects (tags) from questions
    const subjectTags = new Set<string>();
    questions.forEach(q => {
      q.tags.forEach(tag => {
        if (!tag.isAIGenerated) subjectTags.add(tag.tagName);
      });
    });
    
    // For each subject, calculate stats
    const subjectStats: SubjectStats[] = [];
    
    // Function to calculate stats for a subset of answers
    const calculateStats = (filteredAnswers: UserAnswer[]): SubjectStats => {
      const correct = filteredAnswers.filter(a => a.isCorrect).length;
      const incorrect = filteredAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
      const left = filteredAnswers.filter(a => a.isLeft).length;
      
      // Calculate other stats
      const score = correct * 2 - incorrect * 0.66;
      const accuracy = filteredAnswers.length > 0 ? (correct / (correct + incorrect)) * 100 : 0;
      
      // Calculate confidence stats
      const highConfidence = filteredAnswers.filter(a => a.confidenceLevel === 'high').length;
      const midConfidence = filteredAnswers.filter(a => a.confidenceLevel === 'mid').length;
      const lowConfidence = filteredAnswers.filter(a => a.confidenceLevel === 'low').length;
      
      // Calculate meta-cognitive stats
      const knowledgeYes = filteredAnswers.filter(a => a.knowledgeFlag).length;
      const techniqueYes = filteredAnswers.filter(a => a.techniqueFlag).length;
      const guessworkYes = filteredAnswers.filter(a => a.guessworkFlag).length;
      
      // Calculate average time
      const totalTime = filteredAnswers.reduce((sum, a) => sum + (a.answerTimeSeconds || 0), 0);
      const avgTime = filteredAnswers.length > 0 ? totalTime / filteredAnswers.length : 0;
      
      // Calculate attempt-based statistics
      const firstAttemptCorrect = filteredAnswers.filter(a => a.isCorrect && a.attemptNumber === 1).length;
      const secondAttemptCorrect = filteredAnswers.filter(a => a.isCorrect && a.attemptNumber === 2).length;
      const thirdPlusAttemptCorrect = filteredAnswers.filter(a => a.isCorrect && a.attemptNumber && a.attemptNumber >= 3).length;
      
      // Distribution of attempt numbers
      const attemptDistribution: {[key: number]: number} = {};
      filteredAnswers.forEach(answer => {
        const attemptNum = answer.attemptNumber || 1; // Default to 1 if not set
        attemptDistribution[attemptNum] = (attemptDistribution[attemptNum] || 0) + 1;
      });
      
      return {
        subject: '',  // Will be set by caller
        attempts: filteredAnswers.length,
        correct,
        incorrect,
        left,
        score,
        accuracy,
        personalBest: accuracy, // For overall stats, this will be updated later
        avgTimeSeconds: avgTime,
        confidenceHigh: highConfidence,
        confidenceMid: midConfidence,
        confidenceLow: lowConfidence,
        knowledgeYes,
        techniqueYes,
        guessworkYes,
        // New attempt-based stats
        firstAttemptCorrect,
        secondAttemptCorrect,
        thirdPlusAttemptCorrect,
        attemptDistribution,
      };
    };
    
    // Overall stats first
    const overallStats = calculateStats(answers);
    overallStats.subject = 'OVERALL';
    
    // Stats by subject
    for (const subject of subjectTags) {
      // Get questions with this subject tag
      const subjectQuestionIds = questions
        .filter(q => q.tags.some(t => t.tagName === subject))
        .map(q => q.id);
      
      // Get answers for these questions
      const subjectAnswers = answers.filter(a => subjectQuestionIds.includes(a.questionId));
      
      if (subjectAnswers.length > 0) {
        const stats = calculateStats(subjectAnswers);
        stats.subject = subject;
        
        // Get user's personal best for this subject from other attempts
        const otherAttempts = Array.from(this.attempts.values())
          .filter(a => a.testId === attempt.testId && a.id !== attemptId);
          
        let personalBest = stats.accuracy;
        
        for (const otherAttempt of otherAttempts) {
          const otherAnswers = Array.from(this.userAnswers.values())
            .filter(a => a.attemptId === otherAttempt.id);
            
          const otherSubjectAnswers = otherAnswers
            .filter(a => subjectQuestionIds.includes(a.questionId));
            
          if (otherSubjectAnswers.length > 0) {
            const otherCorrect = otherSubjectAnswers.filter(a => a.isCorrect).length;
            const otherIncorrect = otherSubjectAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
            const otherAccuracy = (otherCorrect / (otherCorrect + otherIncorrect)) * 100;
            
            if (otherAccuracy > personalBest) {
              personalBest = otherAccuracy;
            }
          }
        }
        
        stats.personalBest = personalBest;
        subjectStats.push(stats);
      }
    }
    
    // Calculate overall stats using all answers
    // Calculate overall stats using all answers for return object
    const memStats = calculateStats(answers);
    memStats.subject = 'Overall';
      
    return {
      testId: test.id,
      attemptId,
      title: test.title,
      date: dateToString(attempt.startTime) || "",
      totalTimeSeconds: attempt.totalTimeSeconds || 0,
      overallStats: memStats,
      subjectStats,
    };
  }

  async getOverallAnalytics(): Promise<{
    testCount: number;
    attemptCount: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalLeft: number;
    subjectStats: SubjectStats[];
    trendData: { date: string; accuracy: number; score: number }[];
  }> {
    const tests = Array.from(this.tests.values());
    const attempts = Array.from(this.attempts.values()).filter(a => a.completed);
    const answers = Array.from(this.userAnswers.values());
    
    // Basic stats
    const testCount = tests.length;
    const attemptCount = attempts.length;
    const totalCorrect = answers.filter(a => a.isCorrect).length;
    const totalIncorrect = answers.filter(a => !a.isCorrect && !a.isLeft).length;
    const totalLeft = answers.filter(a => a.isLeft).length;
    
    // Get all subjects (tags)
    const subjectTags = new Set<string>();
    for (const tagObj of this.tags.values()) {
      if (!tagObj.isAIGenerated) {
        subjectTags.add(tagObj.tagName);
      }
    }
    
    // Stats by subject
    const subjectStats: SubjectStats[] = [];
    
    for (const subject of subjectTags) {
      // Get questions with this subject tag
      const subjectQuestionIds = Array.from(this.questions.values())
        .filter(q => {
          const tags = Array.from(this.tags.values())
            .filter(t => t.questionId === q.id && t.tagName === subject);
          return tags.length > 0;
        })
        .map(q => q.id);
      
      // Get answers for these questions
      const subjectAnswers = answers
        .filter(a => subjectQuestionIds.includes(a.questionId));
      
      if (subjectAnswers.length > 0) {
        const correct = subjectAnswers.filter(a => a.isCorrect).length;
        const incorrect = subjectAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
        const left = subjectAnswers.filter(a => a.isLeft).length;
        
        // Calculate other stats
        const score = correct * 2 - incorrect * 0.66;
        const accuracy = (correct / (correct + incorrect)) * 100;
        
        // Calculate confidence stats
        const highConfidence = subjectAnswers.filter(a => a.confidenceLevel === 'high').length;
        const midConfidence = subjectAnswers.filter(a => a.confidenceLevel === 'mid').length;
        const lowConfidence = subjectAnswers.filter(a => a.confidenceLevel === 'low').length;
        
        // Calculate meta-cognitive stats
        const knowledgeYes = subjectAnswers.filter(a => a.knowledgeFlag).length;
        const techniqueYes = subjectAnswers.filter(a => a.techniqueFlag).length;
        const guessworkYes = subjectAnswers.filter(a => a.guessworkFlag).length;
        
        // Calculate average time
        const totalTime = subjectAnswers.reduce((sum, a) => sum + (a.answerTimeSeconds || 0), 0);
        const avgTime = subjectAnswers.length > 0 ? totalTime / subjectAnswers.length : 0;
        
        // Calculate attempt-based stats for this subject
        const firstAttemptCorrectSubj = subjectAnswers.filter(a => a.isCorrect && a.attemptNumber === 1).length;
        const secondAttemptCorrectSubj = subjectAnswers.filter(a => a.isCorrect && a.attemptNumber === 2).length;
        const thirdPlusAttemptCorrectSubj = subjectAnswers.filter(a => a.isCorrect && a.attemptNumber && a.attemptNumber >= 3).length;
        
        // Distribution of attempt numbers
        const attemptDistributionSubj: {[key: number]: number} = {};
        subjectAnswers.forEach(answer => {
          const attemptNum = answer.attemptNumber || 1; // Default to 1 if not set
          attemptDistributionSubj[attemptNum] = (attemptDistributionSubj[attemptNum] || 0) + 1;
        });
        
        subjectStats.push({
          subject,
          attempts: subjectAnswers.length,
          correct,
          incorrect,
          left,
          score,
          accuracy,
          personalBest: accuracy,
          avgTimeSeconds: avgTime,
          confidenceHigh: highConfidence,
          confidenceMid: midConfidence,
          confidenceLow: lowConfidence,
          knowledgeYes,
          techniqueYes,
          guessworkYes,
          firstAttemptCorrect: firstAttemptCorrectSubj,
          secondAttemptCorrect: secondAttemptCorrectSubj,
          thirdPlusAttemptCorrect: thirdPlusAttemptCorrectSubj,
          attemptDistribution: attemptDistributionSubj,
        });
      }
    }
    
    // Trend data over time
    const trendData: { date: string; accuracy: number; score: number }[] = [];
    
    // Sort attempts by date
    const sortedAttempts = [...attempts].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    for (const attempt of sortedAttempts) {
      const attemptAnswers = answers.filter(a => a.attemptId === attempt.id);
      const correct = attemptAnswers.filter(a => a.isCorrect).length;
      const incorrect = attemptAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
      
      if (correct + incorrect > 0) {
        const accuracy = (correct / (correct + incorrect)) * 100;
        const score = correct * 2 - incorrect * 0.66;
        
        trendData.push({
          date: dateToString(attempt.startTime) || "",
          accuracy,
          score,
        });
      }
    }
    
    return {
      testCount,
      attemptCount,
      totalCorrect,
      totalIncorrect,
      totalLeft,
      subjectStats,
      trendData,
    };
  }

  // Anki data generation
  async getAnkiData(testId: number): Promise<{
    front: string;
    back: string;
    tags: string;
  }[]> {
    const questions = await this.getQuestionsByTest(testId);
    
    return questions.map(question => {
      // Format the front (question + options)
      const front = `${question.questionText}\n\n${question.optionA}\n\n${question.optionB}\n\n${question.optionC}\n\n${question.optionD}`;
      
      // Format the back (correct answer)
      const back = `${question.correctAnswer}) ${question.correctAnswerText}`;
      
      // Format tags
      const tagsList = question.tags.map(tag => tag.tagName.replace(/\s+/g, '_')).join(' ');
      
      return {
        front,
        back,
        tags: tagsList,
      };
    });
  }
}

// Database-backed storage implementation
export class DatabaseStorage implements IStorage {
  // Test methods
  async createTest(testData: InsertTest): Promise<Test> {
    const [test] = await db.insert(tests)
      .values(testData)
      .returning();
    return test;
  }

  async getTest(id: number): Promise<Test | undefined> {
    const [test] = await db.select()
      .from(tests)
      .where(eq(tests.id, id));
    return test;
  }

  async deleteTest(id: number): Promise<void> {
    // Use a transaction to delete a test and all related data
    await db.transaction(async (tx) => {
      // Get all questions for this test
      const testQuestions = await tx
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.testId, id));
        
      const questionIds = testQuestions.map(q => q.id);
      
      if (questionIds.length > 0) {
        // Delete all tags for these questions
        await tx
          .delete(tags)
          .where(inArray(tags.questionId, questionIds));
          
        // Delete all flashcards for these questions
        await tx
          .delete(flashcards)
          .where(inArray(flashcards.questionId, questionIds));
      }
      
      // Get all attempts for this test
      const testAttempts = await tx
        .select({ id: attempts.id })
        .from(attempts)
        .where(eq(attempts.testId, id));
        
      const attemptIds = testAttempts.map(a => a.id);
      
      if (attemptIds.length > 0) {
        // Delete all user answers for these attempts
        await tx
          .delete(userAnswers)
          .where(inArray(userAnswers.attemptId, attemptIds));
          
        // Delete all attempts
        await tx
          .delete(attempts)
          .where(eq(attempts.testId, id));
      }
      
      // Delete all test subject links
      await tx
        .delete(testSubjects)
        .where(eq(testSubjects.testId, id));
      
      // Delete all questions for this test
      await tx
        .delete(questions)
        .where(eq(questions.testId, id));
        
      // Finally, delete the test itself
      await tx
        .delete(tests)
        .where(eq(tests.id, id));
    });
  }

  async getAllTests(): Promise<TestWithStats[]> {
    try {
      console.time('getAllTests');
      // Fetch all tests with a single query
      const allTests = await db.select().from(tests).orderBy(desc(tests.uploadedAt));
      
      if (allTests.length === 0) {
        console.timeEnd('getAllTests');
        return [];
      }
      
      // Get all test IDs
      const testIds = allTests.map(test => test.id);
      
      // Get all attempts for these tests in a single query
      const allAttempts = testIds.length > 0 
        ? await db.select().from(attempts).where(inArray(attempts.testId, testIds))
        : [];
      
      // Get all answers for completed attempts in a single query
      const completedAttemptIds = allAttempts
        .filter(a => a.completed)
        .map(a => a.id);
      
      const allAnswers = completedAttemptIds.length > 0
        ? await db.select().from(userAnswers).where(inArray(userAnswers.attemptId, completedAttemptIds))
        : [];
      
      // Group attempts by test
      const attemptsByTest = new Map<number, typeof allAttempts>();
      allAttempts.forEach(attempt => {
        if (!attemptsByTest.has(attempt.testId)) {
          attemptsByTest.set(attempt.testId, []);
        }
        attemptsByTest.get(attempt.testId)!.push(attempt);
      });
      
      // Group answers by attempt
      const answersByAttempt = new Map<number, typeof allAnswers>();
      allAnswers.forEach(answer => {
        if (!answersByAttempt.has(answer.attemptId)) {
          answersByAttempt.set(answer.attemptId, []);
        }
        answersByAttempt.get(answer.attemptId)!.push(answer);
      });
      
      // Process each test
      const result: TestWithStats[] = allTests.map(test => {
        const testAttempts = attemptsByTest.get(test.id) || [];
        const completedAttempts = testAttempts.filter(a => a.completed);
        
        let bestScore = null;
        let lastAttemptDate = null;
        
        if (completedAttempts.length > 0) {
          // Calculate best score
          const attemptScores = completedAttempts.map(attempt => {
            const answers = answersByAttempt.get(attempt.id) || [];
            const correctAnswers = answers.filter(a => a.isCorrect).length;
            return correctAnswers * 2;
          });
          
          if (attemptScores.length > 0) {
            bestScore = Math.max(...attemptScores);
          }
          
          // Find most recent attempt
          const sortedAttempts = [...completedAttempts].sort((a, b) => 
            new Date(b.endTime || "").getTime() - new Date(a.endTime || "").getTime()
          );
          
          if (sortedAttempts.length > 0 && sortedAttempts[0].endTime) {
            lastAttemptDate = sortedAttempts[0].endTime;
          }
        }
        
        // Get question count
        return {
          ...test,
          attempts: testAttempts.length,
          lastAttemptDate,
          bestScore,
          questionCount: test.questionCount || 0, // Make sure questionCount is always available
        };
      });
      
      console.timeEnd('getAllTests');
      return result;
    } catch (error) {
      console.error('Error in getAllTests:', error);
      throw error;
    }
  }

  // Question methods
  async addQuestionsToTest(questionsData: InsertQuestion[]): Promise<Question[]> {
    if (questionsData.length === 0) return [];
    
    const createdQuestions = await db.insert(questions)
      .values(questionsData)
      .returning();
    
    return createdQuestions;
  }

  async getQuestion(id: number): Promise<QuestionWithTags | undefined> {
    const [question] = await db.select()
      .from(questions)
      .where(eq(questions.id, id));
    
    if (!question) return undefined;
    
    // Get tags for this question
    const questionTags = await db.select()
      .from(tags)
      .where(eq(tags.questionId, id));
    
    // Get subjects for this question
    const questionSubjectsData = await db.select({
      questionSubject: questionSubjects,
      subject: subjects,
    })
      .from(questionSubjects)
      .innerJoin(subjects, eq(questionSubjects.subjectId, subjects.id))
      .where(eq(questionSubjects.questionId, id));
    
    const questionSubjectsArray = questionSubjectsData.map(qs => qs.subject);
    
    // Get topics for this question
    const questionTopicsData = await db.select({
      questionTopic: questionTopics,
      topic: topics,
    })
      .from(questionTopics)
      .innerJoin(topics, eq(questionTopics.topicId, topics.id))
      .where(eq(questionTopics.questionId, id));
    
    const questionTopicsArray = questionTopicsData.map(qt => qt.topic);
    
    return {
      ...question,
      tags: questionTags,
      subjects: questionSubjectsArray,
      topics: questionTopicsArray,
    };
  }

  async getQuestionsByTest(testId: number): Promise<QuestionWithTags[]> {
    try {
      console.time(`getQuestionsByTest-${testId}`);
      // Get all questions for this test
      const testQuestions = await db.select()
        .from(questions)
        .where(eq(questions.testId, testId));
        
      if (testQuestions.length === 0) {
        console.timeEnd(`getQuestionsByTest-${testId}`);
        return [];
      }
      
      // Extract all question IDs
      const questionIds = testQuestions.map(q => q.id);
      
      // Get all tags, subjects, and topics for these questions in batched queries
      const allTags = questionIds.length > 0 
        ? await db.select().from(tags).where(inArray(tags.questionId, questionIds))
        : [];
          
      // Group tags by question ID
      const tagsByQuestion = new Map<number, Tag[]>();
      allTags.forEach(tag => {
        if (!tagsByQuestion.has(tag.questionId)) {
          tagsByQuestion.set(tag.questionId, []);
        }
        tagsByQuestion.get(tag.questionId)!.push(tag);
      });
      
      // Get all subject relationships
      const allSubjectsData = questionIds.length > 0
        ? await db.select({
            questionId: questionSubjects.questionId,
            questionSubject: questionSubjects,
            subject: subjects,
          })
          .from(questionSubjects)
          .innerJoin(subjects, eq(questionSubjects.subjectId, subjects.id))
          .where(inArray(questionSubjects.questionId, questionIds))
        : [];
      
      // Group subjects by question ID
      const subjectsByQuestion = new Map<number, Subject[]>();
      allSubjectsData.forEach(data => {
        if (!subjectsByQuestion.has(data.questionId)) {
          subjectsByQuestion.set(data.questionId, []);
        }
        subjectsByQuestion.get(data.questionId)!.push(data.subject);
      });
      
      // Get all topic relationships
      const allTopicsData = questionIds.length > 0
        ? await db.select({
            questionId: questionTopics.questionId,
            questionTopic: questionTopics,
            topic: topics,
          })
          .from(questionTopics)
          .innerJoin(topics, eq(questionTopics.topicId, topics.id))
          .where(inArray(questionTopics.questionId, questionIds))
        : [];
      
      // Group topics by question ID
      const topicsByQuestion = new Map<number, Topic[]>();
      allTopicsData.forEach(data => {
        if (!topicsByQuestion.has(data.questionId)) {
          topicsByQuestion.set(data.questionId, []);
        }
        topicsByQuestion.get(data.questionId)!.push(data.topic);
      });
      
      // Assemble the questions with their related data
      const result: QuestionWithTags[] = testQuestions.map(question => ({
        ...question,
        tags: tagsByQuestion.get(question.id) || [],
        subjects: subjectsByQuestion.get(question.id) || [],
        topics: topicsByQuestion.get(question.id) || [],
      }));
      
      console.timeEnd(`getQuestionsByTest-${testId}`);
      return result;
    } catch (error) {
      console.error(`Error in getQuestionsByTest(${testId}):`, error);
      throw error;
    }
  }
  
  async getAllQuestions(): Promise<QuestionWithTags[]> {
    try {
      // Get all questions - more efficient approach using a query to get questions by all test IDs
      // Instead of fetching all questions directly, we'll get all test IDs first,
      // then get questions for those tests using getQuestionsByTest, which is a more tested/reliable function
      const allTests = await db.select().from(tests);
      const testIds = allTests.map(test => test.id);
      
      // Use Promise.all to fetch questions for each test in parallel
      const questionsPromises = testIds.map(testId => this.getQuestionsByTest(testId));
      const questionsArrays = await Promise.all(questionsPromises);
      
      // Flatten the array of arrays
      const allQuestions = questionsArrays.flat();
      
      console.log(`Found ${allQuestions.length} questions across ${testIds.length} tests`);
      return allQuestions;
    } catch (error) {
      console.error("Error getting all questions:", error);
      return [];
    }
  }

  // Tag methods
  async addTagsToQuestion(tagsData: InsertTag[]): Promise<Tag[]> {
    if (tagsData.length === 0) return [];
    
    const createdTags = await db.insert(tags)
      .values(tagsData)
      .returning();
    
    return createdTags;
  }

  async deleteTag(id: number): Promise<void> {
    await db.delete(tags).where(eq(tags.id, id));
  }
  
  async getAllTags(): Promise<string[]> {
    // Query to get all unique tag names
    const result = await db.selectDistinct({ tagName: tags.tagName })
      .from(tags);
    
    // Extract tag names from result
    return result.map(row => row.tagName);
  }

  // Attempt methods
  async createAttempt(attemptData: InsertAttempt): Promise<Attempt> {
    const [attempt] = await db.insert(attempts)
      .values({
        ...attemptData,
        completed: false,
      })
      .returning();
    
    return attempt;
  }

  async getAttempt(id: number): Promise<Attempt | undefined> {
    const [attempt] = await db.select()
      .from(attempts)
      .where(eq(attempts.id, id));
    
    return attempt;
  }

  async getAttemptsByTest(testId: number): Promise<Attempt[]> {
    const testAttempts = await db.select()
      .from(attempts)
      .where(eq(attempts.testId, testId))
      .orderBy(desc(attempts.startTime));
    
    return testAttempts;
  }

  async updateAttempt(id: number, data: Partial<Attempt>): Promise<Attempt | undefined> {
    const [updatedAttempt] = await db.update(attempts)
      .set(data)
      .where(eq(attempts.id, id))
      .returning();
    
    return updatedAttempt;
  }

  // User Answer methods
  async createUserAnswer(answerData: InsertUserAnswer): Promise<UserAnswer> {
    try {
      // Check if there are existing answers for this question in this attempt
      // to determine the attempt number
      let attemptNumber = 1; // Default is first attempt
      
      if (answerData.questionId && answerData.attemptId) {
        const existingAnswers = await db.select({ count: sql<number>`count(*)` })
          .from(userAnswers)
          .where(
            and(
              eq(userAnswers.questionId, answerData.questionId),
              eq(userAnswers.attemptId, answerData.attemptId)
            )
          );
        
        // If there are existing answers, increment the attempt number
        if (existingAnswers.length > 0 && existingAnswers[0].count > 0) {
          attemptNumber = existingAnswers[0].count + 1;
        }
      }
      
      // Insert the new answer with the calculated attempt number
      const [answer] = await db.insert(userAnswers)
        .values({
          ...answerData,
          attemptNumber,
          // Let the database handle timestamp with defaultNow()
          // Don't include explicit timestamp field
        })
        .returning();
      
      // If this is an incorrect answer or left question, automatically create a flashcard
      if (answerData.isCorrect === false || answerData.isLeft === true) {
        try {
          console.log(`Creating flashcard for question ID: ${answerData.questionId}`);
          await this.createFlashcard({ questionId: answerData.questionId });
        } catch (flashcardError) {
          console.error("Error creating flashcard:", flashcardError);
          // Continue with the answer submission even if flashcard creation fails
        }
      }
      
      return answer;
    } catch (error) {
      console.error("Error submitting answer:", error);
      throw new Error("Failed to submit answer");
    }
  }

  async getUserAnswersByAttempt(attemptId: number): Promise<UserAnswer[]> {
    const answers = await db.select()
      .from(userAnswers)
      .where(eq(userAnswers.attemptId, attemptId));
    
    return answers;
  }
  
  async updateUserAnswer(id: number, data: Partial<UserAnswer>): Promise<UserAnswer | undefined> {
    try {
      const [updatedAnswer] = await db.update(userAnswers)
        .set(data)
        .where(eq(userAnswers.id, id))
        .returning();
      
      return updatedAnswer;
    } catch (error) {
      console.error("Error updating user answer:", error);
      return undefined;
    }
  }

  // Flashcard methods
  async createFlashcard(flashcardData: InsertFlashcard): Promise<Flashcard> {
    try {
      // Check if flashcard for this question already exists
      const [existingFlashcard] = await db.select()
        .from(flashcards)
        .where(eq(flashcards.questionId, flashcardData.questionId));
      
      if (existingFlashcard) {
        return existingFlashcard;
      }
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Let database handle createdAt with defaultNow()
      const [flashcard] = await db.insert(flashcards)
        .values({
          ...flashcardData,
          nextReviewAt: tomorrow
        })
        .returning();
      
      return flashcard;
    } catch (error) {
      console.error("Error creating flashcard:", error);
      throw new Error("Failed to create flashcard");
    }
  }

  async getAllFlashcards(): Promise<(Flashcard & { question: QuestionWithTags })[]> {
    const allFlashcards = await db.select().from(flashcards);
    const result: (Flashcard & { question: QuestionWithTags })[] = [];
    
    for (const flashcard of allFlashcards) {
      const question = await this.getQuestion(flashcard.questionId);
      
      if (question) {
        result.push({
          ...flashcard,
          question: question,
        });
      }
    }
    
    return result;
  }

  async updateFlashcard(id: number, data: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const [updatedFlashcard] = await db.update(flashcards)
      .set(data)
      .where(eq(flashcards.id, id))
      .returning();
    
    return updatedFlashcard;
  }

  // Overall analytics
  async getOverallAnalytics(): Promise<{
    testCount: number;
    attemptCount: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalLeft: number;
    subjectStats: SubjectStats[];
    trendData: { date: string; accuracy: number; score: number }[];
  }> {
    // Get basic counts
    const testCount = await db.select({ count: sql<number>`count(*)` }).from(tests);
    const attemptCount = await db.select({ count: sql<number>`count(*)` })
      .from(attempts)
      .where(eq(attempts.completed, true));
    
    const answers = await db.select().from(userAnswers);
    const totalCorrect = answers.filter(a => a.isCorrect).length;
    const totalIncorrect = answers.filter(a => !a.isCorrect && !a.isLeft).length;
    const totalLeft = answers.filter(a => a.isLeft).length;

    // Get all subjects 
    const allSubjects = await db.select().from(subjects);
    
    // Stats by subject
    const subjectStats: SubjectStats[] = [];
    
    for (const subject of allSubjects) {
      // Get questions with this subject (through question_subjects table)
      const questionSubjectLinks = await db.select({
        questionId: questionSubjects.questionId
      })
      .from(questionSubjects)
      .where(eq(questionSubjects.subjectId, subject.id));
      
      const subjectQuestionIds = questionSubjectLinks.map(qs => qs.questionId);
      
      // Get answers for these questions
      const subjectAnswers = answers.filter(a => subjectQuestionIds.includes(a.questionId));
      
      if (subjectAnswers.length > 0) {
        const correct = subjectAnswers.filter(a => a.isCorrect).length;
        const incorrect = subjectAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
        const left = subjectAnswers.filter(a => a.isLeft).length;
        
        // Calculate other stats
        const score = correct * 2 - incorrect * 0.66;
        const accuracy = (correct / (correct + incorrect)) * 100 || 0;
        
        // Calculate confidence stats
        const highConfidence = subjectAnswers.filter(a => a.confidenceLevel === 'high').length;
        const midConfidence = subjectAnswers.filter(a => a.confidenceLevel === 'mid').length;
        const lowConfidence = subjectAnswers.filter(a => a.confidenceLevel === 'low').length;
        
        // Calculate meta-cognitive stats
        const knowledgeYes = subjectAnswers.filter(a => a.knowledgeFlag).length;
        const techniqueYes = subjectAnswers.filter(a => a.techniqueFlag).length;
        const guessworkYes = subjectAnswers.filter(a => a.guessworkFlag).length;
        
        // Calculate average time
        const totalTime = subjectAnswers.reduce((sum, a) => sum + (a.answerTimeSeconds || 0), 0);
        const avgTime = subjectAnswers.length > 0 ? totalTime / subjectAnswers.length : 0;
        
        // Calculate attempt-based stats
        const firstAttemptCorrect = subjectAnswers.filter(a => a.isCorrect && a.attemptNumber === 1).length;
        const secondAttemptCorrect = subjectAnswers.filter(a => a.isCorrect && a.attemptNumber === 2).length;
        const thirdPlusAttemptCorrect = subjectAnswers.filter(a => a.isCorrect && a.attemptNumber && a.attemptNumber >= 3).length;
        
        // Distribution of attempt numbers
        const attemptDistribution: {[key: number]: number} = {};
        subjectAnswers.forEach(answer => {
          const attemptNum = answer.attemptNumber || 1;
          attemptDistribution[attemptNum] = (attemptDistribution[attemptNum] || 0) + 1;
        });
        
        // Calculate personal best
        let personalBest = accuracy;
        
        subjectStats.push({
          subject: subject.name,
          attempts: subjectAnswers.length,
          correct,
          incorrect,
          left,
          score,
          accuracy,
          personalBest,
          avgTimeSeconds: avgTime,
          confidenceHigh: highConfidence,
          confidenceMid: midConfidence,
          confidenceLow: lowConfidence,
          knowledgeYes,
          techniqueYes,
          guessworkYes,
          firstAttemptCorrect,
          secondAttemptCorrect,
          thirdPlusAttemptCorrect,
          attemptDistribution,
        });
      }
    }

    // Trend data over time
    const trendData: { date: string; accuracy: number; score: number }[] = [];
    
    // Get all attempts sorted by date
    const allAttempts = await db.select().from(attempts).where(eq(attempts.completed, true));
    const sortedAttempts = [...allAttempts].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    for (const attempt of sortedAttempts) {
      const attemptAnswers = answers.filter(a => a.attemptId === attempt.id);
      const correct = attemptAnswers.filter(a => a.isCorrect).length;
      const incorrect = attemptAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
      
      if (correct + incorrect > 0) {
        const accuracy = (correct / (correct + incorrect)) * 100;
        const score = correct * 2 - incorrect * 0.66;
        
        trendData.push({
          date: dateToString(attempt.startTime) || "",
          accuracy,
          score,
        });
      }
    }
    
    return {
      testCount: testCount[0]?.count || 0,
      attemptCount: attemptCount[0]?.count || 0,
      totalCorrect,
      totalIncorrect,
      totalLeft,
      subjectStats,
      trendData,
    };
  }

  // Anki data generation
  async getAnkiData(testId: number): Promise<{
    front: string;
    back: string;
    tags: string;
  }[]> {
    const questions = await this.getQuestionsByTest(testId);
    
    return questions.map(question => {
      // Format the front (question + options)
      const front = `${question.questionText}\n\n${question.optionA}\n\n${question.optionB}\n\n${question.optionC}\n\n${question.optionD}`;
      
      // Format the back (correct answer)
      const back = `${question.correctAnswer}) ${question.correctAnswerText}`;
      
      // Format tags
      const tagsList = question.tags.map(tag => tag.tagName.replace(/\s+/g, '_')).join(' ');
      
      return {
        front,
        back,
        tags: tagsList,
      };
    });
  }

  // Analytics methods
  async getTestAnalytics(attemptId: number): Promise<TestAnalytics | undefined> {
    // Get attempt
    const [attempt] = await db.select()
      .from(attempts)
      .where(eq(attempts.id, attemptId));
    
    if (!attempt) return undefined;
    
    // Get test
    const [test] = await db.select()
      .from(tests)
      .where(eq(tests.id, attempt.testId));
    
    if (!test) return undefined;
    
    // Get answers for this attempt
    const answers = await db.select()
      .from(userAnswers)
      .where(eq(userAnswers.attemptId, attemptId));
    
    if (answers.length === 0) return undefined;
    
    // Get questions for this test
    const questions = await this.getQuestionsByTest(attempt.testId);
    
    // Map question IDs to questions for easy lookup
    const questionMap = new Map<number, QuestionWithTags>();
    questions.forEach(q => questionMap.set(q.id, q));
    
    // Get all subjects (tags) from questions
    // Get all subjects from questions (prioritize new schema, fallback to tags)
    const subjectTags = new Set<string>();
    questions.forEach(q => {
      // Check for subject data first (new schema)
      if (q.subjects && q.subjects.length > 0) {
        q.subjects.forEach(subject => {
          subjectTags.add(subject.name);
        });
      } else {
        // Fallback to tags for backward compatibility
        q.tags.forEach(tag => {
          if (!tag.isAIGenerated) subjectTags.add(tag.tagName);
        });
      }
    });
    
    // For each subject, calculate stats
    const subjectStats: SubjectStats[] = [];
    
    // Function to calculate stats for a subset of answers
    const calculateStats = (filteredAnswers: UserAnswer[]): SubjectStats => {
      const correct = filteredAnswers.filter(a => a.isCorrect).length;
      const incorrect = filteredAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
      const left = filteredAnswers.filter(a => a.isLeft).length;
      
      // Calculate other stats
      const score = correct * 2 - incorrect * 0.66;
      const accuracy = filteredAnswers.length > 0 ? (correct / (correct + incorrect)) * 100 : 0;
      
      // Calculate confidence stats
      const highConfidence = filteredAnswers.filter(a => a.confidenceLevel === 'high').length;
      const midConfidence = filteredAnswers.filter(a => a.confidenceLevel === 'mid').length;
      const lowConfidence = filteredAnswers.filter(a => a.confidenceLevel === 'low').length;
      
      // Calculate meta-cognitive stats
      const knowledgeYes = filteredAnswers.filter(a => a.knowledgeFlag).length;
      const techniqueYes = filteredAnswers.filter(a => a.techniqueFlag).length;
      const guessworkYes = filteredAnswers.filter(a => a.guessworkFlag).length;
      
      // Calculate average time
      const totalTime = filteredAnswers.reduce((sum, a) => sum + (a.answerTimeSeconds || 0), 0);
      const avgTime = filteredAnswers.length > 0 ? totalTime / filteredAnswers.length : 0;
      
      // Calculate attempt-based statistics
      const firstAttemptCorrect = filteredAnswers.filter(a => a.isCorrect && a.attemptNumber === 1).length;
      const secondAttemptCorrect = filteredAnswers.filter(a => a.isCorrect && a.attemptNumber === 2).length;
      const thirdPlusAttemptCorrect = filteredAnswers.filter(a => a.isCorrect && a.attemptNumber && a.attemptNumber >= 3).length;
      
      // Distribution of attempt numbers
      const attemptDistribution: {[key: number]: number} = {};
      filteredAnswers.forEach(answer => {
        const attemptNum = answer.attemptNumber || 1; // Default to 1 if not set
        attemptDistribution[attemptNum] = (attemptDistribution[attemptNum] || 0) + 1;
      });
      
      return {
        subject: '',  // Will be set by caller
        attempts: filteredAnswers.length,
        correct,
        incorrect,
        left,
        score,
        accuracy,
        personalBest: accuracy, // For overall stats, this will be updated later
        avgTimeSeconds: avgTime,
        confidenceHigh: highConfidence,
        confidenceMid: midConfidence,
        confidenceLow: lowConfidence,
        knowledgeYes,
        techniqueYes,
        guessworkYes,
        // New attempt-based stats
        firstAttemptCorrect,
        secondAttemptCorrect,
        thirdPlusAttemptCorrect,
        attemptDistribution,
      };
    };
    
    // Overall stats first
    const overallStats = calculateStats(answers);
    overallStats.subject = 'OVERALL';
    
    // Stats by subject
    for (const subject of subjectTags) {
      // Get questions with this subject (check both new schema and old tags)
      const subjectQuestionIds = questions
        .filter(q => {
          // Check subjects first (new schema)
          if (q.subjects && q.subjects.length > 0) {
            return q.subjects.some(s => s.name === subject);
          } 
          // Fallback to tags
          return q.tags.some(t => t.tagName === subject);
        })
        .map(q => q.id);
      
      // Get answers for these questions
      const subjectAnswers = answers.filter(a => subjectQuestionIds.includes(a.questionId));
      
      if (subjectAnswers.length > 0) {
        const stats = calculateStats(subjectAnswers);
        stats.subject = subject;
        
        // Get user's personal best for this subject from other attempts
        const otherAttempts = await db.select()
          .from(attempts)
          .where(and(
            eq(attempts.testId, attempt.testId),
            sql`${attempts.id} != ${attemptId}`
          ));
        
        let personalBest = stats.accuracy;
        
        for (const otherAttempt of otherAttempts) {
          const otherAnswers = await db.select()
            .from(userAnswers)
            .where(eq(userAnswers.attemptId, otherAttempt.id));
          
          const otherSubjectAnswers = otherAnswers
            .filter(a => subjectQuestionIds.includes(a.questionId));
          
          if (otherSubjectAnswers.length > 0) {
            const otherCorrect = otherSubjectAnswers.filter(a => a.isCorrect).length;
            const otherIncorrect = otherSubjectAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
            const otherAccuracy = (otherCorrect / (otherCorrect + otherIncorrect)) * 100;
            
            if (otherAccuracy > personalBest) {
              personalBest = otherAccuracy;
            }
          }
        }
        
        stats.personalBest = personalBest;
        subjectStats.push(stats);
      }
    }
    
    // Calculate overall stats using all answers
    return {
      testId: test.id,
      attemptId,
      title: test.title,
      date: dateToString(attempt.startTime) || "",
      totalTimeSeconds: attempt.totalTimeSeconds || 0,
      overallStats: overallStats,
      subjectStats,
    };
  }

  async getOverallAnalytics(): Promise<{
    testCount: number;
    attemptCount: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalLeft: number;
    subjectStats: SubjectStats[];
    trendData: { date: string; accuracy: number; score: number }[];
  }> {
    // Fetch basic counts
    const [{ count: testCount }] = await db.select({ count: sql`COUNT(*)::integer` }).from(tests);
    
    const [{ count: attemptCount }] = await db.select({ count: sql`COUNT(*)::integer` }).from(attempts)
      .where(eq(attempts.completed, true));
    
    const [{ correct: totalCorrect }] = await db.select({
      correct: sql`COUNT(CASE WHEN ${userAnswers.isCorrect} = true THEN 1 END)::integer`
    }).from(userAnswers);
    
    const [{ incorrect: totalIncorrect }] = await db.select({
      incorrect: sql`COUNT(CASE WHEN ${userAnswers.isCorrect} = false AND ${userAnswers.isLeft} = false THEN 1 END)::integer`
    }).from(userAnswers);
    
    const [{ left: totalLeft }] = await db.select({
      left: sql`COUNT(CASE WHEN ${userAnswers.isLeft} = true THEN 1 END)::integer`
    }).from(userAnswers);
    
    // Get all subjects (from new schema, fall back to tags if needed)
    const subjectsResult = await db.select()
      .from(subjects)
      .where(eq(subjects.isActive, true));
    
    const subjectNames = subjectsResult.map(s => s.name);
    
    // For backward compatibility, also get subject tags
    const subjectTagsResult = await db.select({ tagName: tags.tagName })
      .from(tags)
      .where(eq(tags.isAIGenerated, false))
      .groupBy(tags.tagName);
    
    // Combine subjects from both sources, removing duplicates
    const subjectTags = [...new Set([...subjectNames, ...subjectTagsResult.map(t => t.tagName)])];
    
    // Stats by subject
    const subjectStats: SubjectStats[] = [];
    
    for (const subject of subjectTags) {
      // Try to get questions from the subjects table first (new schema)
      let questionIds: number[] = [];
      
      // Look up the subject in the subjects table
      const subjectRecord = await db.select()
        .from(subjects)
        .where(eq(subjects.name, subject))
        .limit(1);
        
      if (subjectRecord.length > 0) {
        // Get questions with this subject using the new schema
        const questionsWithSubject = await db.select({
          questionId: questionSubjects.questionId
        })
        .from(questionSubjects)
        .where(eq(questionSubjects.subjectId, subjectRecord[0].id));
        
        questionIds = questionsWithSubject.map(q => q.questionId);
      }
      
      // If no questions found, fall back to tags
      if (questionIds.length === 0) {
        const questionsWithTag = await db.select()
          .from(questions)
          .innerJoin(tags, eq(questions.id, tags.questionId))
          .where(and(
            eq(tags.tagName, subject),
            eq(tags.isAIGenerated, false)
          ));
        
        questionIds = questionsWithTag.map(q => q.questions.id);
      }
      
      if (questionIds.length > 0) {
        // Get answers for these questions
        const subjectAnswers = await db.select()
          .from(userAnswers)
          .where(sql`${userAnswers.questionId} IN (${questionIds.join(',')})`);
        
        if (subjectAnswers.length > 0) {
          // Calculate stats
          const correct = subjectAnswers.filter(a => a.isCorrect).length;
          const incorrect = subjectAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
          const left = subjectAnswers.filter(a => a.isLeft).length;
          
          const score = correct * 2 - incorrect * 0.66;
          const accuracy = (correct / (correct + incorrect)) * 100;
          
          // Calculate other stats
          const highConfidence = subjectAnswers.filter(a => a.confidenceLevel === 'high').length;
          const midConfidence = subjectAnswers.filter(a => a.confidenceLevel === 'mid').length;
          const lowConfidence = subjectAnswers.filter(a => a.confidenceLevel === 'low').length;
          
          const knowledgeYes = subjectAnswers.filter(a => a.knowledgeFlag).length;
          const techniqueYes = subjectAnswers.filter(a => a.techniqueFlag).length;
          const guessworkYes = subjectAnswers.filter(a => a.guessworkFlag).length;
          
          // Calculate avg time
          const totalTime = subjectAnswers.reduce((sum, a) => sum + (a.answerTimeSeconds || 0), 0);
          const avgTime = totalTime / subjectAnswers.length;
          
          // Find personal best
          const attemptIds = [...new Set(subjectAnswers.map(a => a.attemptId))];
          
          let personalBest = 0;
          for (const attemptId of attemptIds) {
            const attemptAnswers = subjectAnswers.filter(a => a.attemptId === attemptId);
            const attemptCorrect = attemptAnswers.filter(a => a.isCorrect).length;
            const attemptIncorrect = attemptAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
            const attemptAccuracy = (attemptCorrect / (attemptCorrect + attemptIncorrect)) * 100;
            
            if (attemptAccuracy > personalBest) {
              personalBest = attemptAccuracy;
            }
          }
          
          subjectStats.push({
            subject,
            attempts: subjectAnswers.length,
            correct,
            incorrect,
            left,
            score,
            accuracy,
            personalBest,
            avgTimeSeconds: avgTime,
            confidenceHigh: highConfidence,
            confidenceMid: midConfidence,
            confidenceLow: lowConfidence,
            knowledgeYes,
            techniqueYes,
            guessworkYes,
            // New attempt-based stats
            firstAttemptCorrect: subjectAnswers.filter(a => a.isCorrect && a.attemptNumber === 1).length,
            secondAttemptCorrect: subjectAnswers.filter(a => a.isCorrect && a.attemptNumber === 2).length,
            thirdPlusAttemptCorrect: subjectAnswers.filter(a => a.isCorrect && a.attemptNumber && a.attemptNumber >= 3).length,
            attemptDistribution: {},
          });
        }
      }
    }
    
    // Get trend data (accuracy and score by date)
    const trendData: { date: string; accuracy: number; score: number }[] = [];
    
    // Get all completed attempts ordered by date
    const completedAttempts = await db.select()
      .from(attempts)
      .where(eq(attempts.completed, true))
      .orderBy(asc(attempts.endTime));
    
    for (const attempt of completedAttempts) {
      if (!attempt.endTime) continue;
      
      // Get answers for this attempt
      const attemptAnswers = await db.select()
        .from(userAnswers)
        .where(eq(userAnswers.attemptId, attempt.id));
      
      if (attemptAnswers.length > 0) {
        const correct = attemptAnswers.filter(a => a.isCorrect).length;
        const incorrect = attemptAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
        
        const score = correct * 2 - incorrect * 0.66;
        const accuracy = (correct / (correct + incorrect)) * 100;
        
        // Use the date part of the timestamp 
        let dateString = "";
        if (typeof attempt.endTime === 'string') {
          dateString = attempt.endTime.split('T')[0];
        } else if (attempt.endTime instanceof Date) {
          dateString = attempt.endTime.toISOString().split('T')[0];
        }
        
        trendData.push({
          date: dateString,
          accuracy: Number(accuracy.toFixed(2)),
          score: Number(score.toFixed(2)),
        });
      }
    }
    
    return {
      testCount,
      attemptCount,
      totalCorrect,
      totalIncorrect,
      totalLeft,
      subjectStats,
      trendData,
    };
  }

  // Other utilities
  async getAnkiData(testId: number): Promise<{
    front: string;
    back: string;
    tags: string;
  }[]> {
    // Get questions for this test
    const questionsWithTags = await this.getQuestionsByTest(testId);
    
    // Format data for Anki
    return questionsWithTags.map(question => {
      // Front side: question text
      const front = question.questionText;
      
      // Back side: correct answer with explanation
      const back = `${question.correctAnswerText}`;
      
      // Get tags from both the new schema (subjects/topics) and traditional tags
      let allTags: string[] = [];
      
      // Add subjects and topics if available (new schema)
      if (question.subjects && question.subjects.length > 0) {
        allTags = [...allTags, ...question.subjects.map(s => s.name)];
      }
      
      if (question.topics && question.topics.length > 0) {
        allTags = [...allTags, ...question.topics.map(t => t.name)];
      }
      
      // Add traditional tags
      allTags = [...allTags, ...question.tags.map(t => t.tagName)];
      
      // Remove duplicates and join
      const tagString = [...new Set(allTags)].join(',');
      
      return {
        front,
        back,
        tags: tagString,
      };
    });
  }
}

// Import the SqliteAdapter if needed
import { SqliteAdapter } from './sqlite-adapter';
import { logger } from './logger';

// Decide which storage implementation to use based on environment
let storage: IStorage;

// Check if running in Electron (ELECTRON_RUN is set in server-starter.js)
if (process.env.ELECTRON_RUN === '1') {
  console.log('Using SQLite storage for desktop mode');
  storage = new SqliteAdapter();
} else {
  console.log('Using PostgreSQL storage for web mode');
  storage = new DatabaseStorage();
}

export { storage };
