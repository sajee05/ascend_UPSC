import { logger } from "./logger";
import { db, client } from "./db";
import { 
  users, 
  subjects, 
  topics, 
  tests, 
  testSubjects, 
  questions, 
  questionSubjects, 
  questionTopics, 
  tags, 
  attempts, 
  userAnswers, 
  flashcards 
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { migrationPrompt } from "./migrations/prompt";

// Initial default subjects for UPSC exam
const defaultSubjects = [
  { name: "Polity", description: "Indian Polity and Constitution", sortOrder: 1 },
  { name: "History", description: "Indian History", sortOrder: 2 },
  { name: "Geography", description: "Geography of India and World", sortOrder: 3 },
  { name: "Economics", description: "Indian Economy and Economic Development", sortOrder: 4 },
  { name: "Science", description: "Science and Technology", sortOrder: 5 },
  { name: "Environment", description: "Environment and Ecology", sortOrder: 6 },
  { name: "Current Affairs", description: "Current National and International Events", sortOrder: 7 },
  { name: "Art & Culture", description: "Indian Art, Culture and Heritage", sortOrder: 8 },
];

// Initial default topics for UPSC exam subjects
const defaultTopics = [
  // Polity topics
  { subjectName: "Polity", name: "Constitution", description: "Indian Constitution: Features, Amendments, and Evolution" },
  { subjectName: "Polity", name: "Parliament", description: "Parliament Structure and Functions" },
  { subjectName: "Polity", name: "Executive", description: "President, Prime Minister, and Council of Ministers" },
  { subjectName: "Polity", name: "Judiciary", description: "Supreme Court, High Courts, and Judicial System" },
  { subjectName: "Polity", name: "Federalism", description: "Federal Structure, Centre-State Relations" },
  
  // History topics
  { subjectName: "History", name: "Ancient History", description: "Ancient Indian History and Indus Valley Civilization" },
  { subjectName: "History", name: "Medieval History", description: "Medieval Indian History, Delhi Sultanate, Mughals" },
  { subjectName: "History", name: "Modern History", description: "British Rule and Freedom Movement" },
  { subjectName: "History", name: "Post-Independence", description: "India after Independence" },
  
  // Geography topics
  { subjectName: "Geography", name: "Physical Geography", description: "Mountains, Rivers, Climate of India" },
  { subjectName: "Geography", name: "Economic Geography", description: "Resources, Industries, and Agriculture" },
  { subjectName: "Geography", name: "World Geography", description: "World Climate, Resources, and Geopolitics" },
  
  // Economics topics
  { subjectName: "Economics", name: "Macroeconomics", description: "National Income, Inflation, Monetary Policy" },
  { subjectName: "Economics", name: "Indian Economy", description: "Economic Reforms, Planning, and Development" },
  { subjectName: "Economics", name: "International Economics", description: "Trade, Balance of Payments, Global Institutions" },
];

// Function to initialize the database with default data
async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    logger("Creating tables if they don't exist...", "migration");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        subject_id INTEGER NOT NULL REFERENCES subjects(id),
        name TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(subject_id, name)
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        question_count INTEGER NOT NULL,
        difficulty_level TEXT,
        estimated_time_minutes INTEGER,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS test_subjects (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES tests(id),
        subject_id INTEGER NOT NULL REFERENCES subjects(id),
        UNIQUE(test_id, subject_id)
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES tests(id),
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        correct_answer_text TEXT NOT NULL,
        difficulty_level TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS question_subjects (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES questions(id),
        subject_id INTEGER NOT NULL REFERENCES subjects(id),
        is_ai_generated BOOLEAN DEFAULT FALSE,
        UNIQUE(question_id, subject_id)
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS question_topics (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES questions(id),
        topic_id INTEGER NOT NULL REFERENCES topics(id),
        is_ai_generated BOOLEAN DEFAULT FALSE,
        UNIQUE(question_id, topic_id)
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES questions(id),
        tag_name TEXT NOT NULL,
        is_ai_generated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS attempts (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES tests(id),
        attempt_number INTEGER NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        total_time_seconds INTEGER,
        completed BOOLEAN DEFAULT FALSE,
        score REAL,
        correct_count INTEGER,
        incorrect_count INTEGER,
        left_count INTEGER
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_answers (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER NOT NULL REFERENCES attempts(id),
        question_id INTEGER NOT NULL REFERENCES questions(id),
        selected_option TEXT,
        is_correct BOOLEAN DEFAULT FALSE,
        is_left BOOLEAN DEFAULT FALSE,
        answer_time_seconds INTEGER,
        knowledge_flag BOOLEAN,
        technique_flag BOOLEAN,
        guesswork_flag BOOLEAN,
        confidence_level TEXT,
        attempt_number INTEGER DEFAULT 1,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS flashcards (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES questions(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_reviewed_at TIMESTAMP,
        next_review_at TIMESTAMP,
        ease_factor REAL DEFAULT 2.5,
        interval INTEGER DEFAULT 1,
        review_count INTEGER DEFAULT 0,
        difficulty_rating INTEGER,
        notes TEXT
      );
    `);
    
    // Create indices for performance
    logger("Creating indices for performance...", "migration");
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS subject_name_idx ON subjects(name);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS topic_name_idx ON topics(name);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS test_title_idx ON tests(title);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS question_test_id_idx ON questions(test_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS tag_question_id_idx ON tags(question_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS tag_name_idx ON tags(tag_name);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS attempt_test_id_idx ON attempts(test_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS user_answer_attempt_id_idx ON user_answers(attempt_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS user_answer_question_id_idx ON user_answers(question_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS flashcard_question_id_idx ON flashcards(question_id);`);
    
    // Insert default subjects if they don't exist
    logger("Inserting default subjects...", "migration");
    
    for (const subject of defaultSubjects) {
      await db.execute(sql`
        INSERT INTO subjects (name, description, sort_order)
        VALUES (${subject.name}, ${subject.description}, ${subject.sortOrder})
        ON CONFLICT (name) DO NOTHING;
      `);
    }
    
    // Insert default topics if they don't exist
    logger("Inserting default topics...", "migration");
    
    for (const topic of defaultTopics) {
      // Get the subject ID
      const [subjectResult] = await db.execute<{ id: number }>(sql`
        SELECT id FROM subjects WHERE name = ${topic.subjectName} LIMIT 1;
      `);
      
      if (subjectResult) {
        await db.execute(sql`
          INSERT INTO topics (subject_id, name, description)
          VALUES (${subjectResult.id}, ${topic.name}, ${topic.description})
          ON CONFLICT (subject_id, name) DO NOTHING;
        `);
      }
    }
    
    // Migrate existing data
    await migrateExistingData();
    
    logger("Database initialization completed successfully!", "migration");
    
  } catch (error) {
    logger(`Error initializing database: ${error}`, "migration-error");
    throw error;
  }
}

// Function to migrate existing data to the new schema
async function migrateExistingData() {
  try {
    logger("Starting migration of existing data...", "migration");
    
    // Check if we have existing questions and tags
    const [questionsCount] = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*) as count FROM questions;
    `);
    
    if (questionsCount && questionsCount.count > 0) {
      logger(`Found ${questionsCount.count} existing questions to migrate`, "migration");
      
      // Get all questions with their tags
      const questions = await db.execute<{ 
        id: number; 
        testId: number;
        questionText: string;
      }>(sql`
        SELECT id, test_id as "testId", question_text as "questionText" FROM questions;
      `);
      
      // For each question, check if it has tags and create subject/topic associations
      for (const question of questions) {
        const tags = await db.execute<{ 
          tagName: string;
          isAIGenerated: boolean;
        }>(sql`
          SELECT tag_name as "tagName", is_ai_generated as "isAIGenerated"
          FROM tags 
          WHERE question_id = ${question.id};
        `);
        
        if (tags.length > 0) {
          // Get unique subjects from tags
          const subjectNames = new Set<string>();
          
          for (const tag of tags) {
            // Skip empty tags
            if (!tag.tagName.trim()) continue;
            
            // Check if tag matches a subject name
            const subjects = await db.execute<{ id: number }>(sql`
              SELECT id FROM subjects 
              WHERE LOWER(name) = LOWER(${tag.tagName})
              OR ${tag.tagName} ILIKE CONCAT('%', name, '%')
              OR name ILIKE CONCAT('%', ${tag.tagName}, '%')
              LIMIT 1;
            `);
            
            if (subjects.length > 0) {
              // Create question-subject association
              await db.execute(sql`
                INSERT INTO question_subjects (question_id, subject_id, is_ai_generated)
                VALUES (${question.id}, ${subjects[0].id}, ${tag.isAIGenerated})
                ON CONFLICT (question_id, subject_id) DO NOTHING;
              `);
              
              subjectNames.add(subjects[0].id.toString());
            }
            
            // Check if tag matches a topic name
            const topics = await db.execute<{ id: number }>(sql`
              SELECT id FROM topics 
              WHERE LOWER(name) = LOWER(${tag.tagName})
              OR ${tag.tagName} ILIKE CONCAT('%', name, '%')
              OR name ILIKE CONCAT('%', ${tag.tagName}, '%')
              LIMIT 1;
            `);
            
            if (topics.length > 0) {
              // Create question-topic association
              await db.execute(sql`
                INSERT INTO question_topics (question_id, topic_id, is_ai_generated)
                VALUES (${question.id}, ${topics[0].id}, ${tag.isAIGenerated})
                ON CONFLICT (question_id, topic_id) DO NOTHING;
              `);
            }
          }
          
          // If no matching subjects found, use AI to categorize the question
          if (subjectNames.size === 0) {
            // This would be implemented with the migrationPrompt AI function
            // For now, just log that we need AI categorization
            logger(`Question ${question.id} needs AI categorization: ${question.questionText.substring(0, 50)}...`, "migration");
          }
        }
      }
      
      // Get all tests
      const tests = await db.execute<{ id: number; title: string; }>(sql`
        SELECT id, title FROM tests;
      `);
      
      // For each test, find dominant subjects from its questions and associate them
      for (const test of tests) {
        // Get subjects associated with this test's questions
        const subjectCounts = await db.execute<{ 
          subjectId: number; 
          count: number;
        }>(sql`
          SELECT qs.subject_id as "subjectId", COUNT(*) as count
          FROM question_subjects qs
          JOIN questions q ON q.id = qs.question_id
          WHERE q.test_id = ${test.id}
          GROUP BY qs.subject_id
          ORDER BY count DESC;
        `);
        
        // Associate the top subjects with the test
        for (const subject of subjectCounts) {
          await db.execute(sql`
            INSERT INTO test_subjects (test_id, subject_id)
            VALUES (${test.id}, ${subject.subjectId})
            ON CONFLICT (test_id, subject_id) DO NOTHING;
          `);
        }
      }
      
      logger("Data migration completed successfully!", "migration");
    } else {
      logger("No existing questions found. Skipping data migration.", "migration");
    }
    
  } catch (error) {
    logger(`Error migrating existing data: ${error}`, "migration-error");
    throw error;
  }
}

// Run the function
(async () => {
  try {
    await initializeDatabase();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();