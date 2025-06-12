import { db, sqlite } from "./sqlite-db"; // Import the raw sqlite instance
import * as dbSchema from "../shared/sqlite-schema"; // Alias SQLite schema
import * as sharedSchema from "../shared/schema"; // Import shared frontend schema
import { eq, and, or, inArray, sql, desc, SQL, count, getTableColumns, gte, lte } from "drizzle-orm"; // Added SQL type and others
import { extract, groupBy, alias } from "drizzle-orm/sql"; // Moved specific SQL functions
import { logger } from "./logger";

function dateToString(date: Date | string | null): string | null {
  if (!date) return null;
  return typeof date === "string" ? date : date.toISOString();
}

// Define DetailedNote directly in this file for backend use
interface DetailedNote extends dbSchema.QuestionNote {
  testName?: string | null; // Allow null from DB
  tagName?: string | null; // Allow null from DB
}


export class SqliteStorage {
  /**
   * Tests
   */
  async createTest(testData: dbSchema.InsertTest): Promise<dbSchema.Test> {
    const result = await db.insert(dbSchema.tests).values({
      ...testData,
    }).returning();

    return result[0];
  }

  async getTest(id: number): Promise<dbSchema.Test | undefined> {
    const result = await db.select().from(dbSchema.tests).where(eq(dbSchema.tests.id, id));
    return result[0];
  }

  async deleteTest(id: number): Promise<void> {
    logger(`Attempting to delete test with ID: ${id}`, 'sqlite-storage');
    try {
      await db.transaction(async (tx) => {
        // 1. Find associated questions and attempts
        const questionsToDelete = await tx
          .select({ id: dbSchema.questions.id })
          .from(dbSchema.questions)
          .where(eq(dbSchema.questions.testId, id));
        const questionIds = questionsToDelete.map(q => q.id);
        logger(`Found ${questionIds.length} questions associated with test ${id}`, 'sqlite-storage');

        const attemptsToDelete = await tx
          .select({ id: dbSchema.attempts.id })
          .from(dbSchema.attempts)
          .where(eq(dbSchema.attempts.testId, id));
        const attemptIds = attemptsToDelete.map(a => a.id);
        logger(`Found ${attemptIds.length} attempts associated with test ${id}`, 'sqlite-storage');

        // 2. Delete dependent records in order

        // Delete QuestionNotes associated with UserAnswers
        if (attemptIds.length > 0) {
            const userAnswersToDelete = await tx
                .select({ id: dbSchema.userAnswers.id })
                .from(dbSchema.userAnswers)
                .where(inArray(dbSchema.userAnswers.attemptId, attemptIds));
            const userAnswerIds = userAnswersToDelete.map(ua => ua.id);
            if (userAnswerIds.length > 0) {
                logger(`Deleting question notes for user answers: ${userAnswerIds.join(', ')}`, 'sqlite-storage');
                await tx.delete(dbSchema.questionNotes).where(inArray(dbSchema.questionNotes.userAnswerId, userAnswerIds));
            }
        }


        // Delete UserAnswers associated with attempts
        if (attemptIds.length > 0) {
          logger(`Deleting user answers for attempts: ${attemptIds.join(', ')}`, 'sqlite-storage');
          await tx.delete(dbSchema.userAnswers).where(inArray(dbSchema.userAnswers.attemptId, attemptIds));
        }

        // Delete Attempts associated with the test
        if (attemptIds.length > 0) {
           logger(`Deleting attempts for test ${id}`, 'sqlite-storage');
          await tx.delete(dbSchema.attempts).where(eq(dbSchema.attempts.testId, id));
        }

        if (questionIds.length > 0) {
          // Delete Tags associated with questions
          logger(`Deleting tags for questions: ${questionIds.join(', ')}`, 'sqlite-storage');
          await tx.delete(dbSchema.tags).where(inArray(dbSchema.tags.questionId, questionIds));

          // Delete Flashcards associated with questions
          logger(`Deleting flashcards for questions: ${questionIds.join(', ')}`, 'sqlite-storage');
          await tx.delete(dbSchema.flashcards).where(inArray(dbSchema.flashcards.questionId, questionIds));

          // Delete QuestionSubjects (if used)
          logger(`Deleting questionSubjects for questions: ${questionIds.join(', ')}`, 'sqlite-storage');
          await tx.delete(dbSchema.questionSubjects).where(inArray(dbSchema.questionSubjects.questionId, questionIds));

          // Delete QuestionTopics (if used)
           logger(`Deleting questionTopics for questions: ${questionIds.join(', ')}`, 'sqlite-storage');
          await tx.delete(dbSchema.questionTopics).where(inArray(dbSchema.questionTopics.questionId, questionIds));

          // Delete Questions associated with the test
          logger(`Deleting questions for test ${id}`, 'sqlite-storage');
          await tx.delete(dbSchema.questions).where(eq(dbSchema.questions.testId, id));
        }

        // 3. Finally, delete the test itself
        logger(`Deleting test record ${id}`, 'sqlite-storage');
        const deleteResult = await tx.delete(dbSchema.tests).where(eq(dbSchema.tests.id, id)).returning();

        if (deleteResult.length === 0) {
           logger(`Test with ID ${id} not found for deletion.`, 'sqlite-storage');
           // Optionally throw an error or handle as needed
        } else {
           logger(`Successfully deleted test with ID: ${id}`, 'sqlite-storage');
        }
      });
    } catch (error) {
        logger(`Error deleting test ID ${id}: ${error}`, 'sqlite-storage'); // Removed 'error' level
        // Re-throw the error so the route handler catches it
        throw error;
    }
  }

  async getAllTests(): Promise<dbSchema.TestWithStats[]> {
    const tests = await db.select().from(dbSchema.tests).where(eq(dbSchema.tests.isActive, true));

    const result: dbSchema.TestWithStats[] = [];

    for (const test of tests) {
      try { // Add try block for individual test processing
        // Get question count
        const questionCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(dbSchema.questions)
          .where(eq(dbSchema.questions.testId, test.id));

        // Get attempt count
        const attemptCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(dbSchema.attempts)
          .where(eq(dbSchema.attempts.testId, test.id));

        // Get subjects for this test
        const subjectRows = await db
          .selectDistinct({ // Use distinct to avoid duplicates if a question has multiple subjects
            subjectName: dbSchema.subjects.name,
          })
          .from(dbSchema.questionSubjects)
          .innerJoin(dbSchema.questions, eq(dbSchema.questionSubjects.questionId, dbSchema.questions.id))
          .innerJoin(dbSchema.subjects, eq(dbSchema.questionSubjects.subjectId, dbSchema.subjects.id))
          .where(eq(dbSchema.questions.testId, test.id));


        result.push({
          ...test,
          questionCount: questionCountResult[0]?.count || 0,
          attemptCount: attemptCountResult[0]?.count || 0,
          subjects: subjectRows.map(row => row.subjectName),
        });
      } catch (error) { // Add catch block
        logger(`Error processing test ID ${test.id} in getAllTests: ${error}`, 'sqlite-storage');
        // Optionally skip this test or add a placeholder with error info
        // For now, just log and continue to see if other tests load
      }
    }

    return result;
  }

  /**
   * Questions
   */
  async addQuestionsToTest(questionsData: dbSchema.InsertQuestion[]): Promise<dbSchema.Question[]> {
    if (!questionsData.length) return [];

    const result: dbSchema.Question[] = [];

    // SQLite doesn't support returning multiple rows reliably, insert one by one
    for (const questionData of questionsData) {
      const inserted = await db.insert(dbSchema.questions).values(questionData).returning();
      if (inserted.length > 0) {
        result.push(inserted[0]);
      }
    }

    return result;
  }

  async getQuestion(id: number): Promise<dbSchema.QuestionWithTags | undefined> {
    const questions = await db.select().from(dbSchema.questions).where(eq(dbSchema.questions.id, id));
    if (!questions.length) return undefined;

    const question = questions[0];

    // Get tags
    const tags = await db.select().from(dbSchema.tags).where(eq(dbSchema.tags.questionId, id));

    // Get subjects
    const subjectRows = await db
      .select({
        subject: dbSchema.subjects,
      })
      .from(dbSchema.questionSubjects)
      .innerJoin(dbSchema.subjects, eq(dbSchema.questionSubjects.subjectId, dbSchema.subjects.id))
      .where(eq(dbSchema.questionSubjects.questionId, id));

    // Get topics
    const topicRows = await db
      .select({
        topic: dbSchema.topics,
      })
      .from(dbSchema.questionTopics)
      .innerJoin(dbSchema.topics, eq(dbSchema.questionTopics.topicId, dbSchema.topics.id))
      .where(eq(dbSchema.questionTopics.questionId, id));

    return {
      ...question,
      tags,
      subjects: subjectRows.map(row => row.subject),
      topics: topicRows.map(row => row.topic),
    };
  }

  async getQuestionsByTest(testId: number): Promise<dbSchema.QuestionWithTags[]> {
    const questions = await db
      .select()
      .from(dbSchema.questions)
      .where(and(
        eq(dbSchema.questions.testId, testId),
        eq(dbSchema.questions.isActive, true)
      ));

    const result: dbSchema.QuestionWithTags[] = [];

    for (const question of questions) {
      // Get tags
      const tags = await db.select().from(dbSchema.tags).where(eq(dbSchema.tags.questionId, question.id));

      result.push({
        ...question,
        questionNumber: question.questionNumber, // Ensure questionNumber is included
        tags,
      });
    }

    return result;
  }

  async getAllQuestions(): Promise<dbSchema.QuestionWithTags[]> {
    const questions = await db
      .select()
      .from(dbSchema.questions)
      .where(eq(dbSchema.questions.isActive, true));

    const result: dbSchema.QuestionWithTags[] = [];

    for (const question of questions) {
      // Get tags
      const tags = await db.select().from(dbSchema.tags).where(eq(dbSchema.tags.questionId, question.id));

      result.push({
        ...question,
        questionNumber: question.questionNumber, // Ensure questionNumber is included
        tags,
      });
    }

    return result;
  }

  /**
   * Tags
   */
  async addTagsToQuestion(tagsData: dbSchema.InsertTag[]): Promise<dbSchema.Tag[]> {
    if (!tagsData.length) return [];

    const result: dbSchema.Tag[] = [];

    // SQLite doesn't support returning multiple rows reliably, insert one by one
    for (const tagData of tagsData) {
      const inserted = await db.insert(dbSchema.tags).values(tagData).returning();
      if (inserted.length > 0) {
        result.push(inserted[0]);
      }
    }

    return result;
  }

  async deleteTag(id: number): Promise<void> {
    await db.delete(dbSchema.tags).where(eq(dbSchema.tags.id, id));
  }

  async getAllTags(): Promise<string[]> {
    const tags = await db
      .select({ tagName: dbSchema.tags.tagName })
      .from(dbSchema.tags)
      .groupBy(dbSchema.tags.tagName);

    return tags.map(t => t.tagName);
  }

  /**
   * Attempts
   */
  async createAttempt(attemptData: dbSchema.InsertAttempt): Promise<dbSchema.Attempt> {
    const result = await db.insert(dbSchema.attempts).values({
      ...attemptData,
      completed: false, // SQLite uses integer for boolean
    }).returning();

    return result[0];
  }

  async getAttempt(id: number): Promise<dbSchema.Attempt | undefined> {
    const result = await db.select().from(dbSchema.attempts).where(eq(dbSchema.attempts.id, id));
    return result[0];
  }

  async getAttemptsByTest(testId: number): Promise<dbSchema.Attempt[]> {
    return await db
      .select()
      .from(dbSchema.attempts)
      .where(eq(dbSchema.attempts.testId, testId))
      .orderBy(desc(dbSchema.attempts.startTime));
  }

  async updateAttempt(id: number, data: Partial<dbSchema.Attempt>): Promise<dbSchema.Attempt | undefined> {
    // Create the object to set, converting dates as needed
    const updatePayload: Record<string, any> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key as keyof typeof data];
            if (key === 'startTime' || key === 'endTime') {
                // Use a safer check for Date-like objects
                if (value && typeof value === 'object' && typeof (value as Date).toISOString === 'function') {
                    const dateString = (value as Date).toISOString(); // Cast to Date after check
                    updatePayload[key] = dateString;
                } else if (value === null && key === 'endTime') {
                     updatePayload[key] = null; // Allow setting endTime to null
                } else if (typeof value === 'string') {
                     // Assume string is already correct format if provided
                     updatePayload[key] = value;
                }
                // Skip if undefined, null for startTime, or invalid type
            } else {
                // Copy other properties directly
                updatePayload[key] = value;
            }
        }
    }

    if (Object.keys(updatePayload).length === 0) {
        // No valid fields to update, return current state or handle as error
        logger(`No valid fields to update for attempt ${id}`, 'storage');
        return this.getAttempt(id);
    }

    const result = await db
      .update(dbSchema.attempts)
      .set(updatePayload) // Use the constructed payload
      .where(eq(dbSchema.attempts.id, id))
      .returning();

    return result[0];
  }

  /**
   * User Answers
   */
  async createUserAnswer(answerData: dbSchema.InsertUserAnswer): Promise<dbSchema.UserAnswer> {
    const result = await db.insert(dbSchema.userAnswers).values(answerData).returning();
    return result[0];
  }

  async getUserAnswersByAttempt(attemptId: number): Promise<dbSchema.UserAnswer[]> {
    return await db
      .select()
      .from(dbSchema.userAnswers)
      .where(eq(dbSchema.userAnswers.attemptId, attemptId));
  }

  async updateUserAnswer(id: number, data: Partial<dbSchema.UserAnswer>): Promise<dbSchema.UserAnswer | undefined> {
    const result = await db
      .update(dbSchema.userAnswers)
      .set(data)
      .where(eq(dbSchema.userAnswers.id, id))
      .returning();

    return result[0];
  }

  /**
   * Flashcards
   */
  async createFlashcard(flashcardData: dbSchema.InsertFlashcard): Promise<dbSchema.Flashcard> {
    const result = await db.insert(dbSchema.flashcards).values(flashcardData).returning();
    return result[0];
  }

  async getAllFlashcards(): Promise<(dbSchema.Flashcard & { question: dbSchema.QuestionWithTags })[]> {
    const flashcards = await db.select().from(dbSchema.flashcards);
    const result: (dbSchema.Flashcard & { question: dbSchema.QuestionWithTags })[] = [];

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

  async updateFlashcard(id: number, data: Partial<dbSchema.Flashcard>): Promise<dbSchema.Flashcard | undefined> {
    // Handle date conversion for SQLite
    const sanitizedData: Partial<dbSchema.Flashcard> = { ...data };
    if (data.lastReviewedAt) {
      sanitizedData.lastReviewedAt = dateToString(data.lastReviewedAt);
    }
    if (data.nextReviewAt) {
      sanitizedData.nextReviewAt = dateToString(data.nextReviewAt);
    }

    const result = await db
      .update(dbSchema.flashcards)
      .set(sanitizedData)
      .where(eq(dbSchema.flashcards.id, id))
      .returning();

    return result[0];
  }

  /**
   * Analytics
   */
  async getTestAnalytics(attemptId: number): Promise<sharedSchema.TestAnalytics | undefined> {
    logger(`Fetching analytics for attempt ID: ${attemptId}`, 'sqlite-storage');

    // 1. Get Attempt and Test Info
    const attemptResult = await db.select().from(dbSchema.attempts).where(eq(dbSchema.attempts.id, attemptId));
    if (!attemptResult.length) {
      logger(`Attempt ${attemptId} not found`, 'sqlite-storage');
      return undefined;
    }
    const attempt = attemptResult[0];

    const testResult = await db.select().from(dbSchema.tests).where(eq(dbSchema.tests.id, attempt.testId));
    if (!testResult.length) {
      logger(`Test ${attempt.testId} for attempt ${attemptId} not found`, 'sqlite-storage');
      return undefined; // Or handle as appropriate
    }
    const test = testResult[0];

    // 2. Get User Answers for this attempt
    const userAnswers = await db.select().from(dbSchema.userAnswers).where(eq(dbSchema.userAnswers.attemptId, attemptId));
    logger(`Found ${userAnswers.length} answers for attempt ${attemptId}`, 'sqlite-storage');

    const questionIdsInAttempt = [...new Set(userAnswers.map(a => a.questionId))];
    if (questionIdsInAttempt.length === 0) {
        logger(`No questions answered in attempt ${attemptId}. Returning basic info.`, 'sqlite-storage');
        // Return minimal analytics if no questions were answered
        const minimalOverallStats: sharedSchema.SubjectStats = {
            subject: 'Overall', // Use string 'Overall' for the main stats object
            attempts: 0, correct: 0, incorrect: 0, left: 0, score: 0, accuracy: 0, personalBest: 0, avgTimeSeconds: 0,
            confidenceHigh: 0, confidenceMid: 0, confidenceLow: 0, knowledgeYes: 0, techniqueYes: 0, guessworkYes: 0,
            firstAttemptCorrect: 0, secondAttemptCorrect: 0, thirdPlusAttemptCorrect: 0, attemptDistribution: {}, dataPoints: [], topicBreakdown: [], totalQuestions: 0
        };
        // Ensure the returned object matches sharedSchema.TestAnalytics
        return {
            testId: test.id,
            attemptId: attempt.id,
            title: test.name, // Use test.name from sqlite-schema
            date: dateToString(attempt.startTime) || new Date().toISOString(),
            totalTimeSeconds: attempt.totalTimeSeconds ?? 0,
            overallStats: minimalOverallStats,
            subjectStats: [],
            attemptQuestionStats: []
        };
    }


    // 3. Get Questions details (including text, options, etc.) for questions in this attempt
    const questionsData = await db.select().from(dbSchema.questions).where(inArray(dbSchema.questions.id, questionIdsInAttempt));
    const questionsMap = new Map(questionsData.map(q => [q.id, q]));
    logger(`Fetched details for ${questionsData.length} questions in attempt ${attemptId}`, 'sqlite-storage');

    // 4. Get Tags for questions in this attempt
    const tagsData = await db.select().from(dbSchema.tags).where(inArray(dbSchema.tags.questionId, questionIdsInAttempt));
    const tagsMap = new Map<number, string[]>();
    tagsData.forEach(tag => {
      const list = tagsMap.get(tag.questionId) || [];
      list.push(tag.tagName);
      tagsMap.set(tag.questionId, list);
    });
    logger(`Fetched tags for ${tagsMap.size} questions in attempt ${attemptId}`, 'sqlite-storage');

    // 5. Get Subject/Topic mappings for questions in this attempt
    const questionSubjectsData = await db
      .select({
        questionId: dbSchema.questionSubjects.questionId,
        subjectId: dbSchema.subjects.id,
        subjectName: dbSchema.subjects.name,
        // Select all fields from subjects table to create the Subject object
        subjectDescription: dbSchema.subjects.description,
        subjectSortOrder: dbSchema.subjects.sortOrder,
        subjectIsActive: dbSchema.subjects.isActive,
        subjectCreatedAt: dbSchema.subjects.createdAt,
      })
      .from(dbSchema.questionSubjects)
      .innerJoin(dbSchema.subjects, eq(dbSchema.questionSubjects.subjectId, dbSchema.subjects.id))
      .where(inArray(dbSchema.questionSubjects.questionId, questionIdsInAttempt));

    const questionSubjectsMap = new Map<number, sharedSchema.Subject[]>(); // Store full Subject objects
    questionSubjectsData.forEach(qs => {
      const list = questionSubjectsMap.get(qs.questionId) || [];
      // Create Subject object matching sharedSchema.Subject
      const subjectObj: sharedSchema.Subject = {
          id: qs.subjectId,
          name: qs.subjectName,
          description: qs.subjectDescription,
          sortOrder: qs.subjectSortOrder,
          isActive: qs.subjectIsActive,
          // Ensure createdAt is a Date object
          createdAt: qs.subjectCreatedAt ? new Date(qs.subjectCreatedAt) : new Date(),
      };
      list.push(subjectObj);
      questionSubjectsMap.set(qs.questionId, list);
    });
    logger(`Fetched subjects for ${questionSubjectsMap.size} questions in attempt ${attemptId}`, 'sqlite-storage');

    // --- Calculations ---

    // 6. Calculate AttemptQuestionStat[]
    const attemptQuestionStats: sharedSchema.AttemptQuestionStat[] = userAnswers.map(ua => {
      const question = questionsMap.get(ua.questionId);
      const status: 'correct' | 'incorrect' | 'unanswered' = ua.isLeft ? 'unanswered' : (ua.isCorrect ? 'correct' : 'incorrect');

      // Map confidence integer (assuming 1=low, 2=mid, 3=high) to string
      let confidenceString: 'high' | 'mid' | 'low' | null = null;
      // Adjust mapping based on actual confidence scale (e.g., 1-5 or 1-3)
      if (ua.confidence === 3) confidenceString = 'high'; // Example: Adjust if scale is 1-5
      else if (ua.confidence === 2) confidenceString = 'mid';
      else if (ua.confidence === 1) confidenceString = 'low';

      const meta: sharedSchema.AttemptQuestionStat['meta'] = {
        knowledge: ua.knowledgeFlag === true ? 'yes' : (ua.knowledgeFlag === false ? 'no' : null),
        technique: ua.techniqueFlag === true ? 'yes' : (ua.techniqueFlag === false ? 'no' : null),
        guess: ua.guessworkFlag === true ? 'yes' : (ua.guessworkFlag === false ? 'no' : null),
        confidence: confidenceString, // Use mapped string
      };

      return {
        questionId: ua.questionId,
        questionNumber: question?.questionNumber ?? 0, // Use correct field name
        status: status,
        tags: tagsMap.get(ua.questionId) || [],
        meta: meta,
      };
    });
    logger(`Calculated ${attemptQuestionStats.length} attemptQuestionStats for attempt ${attemptId}`, 'sqlite-storage');


    // 7. Helper function to calculate SubjectStats from a list of UserAnswers
    const calculateSubjectStats = (answers: dbSchema.UserAnswer[], subjectIdentifier: string | sharedSchema.Subject): sharedSchema.SubjectStats => {
        const total = answers.length;
        const correct = answers.filter(a => a.isCorrect).length;
        const incorrect = answers.filter(a => !a.isCorrect && !a.isLeft).length;
        const left = answers.filter(a => a.isLeft).length;
        const attempted = correct + incorrect;

        // Use correct confidence field 'confidence' and map values
        const confidenceHigh = answers.filter(a => a.confidence === 3).length; // Assuming 3 = high
        const confidenceMid = answers.filter(a => a.confidence === 2).length;  // Assuming 2 = mid
        const confidenceLow = answers.filter(a => a.confidence === 1).length;   // Assuming 1 = low

        const knowledgeYes = answers.filter(a => a.knowledgeFlag === true).length;
        const techniqueYes = answers.filter(a => a.techniqueFlag === true).length;
        const guessworkYes = answers.filter(a => a.guessworkFlag === true).length;

        // Use correct time field 'answerTime'
        const answersWithTime = answers.filter(a => a.answerTime !== null && a.answerTime > 0);
        const totalTime = answersWithTime.reduce((sum, a) => sum + (a.answerTime || 0), 0);
        const avgTimeSeconds = answersWithTime.length > 0 ? totalTime / answersWithTime.length : 0;

        // TODO: Make scoring configurable
        const score = (correct * 2) - (incorrect * 0.66);

        // Ensure the returned object matches sharedSchema.SubjectStats
        return {
            subject: subjectIdentifier, // Pass subject object or string 'Overall'
            subjectId: typeof subjectIdentifier !== 'string' ? subjectIdentifier.id : undefined,
            name: typeof subjectIdentifier !== 'string' ? subjectIdentifier.name : undefined,
            attempts: total, // Total questions for this subject/overall in the attempt
            correct,
            incorrect,
            left,
            score,
            accuracy: attempted > 0 ? (correct / attempted) * 100 : 0,
            personalBest: 0, // Needs historical data - potentially add later
            avgTimeSeconds,
            confidenceHigh,
            confidenceMid,
            confidenceLow,
            knowledgeYes,
            techniqueYes,
            guessworkYes,
            // Optional fields - can be added if needed
            firstAttemptCorrect: 0, // Needs historical data
            secondAttemptCorrect: 0, // Needs historical data
            thirdPlusAttemptCorrect: 0, // Needs historical data
            attemptDistribution: {}, // Needs historical data
            dataPoints: [], // Trend data usually belongs to overall analytics, not single test
            topicBreakdown: [], // Requires topic mapping and calculation
            totalQuestions: total, // Total questions for this subject/overall
        };
    };

    // 8. Calculate Overall Stats
    const overallStats = calculateSubjectStats(userAnswers, 'Overall');
    logger(`Calculated overallStats for attempt ${attemptId}`, 'sqlite-storage');

    // 9. Calculate Subject Stats
    const subjectStatsMap = new Map<number, dbSchema.UserAnswer[]>();
    const uniqueSubjects = new Map<number, sharedSchema.Subject>(); // Store unique Subject objects

    userAnswers.forEach(ua => {
      const subjectsForQuestion = questionSubjectsMap.get(ua.questionId) || [];
      subjectsForQuestion.forEach(subject => {
        if (!uniqueSubjects.has(subject.id)) {
            uniqueSubjects.set(subject.id, subject); // Store the full subject object
        }
        const list = subjectStatsMap.get(subject.id) || [];
        list.push(ua);
        subjectStatsMap.set(subject.id, list);
      });
    });

    const subjectStats: sharedSchema.SubjectStats[] = [];
    uniqueSubjects.forEach((subjectObj, subjectId) => {
        const answersForSubject = subjectStatsMap.get(subjectId) || [];
        if (answersForSubject.length > 0) {
            // Pass the full subject object
            subjectStats.push(calculateSubjectStats(answersForSubject, subjectObj));
        }
    });
    logger(`Calculated ${subjectStats.length} subjectStats for attempt ${attemptId}`, 'sqlite-storage');


    // 10. Assemble final TestAnalytics object matching sharedSchema.TestAnalytics
    const finalAnalytics: sharedSchema.TestAnalytics = {
      testId: test.id,
      attemptId: attempt.id,
      title: test.name, // Use 'name' from sqlite schema for title
      date: dateToString(attempt.startTime) || new Date().toISOString(), // Ensure date is string
      totalTimeSeconds: attempt.totalTimeSeconds ?? 0,
      overallStats: overallStats,
      subjectStats: subjectStats,
      attemptQuestionStats: attemptQuestionStats,
    };

    logger(`Successfully assembled analytics for attempt ${attemptId}`, 'sqlite-storage');
    return finalAnalytics;
  }

  async getOverallAnalytics(): Promise<{
    testCount: number;
    attemptCount: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalLeft: number;
    tagStats: dbSchema.TagStats[]; // Changed from SubjectStats
    trendData: { date: string; accuracy: number; score: number }[];
    accuracy: number; // Added missing fields
    avgTimeSeconds: number; // Added missing fields
  }> {
    // Get counts
    const testCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(dbSchema.tests);

    const attemptCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(dbSchema.attempts);

    // Get all answers
    const allAnswers = await db.select().from(dbSchema.userAnswers);

    const totalCorrect = allAnswers.filter(a => a.isCorrect).length;
    const totalIncorrect = allAnswers.filter(a => !a.isCorrect && !a.isLeft).length; // Corrected logic
    const totalLeft = allAnswers.filter(a => a.isLeft).length;

    // Calculate statistics per tag
    const tagStats: dbSchema.TagStats[] = []; // Use TagStats type from dbSchema

    // Get all unique tag names from the database
    const allTagsResult = await db
        .selectDistinct({ tagName: dbSchema.tags.tagName })
        .from(dbSchema.tags);
    const uniqueTagNames = allTagsResult.map(t => t.tagName);
    logger(`[getOverallAnalytics] Unique tags found: ${JSON.stringify(uniqueTagNames)}`, 'sqlite-storage');

    for (const tagName of uniqueTagNames) {
        // Get all question IDs associated with this tag
        const tagQuestionIds = await db
            .select({ questionId: dbSchema.tags.questionId })
            .from(dbSchema.tags)
            .where(eq(dbSchema.tags.tagName, tagName));

        const questionIdsForTag = tagQuestionIds.map(row => row.questionId);

        // Filter all answers based on these question IDs
        const tagAnswers = allAnswers.filter(a =>
            questionIdsForTag.includes(a.questionId)
        );

        if (tagAnswers.length > 0) {
            const total = tagAnswers.length;
            const correct = tagAnswers.filter(a => a.isCorrect).length;
            const incorrect = tagAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
            const left = tagAnswers.filter(a => a.isLeft).length;
            const attempted = correct + incorrect;

            // Calculate other stats (placeholders for now, needs full calculation logic)
            const avgTime = 0; // Placeholder
            const score = 0; // Placeholder
            const highConfidencePercent = 0; // Placeholder
            const mediumConfidencePercent = 0; // Placeholder
            const lowConfidencePercent = 0; // Placeholder
            const knowledgePercent = 0; // Placeholder
            const techniquePercent = 0; // Placeholder
            const guessworkPercent = 0; // Placeholder


            // Push stats with tag name - Adapt structure to dbSchema.TagStats
             tagStats.push({
                tag: tagName, // Use 'tag' field name
                attempts: total, // Use 'attempts' field name
                correct: correct,
                incorrect: incorrect,
                left: left,
                accuracy: attempted > 0 ? (correct / attempted) * 100 : 0,
                // Add other fields as defined in dbSchema.TagStats
                avgTime: avgTime,
                score: score,
                highConfidencePercent: highConfidencePercent,
                mediumConfidencePercent: mediumConfidencePercent,
                lowConfidencePercent: lowConfidencePercent,
                knowledgePercent: knowledgePercent,
                techniquePercent: techniquePercent,
                guessworkPercent: guessworkPercent,
            });
        }
    }
    logger(`[getOverallAnalytics] Calculated tagStats: ${JSON.stringify(tagStats)}`, 'sqlite-storage');

    // Calculate trend data (last 10 attempts)
    const recentAttempts = await db
      .select()
      .from(dbSchema.attempts)
      .where(eq(dbSchema.attempts.completed, true))
      .orderBy(desc(dbSchema.attempts.startTime))
      .limit(10);

    const trendData: { date: string; accuracy: number; score: number }[] = [];

    for (const attempt of recentAttempts) {
      const attemptAnswers = await db
        .select()
        .from(dbSchema.userAnswers)
        .where(eq(dbSchema.userAnswers.attemptId, attempt.id));

      const total = attemptAnswers.length;
      const correct = attemptAnswers.filter(a => a.isCorrect).length;
      const attempted = attemptAnswers.filter(a => !a.isLeft).length; // Count only attempted

      trendData.push({
        date: dateToString(attempt.startTime) || "",
        accuracy: attempted > 0 ? (correct / attempted) * 100 : 0, // Accuracy based on attempted
        score: attempt.score || 0,
      });
    }

    // Reverse to get chronological order
    trendData.reverse();

    // Calculate aggregate analytics metrics
    const accuracy = (totalCorrect + totalIncorrect) > 0 ? (totalCorrect / (totalCorrect + totalIncorrect)) * 100 : 0; // Accuracy based on attempted

    // Calculate average time using the correct column 'answerTime'
    const answersWithTime = allAnswers.filter(a => a.answerTime !== null && a.answerTime > 0);
    const totalTime = answersWithTime.reduce((sum, a) => sum + (a.answerTime || 0), 0);
    const avgTimeSeconds = answersWithTime.length > 0 ? totalTime / answersWithTime.length : 0;


    return {
      testCount: testCountResult[0]?.count || 0,
      attemptCount: attemptCountResult[0]?.count || 0,
      totalCorrect,
      totalIncorrect,
      totalLeft,
      accuracy,
      avgTimeSeconds,
      tagStats, // Use tagStats instead of subjectStats
      trendData,
    };
  }

  async getAnkiData(testId: number): Promise<{
    front: string;
    back: string;
    tags: string;
  }[]> {
    const questions = await this.getQuestionsByTest(testId);

    return questions.map((q, index) => { // Add index parameter
      const tagString = q.tags.map(t => t.tagName).join(' ');
      const questionNumber = q.questionNumber ?? (index + 1); // Use questionNumber if available

      // Format the answer option text
      const correctAnswerLetter = q.correctAnswer.toUpperCase(); // e.g., 'A'
      const correctAnswerText = q[`option${correctAnswerLetter}` as keyof typeof q] ?? ''; // e.g., 'xyz'
      const formattedAnswer = `Ans: ${correctAnswerLetter}. ${correctAnswerText}`;

      // Simple format for Anki cards
      return {
        front: `Q${questionNumber}. ${q.questionText}`, // Add Q number
        back: `${formattedAnswer}\n${q.explanation ? `\nExplanation: ${q.explanation}` : ''}`.trim(), // Use formatted answer
        tags: tagString,
      };
    });
  }

  /**
   * History
   */
  async getHistory(filter?: string): Promise<sharedSchema.TestAnalytics[]> {
    logger(`Fetching history with filter: ${filter || 'all time'}`, 'sqlite-storage');

    // Base query selecting only ID for filtering
    let baseQueryBuilder = db
      .select({ id: dbSchema.attempts.id })
      .from(dbSchema.attempts);

    const conditions: SQL[] = [eq(dbSchema.attempts.completed, true)]; // Start with base condition

    // Apply date filtering based on the 'filter' parameter
    if (filter && filter !== 'all time') {
        const now = new Date();
        let startDate: Date | null = null;

        switch (filter) {
            case '2 days':
                startDate = new Date(now.setDate(now.getDate() - 1)); // Today and yesterday
                startDate.setHours(0, 0, 0, 0); // Start of yesterday
                break;
            case '3 days':
                 startDate = new Date(now.setDate(now.getDate() - 2)); // Today, yesterday, day before
                 startDate.setHours(0, 0, 0, 0); // Start of day before yesterday
                break;
            case 'Week':
                const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
                // Assuming week starts on Sunday
                startDate = new Date(now.setDate(now.getDate() - dayOfWeek));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'Month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
                break;
            case '3 months':
                 // Start from beginning of the month 3 months ago
                 startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
        }

        if (startDate) {
            // Add the date condition to the conditions array
            conditions.push(sql`${dbSchema.attempts.startTime} >= ${startDate.toISOString()}`);
            logger(`Applying history filter: Start Date >= ${startDate.toISOString()}`, 'sqlite-storage');
        }
    }


    // Apply conditions
    const finalBaseQuery = baseQueryBuilder.where(and(...conditions)); // Apply all conditions

    // Add ordering and execute the query
    const completedAttempts = await finalBaseQuery.orderBy(desc(dbSchema.attempts.startTime));
    logger(`Found ${completedAttempts.length} completed attempts matching filter`, 'sqlite-storage');

    const historyAnalytics: sharedSchema.TestAnalytics[] = [];

    // Fetch full analytics for each relevant attempt ID
    // This could still be slow if there are many attempts; consider pagination or more optimized queries later.
    for (const attemptInfo of completedAttempts) {
      const analytics = await this.getTestAnalytics(attemptInfo.id);
      if (analytics) {
        historyAnalytics.push(analytics);
      } else {
         logger(`Could not fetch analytics for historical attempt ID: ${attemptInfo.id}`, 'sqlite-storage');
      }
    }

    logger(`Returning ${historyAnalytics.length} history items`, 'sqlite-storage');
    // Already sorted by startTime descending from the initial query
    return historyAnalytics;
  }

  // --- Start of new methods ---

  /**
   * Wrongs Feature
   */
  async getWrongAnswers(
    timeFilter?: string,
    tagFilter?: string,
    filterType?: 'Wrongs' | 'No knowledge' | 'Tukke' | 'Low confidence' | 'Medium confidence'
  ): Promise<dbSchema.UserAnswerWithDetails[]> {
    logger(`Fetching filtered answers with timeFilter: ${timeFilter}, tagFilter: ${tagFilter}, filterType: ${filterType || 'Wrongs'}`, 'sqlite-storage');

    // Base query definition
    let queryBuilder = db.select({
        userAnswer: dbSchema.userAnswers,
        question: dbSchema.questions,
        test: dbSchema.tests,
        attempt: dbSchema.attempts,
      })
      .from(dbSchema.userAnswers)
      .innerJoin(dbSchema.questions, eq(dbSchema.userAnswers.questionId, dbSchema.questions.id))
      .innerJoin(dbSchema.attempts, eq(dbSchema.userAnswers.attemptId, dbSchema.attempts.id))
      .innerJoin(dbSchema.tests, eq(dbSchema.attempts.testId, dbSchema.tests.id))
      .leftJoin(dbSchema.tags, eq(dbSchema.userAnswers.questionId, dbSchema.tags.questionId)); // Join tags for potential filtering

    const conditions: SQL[] = [
        eq(dbSchema.questions.isActive, true) // Base condition: question must be active
    ];

    // Apply primary filter based on filterType
    // Only apply the isCorrect=false filter if the type is explicitly 'Wrongs'
    if (filterType === 'Wrongs' || !filterType) {
         conditions.push(eq(dbSchema.userAnswers.isCorrect, false));
    } else {
        // For other filter types, apply the specific flag/confidence condition
        switch (filterType) {
            case 'No knowledge':
                conditions.push(eq(dbSchema.userAnswers.knowledgeFlag, false)); // Assuming false means 'NO'
                break;
            case 'Tukke':
                conditions.push(eq(dbSchema.userAnswers.guessworkFlag, true)); // Assuming true means 'YES'
                break;
            case 'Low confidence':
                conditions.push(eq(dbSchema.userAnswers.confidence, 1)); // Assuming 1 = low
                break;
            case 'Medium confidence':
                conditions.push(eq(dbSchema.userAnswers.confidence, 2)); // Assuming 2 = medium
                break;
            // No default case needed here as 'Wrongs' is handled above
        }
    }

    // Apply Time Filtering
    if (timeFilter && timeFilter !== 'all time') {
      const now = new Date();
      let startDate: Date | null = null;
       switch (timeFilter) {
            case 'this week': // Assuming week starts on Sunday
                const dayOfWeek = now.getDay();
                startDate = new Date(now.setDate(now.getDate() - dayOfWeek));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'this month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }
      if (startDate) {
        // Ensure startTime comparison works with TEXT storage
        conditions.push(sql`${dbSchema.attempts.startTime} >= ${startDate.toISOString()}`);
      }
    }

    // Apply Tag Filtering (Requires tag join)
    if (tagFilter) {
       conditions.push(eq(dbSchema.tags.tagName, tagFilter));
    }

    // Apply conditions
    const finalQuery = queryBuilder.where(and(...conditions)) // Apply all conditions using and()
                                   .groupBy(dbSchema.userAnswers.id) // Group by user answer ID to avoid duplicates from tag join
                                   .orderBy(desc(dbSchema.attempts.startTime), desc(dbSchema.userAnswers.id));


    const results = await finalQuery;

    // Fetch details and structure
    const detailedResults: dbSchema.UserAnswerWithDetails[] = [];
    for (const row of results) {
        const notes = await db.select()
                              .from(dbSchema.questionNotes)
                              .where(eq(dbSchema.questionNotes.userAnswerId, row.userAnswer.id));
        const tags = await db.select()
                             .from(dbSchema.tags)
                             .where(eq(dbSchema.tags.questionId, row.question.id));

        const { notes: _originalNotes, ...userAnswerBase } = row.userAnswer; // Omit original notes property
        detailedResults.push({
            ...userAnswerBase, // Spread base without original notes
            question: { // Assign detailed question object
                ...row.question,
                tags: tags,
            },
            attempt: { // Assign detailed attempt object
                ...row.attempt,
                test: row.test,
            },
            notes: notes, // Assign the new notes array
        });
    }
    return detailedResults;
  }

  /**
   * Notes Feature
   */
  async addQuestionNote(noteData: dbSchema.InsertQuestionNote): Promise<dbSchema.QuestionNote> {
    const now = new Date().toISOString();
    const result = await db.insert(dbSchema.questionNotes).values({
      ...noteData,
      createdAt: now,
      updatedAt: now,
    }).returning();
    if (!result || result.length === 0) {
        throw new Error("Failed to insert question note");
    }
    return result[0];
  }

  // Return type adjusted to match DetailedNote structure expected by frontend
  async getAllNotes(timeFilter?: string, tagFilter?: string): Promise<DetailedNote[]> {
     logger(`Fetching all notes with timeFilter: ${timeFilter}, tagFilter: ${tagFilter}`, 'sqlite-storage');

     // Select note details along with test name and tag name
     let queryBuilder = db.selectDistinct({ // Use selectDistinct to handle potential duplicates from joins
         note: dbSchema.questionNotes,
         testName: dbSchema.tests.name,
         tagName: dbSchema.tags.tagName,
       })
       .from(dbSchema.questionNotes)
       .innerJoin(dbSchema.userAnswers, eq(dbSchema.questionNotes.userAnswerId, dbSchema.userAnswers.id))
       .innerJoin(dbSchema.attempts, eq(dbSchema.userAnswers.attemptId, dbSchema.attempts.id))
       .innerJoin(dbSchema.tests, eq(dbSchema.attempts.testId, dbSchema.tests.id)) // Join tests
       .innerJoin(dbSchema.questions, eq(dbSchema.userAnswers.questionId, dbSchema.questions.id))
       .leftJoin(dbSchema.tags, eq(dbSchema.questions.id, dbSchema.tags.questionId)); // Join tags

     const conditions: SQL[] = [];

     // Apply Time Filtering
     if (timeFilter && timeFilter !== 'all time') {
       const now = new Date();
       let startDate: Date | null = null;
        switch (timeFilter) {
            case 'this week':
                const dayOfWeek = now.getDay();
                startDate = new Date(now.setDate(now.getDate() - dayOfWeek));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'this month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }
       if (startDate) {
         conditions.push(sql`${dbSchema.questionNotes.createdAt} >= ${startDate.toISOString()}`);
       }
     }

     // Apply Tag Filtering
     if (tagFilter) {
        conditions.push(eq(dbSchema.tags.tagName, tagFilter));
     }

     // Apply conditions if any
     const finalQuery = (conditions.length > 0 ? queryBuilder.where(and(...conditions)) : queryBuilder)
                        .orderBy(desc(dbSchema.questionNotes.createdAt)); // Order after potential filtering


     const results = await finalQuery;

     // Map results to the DetailedNote structure
     return results.map(row => ({
         ...row.note, // Spread the QuestionNote properties
         testName: row.testName,
         tagName: row.tagName, // This will be the specific tag if filtered, or potentially one of many if not
     }));
  }

  async updateQuestionNote(noteId: number, noteText: string): Promise<dbSchema.QuestionNote | undefined> {
    const now = new Date().toISOString();
    const result = await db.update(dbSchema.questionNotes)
      .set({
        noteText: noteText,
        updatedAt: now,
      })
      .where(eq(dbSchema.questionNotes.id, noteId))
      .returning();
    return result[0]; // Drizzle returns array, get first element or undefined
  }

  async exportNotesToMarkdown(timeFilter?: string, tagFilter?: string): Promise<string> {
    logger(`Exporting notes with timeFilter: ${timeFilter}, tagFilter: ${tagFilter}`, 'sqlite-storage');

    // Select necessary fields including IDs for grouping
    let queryBuilder = db.select({
        noteId: dbSchema.questionNotes.id,
        noteText: dbSchema.questionNotes.noteText,
        testId: dbSchema.tests.id,
        testName: dbSchema.tests.name,
        tagId: dbSchema.tags.id, // Include tagId if available
        tagName: dbSchema.tags.tagName,
        noteCreatedAt: dbSchema.questionNotes.createdAt // For consistent ordering if needed
      })
      .from(dbSchema.questionNotes)
      .innerJoin(dbSchema.userAnswers, eq(dbSchema.questionNotes.userAnswerId, dbSchema.userAnswers.id))
      .innerJoin(dbSchema.attempts, eq(dbSchema.userAnswers.attemptId, dbSchema.attempts.id))
      .innerJoin(dbSchema.tests, eq(dbSchema.attempts.testId, dbSchema.tests.id))
      .innerJoin(dbSchema.questions, eq(dbSchema.userAnswers.questionId, dbSchema.questions.id))
      .leftJoin(dbSchema.tags, eq(dbSchema.questions.id, dbSchema.tags.questionId)); // Join tags

    const conditions: SQL[] = [];

    // Apply Time Filtering (based on note creation time)
    if (timeFilter && timeFilter !== 'all time') {
       const now = new Date();
       let startDate: Date | null = null;
        switch (timeFilter) {
           case 'this week':
               const dayOfWeek = now.getDay();
               startDate = new Date(now.setDate(now.getDate() - dayOfWeek));
               startDate.setHours(0, 0, 0, 0);
               break;
           case 'this month':
               startDate = new Date(now.getFullYear(), now.getMonth(), 1);
               break;
       }
       if (startDate) {
           conditions.push(sql`${dbSchema.questionNotes.createdAt} >= ${startDate.toISOString()}`);
       }
    }

    // Apply Tag Filtering
    if (tagFilter) {
       conditions.push(eq(dbSchema.tags.tagName, tagFilter));
    }

    // Apply conditions if any
    const finalQuery = (conditions.length > 0 ? queryBuilder.where(and(...conditions)) : queryBuilder)
                       .orderBy(dbSchema.tags.tagName, dbSchema.tests.name, dbSchema.questionNotes.createdAt); // Order for grouping

    const notesData = await finalQuery;

    // Group data by Tag -> Test -> Notes
    const groupedNotes = new Map<string, Map<string, string[]>>(); // Map<TagName, Map<TestName, NoteText[]>>

    notesData.forEach(note => {
        const tagName = note.tagName || 'Untagged'; // Group notes without tags
        const testName = note.testName || 'Unknown Test';

        if (!groupedNotes.has(tagName)) {
            groupedNotes.set(tagName, new Map<string, string[]>());
        }
        const testMap = groupedNotes.get(tagName)!;

        if (!testMap.has(testName)) {
            testMap.set(testName, []);
        }
        testMap.get(testName)!.push(note.noteText);
    });

    // Format to Markdown Table, grouped by Tag, with one row per note
    let markdown = "# Exported Notes\n\n";

    groupedNotes.forEach((testMap, tagName) => {
        markdown += `## Tag: ${tagName}\n\n`;
        markdown += "| Test | Notes |\n"; // Table header for each tag
        markdown += "|---|---|\n";

        testMap.forEach((notesList, testName) => {
            // Create a row for each note under this Test
            notesList.forEach(noteText => {
                // Escape pipe characters and replace newlines with spaces for single-line cell
                const formattedNote = noteText.replace(/\|/g, '\\|').replace(/\n/g, ' ');
                markdown += `| ${testName || 'N/A'} | ${formattedNote} |\n`; // Repeat Test Name for each note row
            });
        });
        markdown += "\n"; // Add a newline after each tag's table
    });

    logger(`Generated markdown table for ${notesData.length} notes.`, 'sqlite-storage');
    return markdown;
  }
  // --- End of new methods ---

  /**
   * Fetches test attempt counts grouped by day for a specific month and year.
   * Includes names of tests attempted on each day.
   */
  async getHeatmapData(year: number, month: number): Promise<dbSchema.HeatmapData[]> {
    // Define monthString and yearString outside the try block to make them accessible in catch
    const monthString = String(month).padStart(2, '0');
    const yearString = String(year);
    logger(`Fetching heatmap data for ${yearString}-${monthString}`, 'sqlite-storage');
    try {
      // Ensure month is 1-based for strftime '%m'
      // Variables already defined above

      // Use raw SQL for date extraction and grouping
      // Note: db.all is not a standard Drizzle function. Assuming db is the raw better-sqlite3 instance via drizzle.
      // We need to access the underlying driver or use db.run/db.get with raw SQL.
      // Let's use the raw sqlite instance from sqlite-db.ts
      const rawSql = sql`
        SELECT
          strftime('%Y-%m-%d', a.start_time) as date,
          COUNT(a.id) as count,
          GROUP_CONCAT(t.name) as testNames
        FROM attempts a
        JOIN tests t ON a.test_id = t.id
        WHERE strftime('%Y', a.start_time) = ${yearString}
          AND strftime('%m', a.start_time) = ${monthString}
          -- AND a.completed = 1 -- Consider if only completed attempts should count
        GROUP BY date
        ORDER BY date ASC;
      `;

      // Revert to using the imported underlying better-sqlite3 instance's prepare/all methods
      // Manually construct SQL string and extract parameters from Drizzle's sql object
      let sqlString = "";
      const params: any[] = [];
      rawSql.queryChunks.forEach(chunk => {
        if (typeof chunk === 'string') {
          // This is a parameter value, add placeholder to SQL and value to params
          sqlString += '?';
          params.push(chunk);
        } else if (chunk && Array.isArray(chunk.value)) {
          // This is a SQL string chunk
          sqlString += chunk.value.join('');
        }
      });
 
      logger(`Executing raw SQL for heatmap: ${sqlString} with params: ${JSON.stringify(params)}`, 'sqlite-storage');
      const results = sqlite.prepare(sqlString).all(...params) as { date: string; count: number; testNames: string | null }[];
 

      // Process results: GROUP_CONCAT returns comma-separated string, split it
      const heatmapData: dbSchema.HeatmapData[] = results.map((row) => ({
        date: row.date,
        count: Number(row.count), // Ensure count is a number
        testNames: row.testNames ? row.testNames.split(',') : [],
      }));

      logger(`Successfully fetched ${heatmapData.length} heatmap data points for ${year}-${monthString}`, 'sqlite-storage');
      return heatmapData;

    } catch (error) {
      // Now monthString and yearString are accessible here
      logger(`Error fetching heatmap data for ${yearString}-${monthString}: ${error}`, 'sqlite-storage');
      throw error; // Re-throw error to be handled by the route
    }
  }

  /**
   * Application Settings
   */
  async getAppSettings(): Promise<dbSchema.ApplicationConfiguration | undefined> {
    logger('Fetching application settings', 'sqlite-storage');
    try {
      let settingsArray = await db.select().from(dbSchema.applicationConfiguration).limit(1);
      if (settingsArray.length > 0) {
        logger('Found existing application settings', 'sqlite-storage');
        return settingsArray[0];
      } else {
        logger('No application settings found, creating with defaults.', 'sqlite-storage');
        const defaultSettings: dbSchema.InsertApplicationConfiguration = {
          theme: 'light',
          primaryColor: 'blue',
          animations: true,
          aiEnabled: true,
          aiApiKey: '',
          aiModel: 'gemini-2.0-flash',
          subjectTaggingAiModel: 'gemini-1.5-flash',
          subjectTaggingPrompt: '', 
          analyticsPrompt: '',      
          explanationPrompt: '',    
          studyPlanPrompt: '',      
          learningPatternPrompt: '',
          parsingPromptTitle: '',   
          // 'updatedAt' is handled by $defaultFn in the schema
        };
        const newSettingsArray = await db.insert(dbSchema.applicationConfiguration)
          .values(defaultSettings)
          .returning();
        logger('Created default application settings', 'sqlite-storage');
        return newSettingsArray[0];
      }
    } catch (error) {
      logger(`Error fetching application settings: ${error}`, 'sqlite-storage');
      return undefined;
    }
  }

  async updateAppSettings(settingsUpdate: Partial<dbSchema.InsertApplicationConfiguration>): Promise<dbSchema.ApplicationConfiguration | undefined> {
    logger('Updating application settings', 'sqlite-storage');
    try {
      const currentSettings = await this.getAppSettings(); 

      if (!currentSettings || !currentSettings.id) {
        logger('Critical error: No settings found or created by getAppSettings before update. Attempting insert as fallback.', 'sqlite-storage');
        const fullSettingsToInsert: dbSchema.InsertApplicationConfiguration = {
          theme: settingsUpdate.theme ?? 'light',
          primaryColor: settingsUpdate.primaryColor ?? 'blue',
          animations: settingsUpdate.animations ?? true,
          aiEnabled: settingsUpdate.aiEnabled ?? true,
          aiApiKey: settingsUpdate.aiApiKey ?? '',
          aiModel: settingsUpdate.aiModel ?? 'gemini-2.0-flash',
          subjectTaggingAiModel: settingsUpdate.subjectTaggingAiModel ?? 'gemini-1.5-flash',
          subjectTaggingPrompt: settingsUpdate.subjectTaggingPrompt ?? '',
          analyticsPrompt: settingsUpdate.analyticsPrompt ?? '',
          explanationPrompt: settingsUpdate.explanationPrompt ?? '',
          studyPlanPrompt: settingsUpdate.studyPlanPrompt ?? '',
          learningPatternPrompt: settingsUpdate.learningPatternPrompt ?? '',
          parsingPromptTitle: settingsUpdate.parsingPromptTitle ?? '',
          updatedAt: new Date().toISOString(), 
        };
        const newSettingsArray = await db.insert(dbSchema.applicationConfiguration)
          .values(fullSettingsToInsert)
          .returning();
        logger('Inserted new application settings during update attempt due to no existing row.', 'sqlite-storage');
        return newSettingsArray[0];
      }

      const settingsWithTimestamp = {
        ...settingsUpdate,
        updatedAt: new Date().toISOString(),
      };

      const updatedArray = await db.update(dbSchema.applicationConfiguration)
        .set(settingsWithTimestamp)
        .where(eq(dbSchema.applicationConfiguration.id, currentSettings.id))
        .returning();
      logger('Successfully updated application settings', 'sqlite-storage');
      return updatedArray[0];

    } catch (error) {
      logger(`Error updating application settings: ${error}`, 'sqlite-storage');
      return undefined;
    }
  }
} // Closing brace for the SqliteStorage class
