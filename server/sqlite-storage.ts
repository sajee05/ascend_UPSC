import { db } from "./sqlite-db";
import { IStorage } from "./storage";
import * as schema from "../shared/sqlite-schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { logger } from "./logger";

function dateToString(date: Date | string | null): string | null {
  if (!date) return null;
  return typeof date === "string" ? date : date.toISOString();
}

export class SqliteStorage implements IStorage {
  /**
   * Tests
   */
  async createTest(testData: schema.InsertTest): Promise<schema.Test> {
    const result = await db.insert(schema.tests).values({
      ...testData,
    }).returning();
    
    return result[0];
  }

  async getTest(id: number): Promise<schema.Test | undefined> {
    const result = await db.select().from(schema.tests).where(eq(schema.tests.id, id));
    return result[0];
  }

  async deleteTest(id: number): Promise<void> {
    await db.delete(schema.tests).where(eq(schema.tests.id, id));
  }

  async getAllTests(): Promise<schema.TestWithStats[]> {
    const tests = await db.select().from(schema.tests).where(eq(schema.tests.isActive, true));
    
    const result: schema.TestWithStats[] = [];
    
    for (const test of tests) {
      // Get question count
      const questionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.questions)
        .where(eq(schema.questions.testId, test.id));
      
      // Get attempt count
      const attemptCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.attempts)
        .where(eq(schema.attempts.testId, test.id));
      
      // Get subjects for this test
      const subjectRows = await db
        .select({
          subjectName: schema.subjects.name,
        })
        .from(schema.questionSubjects)
        .innerJoin(schema.questions, eq(schema.questionSubjects.questionId, schema.questions.id))
        .innerJoin(schema.subjects, eq(schema.questionSubjects.subjectId, schema.subjects.id))
        .where(eq(schema.questions.testId, test.id))
        .groupBy(schema.subjects.name);
      
      result.push({
        ...test,
        questionCount: questionCount[0]?.count || 0,
        attemptCount: attemptCount[0]?.count || 0,
        subjects: subjectRows.map(row => row.subjectName),
      });
    }
    
    return result;
  }

  /**
   * Questions
   */
  async addQuestionsToTest(questionsData: schema.InsertQuestion[]): Promise<schema.Question[]> {
    if (!questionsData.length) return [];
    
    const result: schema.Question[] = [];
    
    // SQLite doesn't support returning multiple rows, so do it one by one
    for (const questionData of questionsData) {
      const inserted = await db.insert(schema.questions).values(questionData).returning();
      if (inserted.length > 0) {
        result.push(inserted[0]);
      }
    }
    
    return result;
  }

  async getQuestion(id: number): Promise<schema.QuestionWithTags | undefined> {
    const questions = await db.select().from(schema.questions).where(eq(schema.questions.id, id));
    if (!questions.length) return undefined;
    
    const question = questions[0];
    
    // Get tags
    const tags = await db.select().from(schema.tags).where(eq(schema.tags.questionId, id));
    
    // Get subjects
    const subjectRows = await db
      .select({
        subject: schema.subjects,
      })
      .from(schema.questionSubjects)
      .innerJoin(schema.subjects, eq(schema.questionSubjects.subjectId, schema.subjects.id))
      .where(eq(schema.questionSubjects.questionId, id));
    
    // Get topics
    const topicRows = await db
      .select({
        topic: schema.topics,
      })
      .from(schema.questionTopics)
      .innerJoin(schema.topics, eq(schema.questionTopics.topicId, schema.topics.id))
      .where(eq(schema.questionTopics.questionId, id));
    
    return {
      ...question,
      tags,
      subjects: subjectRows.map(row => row.subject),
      topics: topicRows.map(row => row.topic),
    };
  }

  async getQuestionsByTest(testId: number): Promise<schema.QuestionWithTags[]> {
    const questions = await db
      .select()
      .from(schema.questions)
      .where(and(
        eq(schema.questions.testId, testId),
        eq(schema.questions.isActive, true)
      ));
    
    const result: schema.QuestionWithTags[] = [];
    
    for (const question of questions) {
      // Get tags
      const tags = await db.select().from(schema.tags).where(eq(schema.tags.questionId, question.id));
      
      result.push({
        ...question,
        tags,
      });
    }
    
    return result;
  }

  async getAllQuestions(): Promise<schema.QuestionWithTags[]> {
    const questions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.isActive, true));
    
    const result: schema.QuestionWithTags[] = [];
    
    for (const question of questions) {
      // Get tags
      const tags = await db.select().from(schema.tags).where(eq(schema.tags.questionId, question.id));
      
      result.push({
        ...question,
        tags,
      });
    }
    
    return result;
  }

  /**
   * Tags
   */
  async addTagsToQuestion(tagsData: schema.InsertTag[]): Promise<schema.Tag[]> {
    if (!tagsData.length) return [];
    
    const result: schema.Tag[] = [];
    
    // SQLite doesn't support returning multiple rows, so do it one by one
    for (const tagData of tagsData) {
      const inserted = await db.insert(schema.tags).values(tagData).returning();
      if (inserted.length > 0) {
        result.push(inserted[0]);
      }
    }
    
    return result;
  }

  async deleteTag(id: number): Promise<void> {
    await db.delete(schema.tags).where(eq(schema.tags.id, id));
  }

  async getAllTags(): Promise<string[]> {
    const tags = await db
      .select({ tagName: schema.tags.tagName })
      .from(schema.tags)
      .groupBy(schema.tags.tagName);
    
    return tags.map(t => t.tagName);
  }

  /**
   * Attempts
   */
  async createAttempt(attemptData: schema.InsertAttempt): Promise<schema.Attempt> {
    const result = await db.insert(schema.attempts).values({
      ...attemptData,
      completed: false,
    }).returning();
    
    return result[0];
  }

  async getAttempt(id: number): Promise<schema.Attempt | undefined> {
    const result = await db.select().from(schema.attempts).where(eq(schema.attempts.id, id));
    return result[0];
  }

  async getAttemptsByTest(testId: number): Promise<schema.Attempt[]> {
    return await db
      .select()
      .from(schema.attempts)
      .where(eq(schema.attempts.testId, testId))
      .orderBy(desc(schema.attempts.startTime));
  }

  async updateAttempt(id: number, data: Partial<schema.Attempt>): Promise<schema.Attempt | undefined> {
    // Handle date conversion for SQLite
    const sanitizedData: Partial<schema.Attempt> = { ...data };
    if (data.startTime) {
      sanitizedData.startTime = dateToString(data.startTime);
    }
    if (data.endTime) {
      sanitizedData.endTime = dateToString(data.endTime);
    }
    
    const result = await db
      .update(schema.attempts)
      .set(sanitizedData)
      .where(eq(schema.attempts.id, id))
      .returning();
    
    return result[0];
  }

  /**
   * User Answers
   */
  async createUserAnswer(answerData: schema.InsertUserAnswer): Promise<schema.UserAnswer> {
    const result = await db.insert(schema.userAnswers).values(answerData).returning();
    return result[0];
  }

  async getUserAnswersByAttempt(attemptId: number): Promise<schema.UserAnswer[]> {
    return await db
      .select()
      .from(schema.userAnswers)
      .where(eq(schema.userAnswers.attemptId, attemptId));
  }

  async updateUserAnswer(id: number, data: Partial<schema.UserAnswer>): Promise<schema.UserAnswer | undefined> {
    const result = await db
      .update(schema.userAnswers)
      .set(data)
      .where(eq(schema.userAnswers.id, id))
      .returning();
    
    return result[0];
  }

  /**
   * Flashcards
   */
  async createFlashcard(flashcardData: schema.InsertFlashcard): Promise<schema.Flashcard> {
    const result = await db.insert(schema.flashcards).values(flashcardData).returning();
    return result[0];
  }

  async getAllFlashcards(): Promise<(schema.Flashcard & { question: schema.QuestionWithTags })[]> {
    const flashcards = await db.select().from(schema.flashcards);
    const result: (schema.Flashcard & { question: schema.QuestionWithTags })[] = [];
    
    for (const flashcard of flashcards) {
      const question = await this.getQuestion(flashcard.questionId);
      if (question) {
        result.push({
          ...flashcard,
          question,
        });
      }
    }
    
    return result;
  }

  async updateFlashcard(id: number, data: Partial<schema.Flashcard>): Promise<schema.Flashcard | undefined> {
    // Handle date conversion for SQLite
    const sanitizedData: Partial<schema.Flashcard> = { ...data };
    if (data.lastReviewedAt) {
      sanitizedData.lastReviewedAt = dateToString(data.lastReviewedAt);
    }
    if (data.nextReviewAt) {
      sanitizedData.nextReviewAt = dateToString(data.nextReviewAt);
    }
    
    const result = await db
      .update(schema.flashcards)
      .set(sanitizedData)
      .where(eq(schema.flashcards.id, id))
      .returning();
    
    return result[0];
  }

  /**
   * Analytics
   */
  async getTestAnalytics(attemptId: number): Promise<schema.TestAnalytics | undefined> {
    // Get the attempt
    const attempts = await db.select().from(schema.attempts).where(eq(schema.attempts.id, attemptId));
    if (!attempts.length) return undefined;
    
    const attempt = attempts[0];
    
    // Get the test
    const tests = await db.select().from(schema.tests).where(eq(schema.tests.id, attempt.testId));
    if (!tests.length) return undefined;
    
    const test = tests[0];
    
    // Get questions for this test
    const questions = await this.getQuestionsByTest(test.id);
    
    // Get user answers for this attempt
    const userAnswers = await this.getUserAnswersByAttempt(attemptId);
    
    // Calculate subject statistics
    const subjectStats: schema.SubjectStats[] = [];
    
    // Helper function to calculate statistics for a filtered set of answers
    const calculateStats = (filteredAnswers: schema.UserAnswer[]): schema.SubjectStats => {
      const total = filteredAnswers.length;
      const correct = filteredAnswers.filter(a => a.isCorrect).length;
      const incorrect = filteredAnswers.filter(a => a.isCorrect === false).length;
      const left = filteredAnswers.filter(a => a.isLeft).length;
      
      return {
        subjectId: 0, // Will be set later
        name: "", // Will be set later
        totalQuestions: total,
        correctCount: correct,
        incorrectCount: incorrect,
        leftCount: left,
        percentage: total > 0 ? (correct / total) * 100 : 0,
      };
    };
    
    // Get all subjects used in the test
    const subjectRows = await db
      .select({
        subjectId: schema.subjects.id,
        subjectName: schema.subjects.name,
      })
      .from(schema.questionSubjects)
      .innerJoin(schema.questions, eq(schema.questionSubjects.questionId, schema.questions.id))
      .innerJoin(schema.subjects, eq(schema.questionSubjects.subjectId, schema.subjects.id))
      .where(eq(schema.questions.testId, test.id))
      .groupBy(schema.subjects.id, schema.subjects.name);
    
    // Calculate stats for each subject
    for (const { subjectId, subjectName } of subjectRows) {
      // Get questions in this subject
      const subjectQuestionIds = await db
        .select({ questionId: schema.questionSubjects.questionId })
        .from(schema.questionSubjects)
        .where(eq(schema.questionSubjects.subjectId, subjectId));
      
      const questionIds = subjectQuestionIds.map(row => row.questionId);
      
      // Filter answers for these questions
      const subjectAnswers = userAnswers.filter(a => 
        questionIds.includes(a.questionId)
      );
      
      // Calculate statistics
      const stats = calculateStats(subjectAnswers);
      
      subjectStats.push({
        ...stats,
        subjectId,
        name: subjectName,
      });
    }
    
    // Calculate overall statistics
    const timePerQuestion = attempt.totalTimeSeconds 
      ? attempt.totalTimeSeconds / questions.length 
      : 0;
    
    const correctPercentage = userAnswers.length > 0
      ? (userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100
      : 0;
    
    const incorrectPercentage = userAnswers.length > 0
      ? (userAnswers.filter(a => a.isCorrect === false).length / userAnswers.length) * 100
      : 0;
    
    const leftPercentage = userAnswers.length > 0
      ? (userAnswers.filter(a => a.isLeft).length / userAnswers.length) * 100
      : 0;
    
    return {
      attempt,
      test,
      questions,
      userAnswers,
      subjectStats,
      timePerQuestion,
      correctPercentage,
      incorrectPercentage,
      leftPercentage,
    };
  }

  async getOverallAnalytics(): Promise<{
    testCount: number;
    attemptCount: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalLeft: number;
    subjectStats: schema.SubjectStats[];
    trendData: { date: string; accuracy: number; score: number }[];
  }> {
    // Get counts
    const testCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.tests);
    
    const attemptCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.attempts);
    
    // Get all answers
    const allAnswers = await db.select().from(schema.userAnswers);
    
    const totalCorrect = allAnswers.filter(a => a.isCorrect).length;
    const totalIncorrect = allAnswers.filter(a => a.isCorrect === false).length;
    const totalLeft = allAnswers.filter(a => a.isLeft).length;
    
    // Calculate subject statistics
    const subjectStats: schema.SubjectStats[] = [];
    
    // Get all subjects
    const subjects = await db.select().from(schema.subjects);
    
    for (const subject of subjects) {
      // Get questions in this subject
      const subjectQuestionIds = await db
        .select({ questionId: schema.questionSubjects.questionId })
        .from(schema.questionSubjects)
        .where(eq(schema.questionSubjects.subjectId, subject.id));
      
      const questionIds = subjectQuestionIds.map(row => row.questionId);
      
      // Filter answers for these questions
      const subjectAnswers = allAnswers.filter(a => 
        questionIds.includes(a.questionId)
      );
      
      const total = subjectAnswers.length;
      const correct = subjectAnswers.filter(a => a.isCorrect).length;
      const incorrect = subjectAnswers.filter(a => a.isCorrect === false).length;
      const left = subjectAnswers.filter(a => a.isLeft).length;
      
      subjectStats.push({
        subjectId: subject.id,
        name: subject.name,
        totalQuestions: total,
        correctCount: correct,
        incorrectCount: incorrect,
        leftCount: left,
        percentage: total > 0 ? (correct / total) * 100 : 0,
      });
    }
    
    // Calculate trend data (last 10 attempts)
    const recentAttempts = await db
      .select()
      .from(schema.attempts)
      .where(eq(schema.attempts.completed, true))
      .orderBy(desc(schema.attempts.startTime))
      .limit(10);
    
    const trendData: { date: string; accuracy: number; score: number }[] = [];
    
    for (const attempt of recentAttempts) {
      const attemptAnswers = await db
        .select()
        .from(schema.userAnswers)
        .where(eq(schema.userAnswers.attemptId, attempt.id));
      
      const total = attemptAnswers.length;
      const correct = attemptAnswers.filter(a => a.isCorrect).length;
      
      trendData.push({
        date: dateToString(attempt.startTime) || "",
        accuracy: total > 0 ? (correct / total) * 100 : 0,
        score: attempt.score || 0,
      });
    }
    
    // Reverse to get chronological order
    trendData.reverse();
    
    return {
      testCount: testCountResult[0]?.count || 0,
      attemptCount: attemptCountResult[0]?.count || 0,
      totalCorrect,
      totalIncorrect,
      totalLeft,
      subjectStats,
      trendData,
    };
  }

  async getAnkiData(testId: number): Promise<{
    front: string;
    back: string;
    tags: string;
  }[]> {
    const questions = await this.getQuestionsByTest(testId);
    
    return questions.map(q => {
      const tagString = q.tags.map(t => t.tagName).join(' ');
      
      // Simple format for Anki cards
      return {
        front: q.questionText,
        back: `
Correct Answer: ${q.correctAnswer} - ${q['option' + q.correctAnswer.toLowerCase() as 'a' | 'b' | 'c' | 'd']}
${q.explanation ? `\nExplanation: ${q.explanation}` : ''}
        `.trim(),
        tags: tagString,
      };
    });
  }
}