import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./database-switcher"; // Removed switchDatabase import as the endpoint is removed
import { z } from "zod";

// Define a storage constant that always uses getStorage()
const storage = {
  getAllTests: async () => (await getStorage()).getAllTests(),
  createTest: async (data: any) => (await getStorage()).createTest(data),
  getTest: async (id: number) => (await getStorage()).getTest(id),
  deleteTest: async (id: number) => (await getStorage()).deleteTest(id),
  addQuestionsToTest: async (data: any) => (await getStorage()).addQuestionsToTest(data),
  getQuestion: async (id: number) => (await getStorage()).getQuestion(id),
  getQuestionsByTest: async (id: number) => (await getStorage()).getQuestionsByTest(id),
  getAllQuestions: async () => (await getStorage()).getAllQuestions(),
  addTagsToQuestion: async (data: any) => (await getStorage()).addTagsToQuestion(data),
  deleteTag: async (id: number) => (await getStorage()).deleteTag(id),
  getAllTags: async () => (await getStorage()).getAllTags(),
  createAttempt: async (data: any) => (await getStorage()).createAttempt(data),
  getAttempt: async (id: number) => (await getStorage()).getAttempt(id),
  getAttemptsByTest: async (id: number) => (await getStorage()).getAttemptsByTest(id),
  updateAttempt: async (id: number, data: any) => (await getStorage()).updateAttempt(id, data),
  createUserAnswer: async (data: any) => (await getStorage()).createUserAnswer(data),
  getUserAnswersByAttempt: async (id: number) => (await getStorage()).getUserAnswersByAttempt(id),
  updateUserAnswer: async (id: number, data: any) => (await getStorage()).updateUserAnswer(id, data),
  createFlashcard: async (data: any) => (await getStorage()).createFlashcard(data),
  getAllFlashcards: async () => (await getStorage()).getAllFlashcards(),
  updateFlashcard: async (id: number, data: any) => (await getStorage()).updateFlashcard(id, data),
  getTestAnalytics: async (id: number) => (await getStorage()).getTestAnalytics(id),
  getOverallAnalytics: async () => (await getStorage()).getOverallAnalytics(),
  getAnkiData: async (id: number) => (await getStorage()).getAnkiData(id),
  getHistory: async (filter?: string) => (await getStorage()).getHistory(filter), // Correctly added getHistory
  getHeatmapData: async (year: number, month: number) => (await getStorage()).getHeatmapData(year, month), // Added heatmap data
  getAppSettings: async () => (await getStorage()).getAppSettings(),
  updateAppSettings: async (data: any) => (await getStorage()).updateAppSettings(data),
};
import {
  insertAttemptSchema,
  insertFlashcardSchema,
  insertQuestionSchema,
  insertTagSchema,
  insertTestSchema,
  insertUserAnswerSchema,
  Attempt,
  Flashcard,
  // ApplicationConfiguration, // Not needed from @shared/schema, will use from ../shared/sqlite-schema
  // InsertApplicationConfiguration // Not needed from @shared/schema, will use from ../shared/sqlite-schema
} from "@shared/schema";
import {
  ApplicationConfiguration,
  insertApplicationConfigurationSchema, // Import the Zod schema
  InsertApplicationConfiguration as InsertAppConfigSqliteType // Type alias for clarity
} from "../shared/sqlite-schema";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import * as fs from "fs/promises"; // Ensure fs/promises is imported
import * as path from "path"; // Ensure path is imported
import { logger } from "./logger"; // Import logger
import multer from "multer";
import Papa from "papaparse";

const upload = multer({ storage: multer.memoryStorage() });

// Helper function to append to log file
async function appendToAnalyticsLog(data: any, type: 'test' | 'overall') {
  const logFilePath = path.resolve("./analytics_log.txt");
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] Type: ${type}\nData:\n${JSON.stringify(data, null, 2)}\n\n---\n\n`;
  try {
    await fs.appendFile(logFilePath, logEntry);
  } catch (error) {
    console.error("Error writing to analytics log:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Prefix all routes with /api
  const apiRouter = app;

  // GET /api/subjects - Get all subjects
  apiRouter.get("/api/subjects", async (_req: Request, res: Response) => {
    try {
      const { db } = await import("./sqlite-db");
      const { subjects } = await import("../shared/sqlite-schema");
      const allSubjects = await db.select().from(subjects);
      res.json(allSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // GET /api/topics - Get all topics
  apiRouter.get("/api/topics", async (_req: Request, res: Response) => {
    try {
      const { db } = await import("./sqlite-db");
      const { topics } = await import("../shared/sqlite-schema");
      const allTopics = await db.select().from(topics);
      res.json(allTopics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  // GET /api/tests - Get all tests
  apiRouter.get("/api/tests", async (_req: Request, res: Response) => {
    try {
      const tests = await storage.getAllTests();
      res.json(tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  // POST /api/tests - Upload and parse a new test
  apiRouter.post("/api/tests", async (req: Request, res: Response) => {
    try {
      const testData = insertTestSchema.parse(req.body);
      const test = await storage.createTest(testData);
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid test data", error: fromZodError(error) });
      } else {
        console.error("Error creating test:", error);
        res.status(500).json({ message: "Failed to create test" });
      }
    }
  });
 
  // POST /api/upload-csv - Upload and parse a new test from CSV
  apiRouter.post("/api/upload-csv", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
 
      const csvData = req.file.buffer.toString("utf-8");
 
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const questions = results.data.map((row: any) => {
              const correctOptionString = row["Correct Option"] || "";
              const correctOptionIndex = correctOptionString.indexOf("1");
              const correctAnswer = correctOptionIndex !== -1 ? String.fromCharCode(65 + correctOptionIndex) : "";
 
              return {
                questionText: row.Question,
                optionA: row.O1,
                optionB: row.O2,
                optionC: row.O3,
                optionD: row.O4,
                correctAnswer,
                correctAnswerText: row[`O${correctOptionIndex + 1}`],
                explanation: row.Explanation,
                tags: row.Tags.split(" "),
              };
            });
 
            if (!req.file) {
              // This check is for TypeScript's benefit, as it's already handled above.
              return res.status(400).json({ message: "No file uploaded" });
            }
            const test = await storage.createTest({
              filename: req.file.originalname,
              title: req.file.originalname,
              questionCount: questions.length,
            });
 
            const questionPromises = questions.map(async (q, index) => {
              const newQuestion = await storage.addQuestionsToTest([
                {
                  testId: test.id,
                  questionNumber: index + 1,
                  questionText: q.questionText,
                  optionA: q.optionA,
                  optionB: q.optionB,
                  optionC: q.optionC,
                  optionD: q.optionD,
                  correctAnswer: q.correctAnswer,
                  correctAnswerText: q.correctAnswerText,
                  explanation: q.explanation,
                },
              ]);
 
              if (q.tags && q.tags.length > 0) {
                const tagPromises = q.tags.map((tag: string) =>
                  storage.addTagsToQuestion([
                    {
                      questionId: newQuestion[0].id,
                      tagName: tag,
                    },
                  ])
                );
                await Promise.all(tagPromises);
              }
            });
 
            await Promise.all(questionPromises);
 
            res.status(201).json({ message: "Test created successfully from CSV", test });
          } catch (error) {
            console.error("Error processing CSV data:", error);
            res.status(500).json({ message: "Failed to process CSV data" });
          }
        },
        error: (error: any) => {
          console.error("Error parsing CSV:", error);
          res.status(400).json({ message: "Failed to parse CSV file", error: error.message });
        },
      });
    } catch (error) {
      console.error("Error uploading CSV:", error);
      res.status(500).json({ message: "Failed to upload CSV" });
    }
  });
 
  // GET /api/tests/:id - Get a single test
  apiRouter.get("/api/tests/:id", async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.id);
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }

      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      res.json(test);
    } catch (error) {
      console.error("Error fetching test:", error);
      res.status(500).json({ message: "Failed to fetch test" });
    }
  });

  // DELETE /api/tests/:id - Delete a test and all related data
  apiRouter.delete("/api/tests/:id", async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.id);
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }

      // Check if test exists
      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      // Delete the test and all associated data
      await storage.deleteTest(testId);

      res.status(200).json({ message: "Test deleted successfully" });
    } catch (error) {
      console.error("Error deleting test:", error);
      res.status(500).json({ message: "Failed to delete test" });
    }
  });

  // POST /api/questions - Add questions to a test
  apiRouter.post("/api/questions", async (req: Request, res: Response) => {
    try {
      const questionsData = z.array(insertQuestionSchema).parse(req.body);
      const questions = await storage.addQuestionsToTest(questionsData);
      res.status(201).json(questions);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid question data", error: fromZodError(error) });
      } else {
        console.error("Error adding questions:", error);
        res.status(500).json({ message: "Failed to add questions" });
      }
    }
  });

  // GET /api/tests/:testId/questions - Get all questions for a test
  apiRouter.get("/api/tests/:testId/questions", async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.testId);
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }

      const questions = await storage.getQuestionsByTest(testId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // GET /api/questions - Get all questions across tests
  apiRouter.get("/api/questions", async (_req: Request, res: Response) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching all questions:", error);
      res.status(500).json({ message: "Failed to fetch all questions" });
    }
  });

  // GET /api/questions/:id - Get a single question by ID
  apiRouter.get("/api/questions/:id", async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  // POST /api/attempts - Create a new attempt
  apiRouter.post("/api/attempts", async (req: Request, res: Response) => {
    try {
      const attemptData = insertAttemptSchema.parse(req.body);
      const attempt = await storage.createAttempt(attemptData);
      res.status(201).json(attempt);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid attempt data", error: fromZodError(error) });
      } else {
        console.error("Error creating attempt:", error);
        res.status(500).json({ message: "Failed to create attempt" });
      }
    }
  });

  // PATCH /api/attempts/:id - Update an attempt (complete it)
  apiRouter.patch("/api/attempts/:id", async (req: Request, res: Response) => {
    try {
      const attemptId = parseInt(req.params.id);
      if (isNaN(attemptId)) {
        return res.status(400).json({ message: "Invalid attempt ID" });
      }

      const schema = z.object({
        endTime: z.string().optional(),
        totalTimeSeconds: z.number().optional(),
        completed: z.boolean().optional(),
      });

      const rawUpdateData = schema.parse(req.body);

      // Convert string dates to Date objects
      const updateData: Partial<Attempt> = {
        ...(rawUpdateData.totalTimeSeconds && { totalTimeSeconds: rawUpdateData.totalTimeSeconds }),
        ...(rawUpdateData.completed && { completed: rawUpdateData.completed }),
        ...(rawUpdateData.endTime && { endTime: new Date(rawUpdateData.endTime) })
      };

      const attempt = await storage.updateAttempt(attemptId, updateData);

      if (!attempt) {
        return res.status(404).json({ message: "Attempt not found" });
      }

      res.json(attempt);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid update data", error: fromZodError(error) });
      } else {
        console.error("Error updating attempt:", error);
        res.status(500).json({ message: "Failed to update attempt" });
      }
    }
  });

  // GET /api/attempts/:id - Get a single attempt
  apiRouter.get("/api/attempts/:id", async (req: Request, res: Response) => {
    try {
      const attemptId = parseInt(req.params.id);
      if (isNaN(attemptId)) {
        return res.status(400).json({ message: "Invalid attempt ID" });
      }

      const attempt = await storage.getAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: "Attempt not found" });
      }

      res.json(attempt);
    } catch (error) {
      console.error("Error fetching attempt:", error);
      res.status(500).json({ message: "Failed to fetch attempt" });
    }
  });

  // GET /api/tests/:testId/attempts - Get all attempts for a test
  apiRouter.get("/api/tests/:testId/attempts", async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.testId);
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }

      const attempts = await storage.getAttemptsByTest(testId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching attempts:", error);
      res.status(500).json({ message: "Failed to fetch attempts" });
    }
  });

  // POST /api/answers - Submit an answer
  apiRouter.post("/api/answers", async (req: Request, res: Response) => {
    try {
      const answerData = insertUserAnswerSchema.parse(req.body);
      const answer = await storage.createUserAnswer(answerData);
      res.status(201).json(answer);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid answer data", error: fromZodError(error) });
      } else {
        console.error("Error submitting answer:", error);
        res.status(500).json({ message: "Failed to submit answer" });
      }
    }
  });

  // GET /api/attempts/:attemptId/answers - Get all answers for an attempt
  apiRouter.get("/api/attempts/:attemptId/answers", async (req: Request, res: Response) => {
    try {
      const attemptId = parseInt(req.params.attemptId);
      if (isNaN(attemptId)) {
        return res.status(400).json({ message: "Invalid attempt ID" });
      }

      const answers = await storage.getUserAnswersByAttempt(attemptId);
      res.json(answers);
    } catch (error) {
      console.error("Error fetching answers:", error);
      res.status(500).json({ message: "Failed to fetch answers" });
    }
  });

  // PATCH /api/answers/:id - Update a user answer with metadata (confidence, knowledge flags, etc.)
  apiRouter.patch("/api/answers/:id", async (req: Request, res: Response) => {
    try {
      const answerId = parseInt(req.params.id);
      if (isNaN(answerId)) {
        return res.status(400).json({ message: "Invalid answer ID" });
      }

      const schema = z.object({
        knowledgeFlag: z.boolean().optional(),
        techniqueFlag: z.boolean().optional(),
        guessworkFlag: z.boolean().optional(),
        confidenceLevel: z.enum(['high', 'mid', 'low']).optional(),
      });

      const updateData = schema.parse(req.body);
      const updatedAnswer = await storage.updateUserAnswer(answerId, updateData);

      if (!updatedAnswer) {
        return res.status(404).json({ message: "Answer not found" });
      }

      res.json(updatedAnswer);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid update data", error: fromZodError(error) });
      } else {
        console.error("Error updating answer:", error);
        res.status(500).json({ message: "Failed to update answer" });
      }
    }
  });

  // POST /api/tags - Add tags to a question
  apiRouter.post("/api/tags", async (req: Request, res: Response) => {
    try {
      const tagsData = z.array(insertTagSchema).parse(req.body);
      const tags = await storage.addTagsToQuestion(tagsData);
      res.status(201).json(tags);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid tag data", error: fromZodError(error) });
      } else {
        console.error("Error adding tags:", error);
        res.status(500).json({ message: "Failed to add tags" });
      }
    }
  });

  // GET /api/tags - Get all unique tags
  apiRouter.get("/api/tags", async (_req: Request, res: Response) => {
    try {
      const allTags = await storage.getAllTags();
      res.json(allTags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // DELETE /api/tags/:id - Delete a tag
  apiRouter.delete("/api/tags/:id", async (req: Request, res: Response) => {
    try {
      const tagId = parseInt(req.params.id);
      if (isNaN(tagId)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }

      await storage.deleteTag(tagId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // POST /api/flashcards - Create a flashcard
  apiRouter.post("/api/flashcards", async (req: Request, res: Response) => {
    try {
      const flashcardData = insertFlashcardSchema.parse(req.body);
      const flashcard = await storage.createFlashcard(flashcardData);
      res.status(201).json(flashcard);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid flashcard data", error: fromZodError(error) });
      } else {
        console.error("Error creating flashcard:", error);
        res.status(500).json({ message: "Failed to create flashcard" });
      }
    }
  });

  // GET /api/flashcards - Get all flashcards
  apiRouter.get("/api/flashcards", async (_req: Request, res: Response) => {
    try {
      const flashcards = await storage.getAllFlashcards();
      res.json(flashcards);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      res.status(500).json({ message: "Failed to fetch flashcards" });
    }
  });

  // PATCH /api/flashcards/:id - Update a flashcard (after review)
  apiRouter.patch("/api/flashcards/:id", async (req: Request, res: Response) => {
    try {
      const flashcardId = parseInt(req.params.id);
      if (isNaN(flashcardId)) {
        return res.status(400).json({ message: "Invalid flashcard ID" });
      }

      const schema = z.object({
        lastReviewedAt: z.string().optional(),
        nextReviewAt: z.string().optional(),
        easeFactor: z.number().optional(),
        interval: z.number().optional(),
        reviewCount: z.number().optional(),
      });

      const rawUpdateData = schema.parse(req.body);

      // Convert string dates to Date objects
      const updateData: Partial<Flashcard> = {
        ...(rawUpdateData.easeFactor && { easeFactor: rawUpdateData.easeFactor }),
        ...(rawUpdateData.interval && { interval: rawUpdateData.interval }),
        ...(rawUpdateData.reviewCount && { reviewCount: rawUpdateData.reviewCount }),
        ...(rawUpdateData.lastReviewedAt && { lastReviewedAt: new Date(rawUpdateData.lastReviewedAt) }),
        ...(rawUpdateData.nextReviewAt && { nextReviewAt: new Date(rawUpdateData.nextReviewAt) })
      };

      const flashcard = await storage.updateFlashcard(flashcardId, updateData);

      if (!flashcard) {
        return res.status(404).json({ message: "Flashcard not found" });
      }

      res.json(flashcard);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid update data", error: fromZodError(error) });
      } else {
        console.error("Error updating flashcard:", error);
        res.status(500).json({ message: "Failed to update flashcard" });
      }
    }
  });

  // GET /api/analytics/test/:attemptId - Get analytics for a test attempt
  apiRouter.get("/api/analytics/test/:attemptId", async (req: Request, res: Response) => {
    try {
      const attemptId = parseInt(req.params.attemptId);
      if (isNaN(attemptId)) {
        return res.status(400).json({ message: "Invalid attempt ID" });
      }

      const analytics = await storage.getTestAnalytics(attemptId);
      if (!analytics) {
        return res.status(404).json({ message: "Analytics not found" });
      }

      // Log the analytics data
      await appendToAnalyticsLog(analytics, 'test');

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching test analytics:", error);
      res.status(500).json({ message: "Failed to fetch test analytics" });
    }
  });

  // GET /api/analytics/overall - Get overall analytics
  apiRouter.get("/api/analytics/overall", async (_req: Request, res: Response) => {
    try {
      const analytics = await storage.getOverallAnalytics();

      // Make sure all required fields are present in the response
      const totalQuestions = analytics.totalCorrect + analytics.totalIncorrect + analytics.totalLeft;
      const accuracy = totalQuestions > 0 ? (analytics.totalCorrect / totalQuestions) * 100 : 0;

      // Define responseData before using it
      const responseData = {
        ...analytics,
        totalQuestions: totalQuestions,
        accuracy: accuracy,
        avgTimeSeconds: analytics.avgTimeSeconds || 0
      }; // Corrected syntax: added closing brace

      // Log the analytics data
      await appendToAnalyticsLog(responseData, 'overall');

      res.json(responseData);
    } catch (error) {
      console.error("Error fetching overall analytics:", error);
      res.status(500).json({ message: "Failed to fetch overall analytics" });
    }
  });

  // Generate Anki CSV - endpoint just returns questions formatted for Anki
  apiRouter.get("/api/tests/:testId/anki", async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.testId);
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }

      const ankiData = await storage.getAnkiData(testId);
      res.json(ankiData);
    } catch (error) {
      console.error("Error generating Anki data:", error);
      res.status(500).json({ message: "Failed to generate Anki data" });
    }
  });

  // GET /api/history - Get test history with optional filtering
  apiRouter.get("/api/history", async (req: Request, res: Response) => {
    try {
      // Extract filter query parameter
      const filter = req.query.filter as string | undefined;
      logger(`Received history request with filter: ${filter}`, 'routes');

      const history = await storage.getHistory(filter);
      res.json(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // POST /api/theme - Update theme settings
  apiRouter.post("/api/theme", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        primary: z.string(),
        variant: z.enum(["professional", "tint", "vibrant"]).optional(),
        appearance: z.enum(["light", "dark", "system"]).optional(),
        radius: z.number().optional()
      });

      const themeData = schema.parse(req.body);
      const themeJsonPath = path.resolve("./theme.json");

      // Read current theme.json
      let currentTheme;
      try {
        const themeFile = await fs.readFile(themeJsonPath, 'utf-8');
        currentTheme = JSON.parse(themeFile);
      } catch (err) {
        // Use default values if file doesn't exist
        currentTheme = {
          variant: "professional",
          primary: "hsl(211, 100%, 50%)",
          appearance: "light",
          radius: 0.75
        };
      }

      // Update with new values
      const updatedTheme = {
        ...currentTheme,
        ...themeData
      };

      // Write to theme.json
      await fs.writeFile(themeJsonPath, JSON.stringify(updatedTheme, null, 2));

      res.json({ message: "Theme updated successfully", theme: updatedTheme });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid theme data", error: fromZodError(error) });
      } else {
        console.error("Error updating theme:", error);
        res.status(500).json({ message: "Failed to update theme" });
      }
    }
  });

  // Removed /api/database/configure endpoint as it's no longer needed with hardcoded SQLite

  // --- Wrongs Feature Routes ---

  // GET /api/wrongs - Get incorrectly answered questions with filtering
  apiRouter.get("/api/wrongs", async (req: Request, res: Response) => {
    try {
      const { timeFilter, tagFilter, filterType } = req.query; // Add filterType
      // Define allowed filter types for validation
      const allowedFilterTypes = ['Wrongs', 'No knowledge', 'Tukke', 'Low confidence', 'Medium confidence'] as const;
      type FilterType = typeof allowedFilterTypes[number];

      // Validate filterType
      let validatedFilterType: FilterType | undefined = undefined;
      if (filterType && allowedFilterTypes.includes(filterType as FilterType)) {
        validatedFilterType = filterType as FilterType;
      } else if (filterType) {
        logger(`Invalid filterType received: ${filterType}, defaulting to 'Wrongs'`, 'routes');
        // Optionally return a 400 error here if strict validation is needed
      }

      const wrongs = await (await getStorage()).getWrongAnswers(
        timeFilter as string | undefined,
        tagFilter as string | undefined,
        validatedFilterType // Pass validated filter type
      );
      res.json(wrongs);
    } catch (error) {
      console.error("Error fetching wrong answers:", error);
      res.status(500).json({ message: "Failed to fetch wrong answers" });
    }
  });

  // --- Notes Feature Routes ---

  // POST /api/notes - Add a note to a user answer
  apiRouter.post("/api/notes", async (req: Request, res: Response) => {
    try {
      // TODO: Add Zod validation for request body (userAnswerId, noteText)
      const noteData = req.body;
      const newNote = await (await getStorage()).addQuestionNote(noteData);
      res.status(201).json(newNote);
    } catch (error) {
      console.error("Error adding note:", error);
      // Add Zod error handling
      res.status(500).json({ message: "Failed to add note" });
    }
  });

  // GET /api/notes - Get all notes with filtering
  apiRouter.get("/api/notes", async (req: Request, res: Response) => {
    try {
      const { timeFilter, tagFilter } = req.query; // Add validation later
      // TODO: Implement storage.getAllNotes(timeFilter, tagFilter)
      const notes = await (await getStorage()).getAllNotes(timeFilter as string, tagFilter as string);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  // PATCH /api/notes/:noteId - Update an existing note
  apiRouter.patch("/api/notes/:noteId", async (req: Request, res: Response) => {
    try {
      const noteId = parseInt(req.params.noteId);
      if (isNaN(noteId)) {
        return res.status(400).json({ message: "Invalid note ID" });
      }
      // TODO: Add Zod validation for request body (noteText)
      const { noteText } = req.body;
      const updatedNote = await (await getStorage()).updateQuestionNote(noteId, noteText);
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(updatedNote);
    } catch (error) {
      console.error("Error updating note:", error);
      // Add Zod error handling
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  // GET /api/notes/export - Export notes as Markdown
  apiRouter.get("/api/notes/export", async (req: Request, res: Response) => {
    try {
      const { timeFilter, tagFilter } = req.query; // Add validation later
      // TODO: Implement storage.exportNotesToMarkdown(timeFilter, tagFilter)
      const markdownContent = await (await getStorage()).exportNotesToMarkdown(timeFilter as string, tagFilter as string);

      res.setHeader('Content-Disposition', 'attachment; filename="ascend_upsc_notes.md"');
      res.setHeader('Content-Type', 'text/markdown');
      res.send(markdownContent);
    } catch (error) {
      console.error("Error exporting notes:", error);
      res.status(500).json({ message: "Failed to export notes" });
    }
  });

  // --- Heatmap Feature Route ---
  apiRouter.get("/api/heatmap", async (req: Request, res: Response) => {
    try {
      const { year, month } = req.query;

      const yearNum = parseInt(year as string);
      const monthNum = parseInt(month as string);

      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ message: "Invalid year or month parameter" });
      }
      // Call getStorage directly within the handler
      const currentStorage = await getStorage();
      const heatmapData = await currentStorage.getHeatmapData(yearNum, monthNum);
      res.json(heatmapData);
    } catch (error) {
      // Ensure JSON error response even on failure
      console.error("Error fetching heatmap data:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch heatmap data";
      res.status(500).json({ message });
    }
  });
  // --- End Heatmap Feature Route ---

  // --- Settings Routes ---
  apiRouter.get("/api/settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getAppSettings();
      if (!settings) {
        // This case should ideally be handled by getAppSettings ensuring a default row
        return res.status(404).json({ message: "Settings not found and failed to create defaults." });
      }
      res.json(settings);
    } catch (error) {
      logger(`Error fetching settings: ${error}`, "routes");
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Zod schema for POST /api/settings payload validation
  // Use the imported Zod schema and make it partial for updates.
  const partialInsertAppConfigSchema = insertApplicationConfigurationSchema.partial();

  apiRouter.post("/api/settings", async (req: Request, res: Response) => {
    try {
      // Validate the incoming data - allow partial updates
      const validatedData = partialInsertAppConfigSchema.parse(req.body);

      const updatedSettings = await storage.updateAppSettings(validatedData);
      if (!updatedSettings) {
        return res.status(500).json({ message: "Failed to update settings" });
      }
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof ZodError) {
        logger(`Settings update validation error: ${fromZodError(error)}`, "routes");
        res.status(400).json({ message: "Invalid settings data", error: fromZodError(error) });
      } else {
        logger(`Error updating settings: ${error}`, "routes");
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });
  // --- End Settings Routes ---


  const httpServer = createServer(app);

  return httpServer;
}
