import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./database-switcher";
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
};
import { 
  insertAttemptSchema,
  insertFlashcardSchema,
  insertQuestionSchema,
  insertTagSchema,
  insertTestSchema,
  insertUserAnswerSchema,
  Attempt,
  Flashcard
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import * as fs from "fs/promises";
import * as path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Prefix all routes with /api
  const apiRouter = app;

  // GET /api/subjects - Get all subjects
  apiRouter.get("/api/subjects", async (_req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { subjects } = await import("@shared/schema");
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
      const { db } = await import("./db");
      const { topics } = await import("@shared/schema");
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
      
      // Add fields required by frontend if they're missing
      res.json({
        ...analytics,
        totalQuestions: totalQuestions,
        accuracy: accuracy,
        avgTimeSeconds: analytics.avgTimeSeconds || 0
      });
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
  
  // POST /api/database/configure - Configure database settings
  apiRouter.post("/api/database/configure", async (req: Request, res: Response) => {
    try {
      const { type, connectionString } = req.body;
      
      // Validate database type
      if (type !== "sqlite" && type !== "postgresql") {
        return res.status(400).json({ message: "Invalid database type. Must be 'sqlite' or 'postgresql'" });
      }
      
      if (type === "postgresql" && !connectionString) {
        return res.status(400).json({ message: "Connection string is required for PostgreSQL" });
      }
      
      // Update environment variables based on the database type
      if (type === "postgresql") {
        // Set PostgreSQL connection
        process.env.DATABASE_URL = connectionString;
        process.env.DB_TYPE = "postgresql";
        process.env.PORTABLE_MODE = "false";
      } else {
        // Set SQLite connection
        process.env.DB_TYPE = "sqlite";
        process.env.PORTABLE_MODE = "true";
        // Use default SQLite path from sqlite-db.ts
      }
      
      // Reload database connection
      try {
        // For PostgreSQL, test the connection first
        if (type === "postgresql") {
          try {
            // Test the connection with a simple query
            const pg = await import('pg');
            const pool = new pg.Pool({
              connectionString: connectionString,
            });
            
            // Test the connection
            await pool.query('SELECT 1');
            await pool.end();
            
            // If successful, switch the database
            await switchDatabase(type, connectionString);
            
            return res.json({ 
              success: true, 
              message: "PostgreSQL database configured successfully" 
            });
          } catch (pgError: any) {
            console.error("PostgreSQL connection error:", pgError);
            return res.status(500).json({
              message: `PostgreSQL connection failed: ${pgError.message}`,
              error: pgError.message
            });
          }
        } else {
          // For SQLite, use the database switcher
          await switchDatabase('sqlite');
          
          return res.json({ 
            success: true, 
            message: "SQLite database configured successfully" 
          });
        }
      } catch (dbError: any) {
        console.error("Database configuration error:", dbError);
        return res.status(500).json({ 
          message: `Database connection failed: ${dbError.message}`,
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error("Error configuring database:", error);
      res.status(500).json({ 
        message: "Failed to configure database",
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
