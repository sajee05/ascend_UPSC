import { 
  Attempt, Flashcard, InsertAttempt, InsertFlashcard, InsertQuestion, 
  InsertTag, InsertTest, InsertUserAnswer, Question, QuestionWithTags, 
  SubjectStats, Tag, Test, TestAnalytics, TestWithStats, UserAnswer 
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Tests
  createTest(test: InsertTest): Promise<Test>;
  getTest(id: number): Promise<Test | undefined>;
  getAllTests(): Promise<TestWithStats[]>;
  
  // Questions
  addQuestionsToTest(questions: InsertQuestion[]): Promise<Question[]>;
  getQuestion(id: number): Promise<QuestionWithTags | undefined>;
  getQuestionsByTest(testId: number): Promise<QuestionWithTags[]>;
  
  // Tags
  addTagsToQuestion(tags: InsertTag[]): Promise<Tag[]>;
  deleteTag(id: number): Promise<void>;
  
  // Attempts
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  getAttempt(id: number): Promise<Attempt | undefined>;
  getAttemptsByTest(testId: number): Promise<Attempt[]>;
  updateAttempt(id: number, data: Partial<Attempt>): Promise<Attempt | undefined>;
  
  // User Answers
  createUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer>;
  getUserAnswersByAttempt(attemptId: number): Promise<UserAnswer[]>;
  
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
      uploadedAt: new Date().toISOString(),
    };
    this.tests.set(id, test);
    return test;
  }

  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }

  async getAllTests(): Promise<TestWithStats[]> {
    return Array.from(this.tests.values()).map(test => {
      const testAttempts = Array.from(this.attempts.values()).filter(a => a.testId === test.id);
      
      let bestScore = null;
      let lastAttemptDate = null;
      
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
    const answer: UserAnswer = {
      ...answerData,
      id,
      timestamp: new Date().toISOString(),
    };
    this.userAnswers.set(id, answer);
    
    // If this is an incorrect answer, automatically create a flashcard
    if (answerData.isCorrect === false) {
      this.createFlashcard({ questionId: answerData.questionId });
    }
    
    return answer;
  }

  async getUserAnswersByAttempt(attemptId: number): Promise<UserAnswer[]> {
    return Array.from(this.userAnswers.values())
      .filter(answer => answer.attemptId === attemptId);
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
      createdAt: now.toISOString(),
      lastReviewedAt: null,
      nextReviewAt: tomorrow.toISOString(),
      easeFactor: 2.5,
      interval: 1,
      reviewCount: 0,
    };
    
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async getAllFlashcards(): Promise<(Flashcard & { question: QuestionWithTags })[]> {
    return Array.from(this.flashcards.values()).map(flashcard => {
      const question = this.getQuestion(flashcard.questionId);
      return {
        ...flashcard,
        question: question || { id: 0, testId: 0, questionNumber: 0, questionText: 'Question not found', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', correctAnswerText: '', tags: [] },
      };
    }).filter(f => f.question.id !== 0);
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
    
    return {
      testId: test.id,
      attemptId,
      title: test.title,
      date: attempt.startTime,
      totalTimeSeconds: attempt.totalTimeSeconds || 0,
      overallStats,
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
          date: attempt.startTime,
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

export const storage = new MemStorage();
