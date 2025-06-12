import {
  Attempt, Flashcard, InsertAttempt, InsertFlashcard, InsertQuestion,
  InsertTag, InsertTest, InsertUserAnswer, Question, QuestionWithTags,
  SubjectStats, Tag, Test, TestAnalytics, TestWithStats, UserAnswer,
  attempts, questions, tags, tests, userAnswers, flashcards,
  subjects, topics, questionSubjects, questionTopics, // Removed testSubjects as it's not defined in schema
  Subject, Topic // Removed InsertQuestionSubject, InsertQuestionTopic, InsertTestSubject as they are not defined in schema
} from "@shared/schema"; // Keep shared schema imports
import {
  QuestionNote, // Import from sqlite-schema
  InsertQuestionNote, // Import from sqlite-schema
  UserAnswerWithDetails, // Import from sqlite-schema
  HeatmapData as DbHeatmapData, // Import HeatmapData type
  ApplicationConfiguration, // Import for settings
  InsertApplicationConfiguration // Import for settings
} from "../shared/sqlite-schema"; // Correct path for DB-specific types
import { eq, desc, and, sql, asc, inArray } from "drizzle-orm"; // Keep drizzle-orm utils if MemStorage uses them

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
    avgTimeSeconds: number;
    totalQuestions?: number;
    accuracy?: number;
    subjectStats: SubjectStats[];
    trendData: { date: string; accuracy: number; score: number }[];
  }>;
  
  // Other utilities
  getAnkiData(testId: number): Promise<{
    front: string;
    back: string;
    tags: string;
  }[]>;

  // History
  getHistory(filter?: string): Promise<TestAnalytics[]>; // Added getHistory signature

  // Wrongs Feature
  getWrongAnswers(
    timeFilter?: string,
    tagFilter?: string,
    filterType?: 'Wrongs' | 'No knowledge' | 'Tukke' | 'Low confidence' | 'Medium confidence'
  ): Promise<UserAnswerWithDetails[]>; // Add filterType parameter

  // Notes Feature
  addQuestionNote(noteData: InsertQuestionNote): Promise<QuestionNote>; // Add this
  getAllNotes(timeFilter?: string, tagFilter?: string): Promise<QuestionNote[]>; // Add this (adjust return type if needed)
  updateQuestionNote(noteId: number, noteText: string): Promise<QuestionNote | undefined>; // Add this
  exportNotesToMarkdown(timeFilter?: string, tagFilter?: string): Promise<string>; // Add this

  // Heatmap Feature
  getHeatmapData(year: number, month: number): Promise<DbHeatmapData[]>; // Added heatmap data signature

  // Application Settings
  getAppSettings(): Promise<ApplicationConfiguration | undefined>;
  updateAppSettings(settings: Partial<InsertApplicationConfiguration>): Promise<ApplicationConfiguration | undefined>;
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
      uploadedAt: new Date(),
      isActive: true,
      description: testData.description ?? null,
      difficultyLevel: testData.difficultyLevel ?? null, // Ensure null if undefined
      estimatedTimeMinutes: testData.estimatedTimeMinutes ?? null, // Ensure null if undefined
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
            // Ensure lastAttemptDate is string | null as expected by TestWithStats
            lastAttemptDate = typeof sortedAttempts[0].endTime === 'string'
              ? sortedAttempts[0].endTime
              : (sortedAttempts[0].endTime instanceof Date ? sortedAttempts[0].endTime.toISOString() : null);
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
        isActive: true,
        createdAt: new Date(),
        difficultyLevel: questionData.difficultyLevel ?? null, // Ensure null if undefined
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
        createdAt: new Date(),
        isAIGenerated: tagData.isAIGenerated ?? false, // Ensure false if undefined
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
      startTime: new Date(),
      endTime: null,
      totalTimeSeconds: null,
      completed: false,
      // Add missing properties with defaults
      score: null,
      correctCount: null,
      incorrectCount: null,
      leftCount: null,
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
      // Ensure all required fields from InsertUserAnswer are present and correctly typed
      questionId: answerData.questionId,
      attemptId: answerData.attemptId,
      selectedOption: answerData.selectedOption ?? null,
      isCorrect: answerData.isCorrect ?? null,
      isLeft: answerData.isLeft ?? null,
      answerTimeSeconds: answerData.answerTimeSeconds ?? null,
      // Add other required fields from UserAnswer with defaults
      id,
      attemptNumber: attemptNumber ?? null,
      timestamp: now,
      confidenceLevel: answerData.confidenceLevel ?? null,
      // Add missing boolean flags (assuming nullable, adjust if needed)
      knowledgeFlag: null,
      techniqueFlag: null,
      guessworkFlag: null,
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
      createdAt: now, // Use Date object
      lastReviewedAt: null,
      nextReviewAt: tomorrow, // Use Date object
      easeFactor: 2.5,
      interval: 1,
      reviewCount: 0,
      // Add missing properties with defaults
      difficultyRating: null,
      notes: null,
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
      
    // Ensure the return type matches TestAnalytics from sharedSchema
    return {
      testId: test.id,
      attemptId,
      title: test.title,
      date: dateToString(attempt.startTime) || "",
      totalTimeSeconds: attempt.totalTimeSeconds || 0,
      overallStats: memStats,
      subjectStats,
      attemptQuestionStats: [], // Add empty array to satisfy the type
    };
  }

  async getOverallAnalytics(): Promise<{
    testCount: number;
    attemptCount: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalLeft: number;
    avgTimeSeconds: number;
    totalQuestions?: number;
    accuracy?: number;
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
    
    // Calculate average time
    const totalTimeSeconds = answers.reduce((sum, a) => sum + (a.answerTimeSeconds || 0), 0);
    const avgTimeSeconds = answers.length > 0 ? totalTimeSeconds / answers.length : 0;
    
    // Calculate total questions and accuracy
    const totalQuestions = totalCorrect + totalIncorrect + totalLeft;
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    
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
      avgTimeSeconds,
      totalQuestions,
      accuracy,
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

  // History method (placeholder for MemStorage)
  async getHistory(filter?: string): Promise<TestAnalytics[]> {
    console.warn("MemStorage.getHistory called with filter:", filter, "- Returning empty array.");
    // Basic filtering could be added here if needed for testing MemStorage
    return [];
  }

  // --- Placeholder implementations for new methods ---
  async getWrongAnswers(timeFilter?: string, tagFilter?: string): Promise<UserAnswerWithDetails[]> {
    console.warn("MemStorage.getWrongAnswers called - Returning empty array.");
    return [];
  }

  async addQuestionNote(noteData: InsertQuestionNote): Promise<QuestionNote> {
    console.warn("MemStorage.addQuestionNote called - Returning placeholder.");
    // Create a placeholder note - adjust fields as needed
    const id = Math.floor(Math.random() * 10000); // Placeholder ID
    const placeholderNote: QuestionNote = {
      id: id,
      userAnswerId: noteData.userAnswerId,
      noteText: noteData.noteText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return placeholderNote;
  }

  async getAllNotes(timeFilter?: string, tagFilter?: string): Promise<QuestionNote[]> {
    console.warn("MemStorage.getAllNotes called - Returning empty array.");
    return [];
  }

  async updateQuestionNote(noteId: number, noteText: string): Promise<QuestionNote | undefined> {
    console.warn("MemStorage.updateQuestionNote called - Returning undefined.");
    return undefined; // Placeholder
  }

  async exportNotesToMarkdown(timeFilter?: string, tagFilter?: string): Promise<string> {
    console.warn("MemStorage.exportNotesToMarkdown called - Returning empty string.");
    return "";
  }
  // --- End placeholder implementations ---

  // Heatmap Feature Placeholder
  async getHeatmapData(year: number, month: number): Promise<DbHeatmapData[]> {
    console.warn(`MemStorage.getHeatmapData called for ${year}-${month} - Returning empty array.`);
    return [];
  }

  // Application Settings Placeholders
  async getAppSettings(): Promise<ApplicationConfiguration | undefined> {
    console.warn("MemStorage.getAppSettings called - Returning undefined.");
    // For MemStorage, you might return a default object or manage a single settings object in memory
    return undefined;
  }

  async updateAppSettings(settings: Partial<InsertApplicationConfiguration>): Promise<ApplicationConfiguration | undefined> {
    console.warn("MemStorage.updateAppSettings called - Returning undefined.", settings);
    // For MemStorage, you would update the in-memory settings object and return it
    return undefined;
  }
}

// Removed DatabaseStorage class (PostgreSQL implementation)
// Removed conditional export logic. Storage instance is now provided by database-switcher.ts
