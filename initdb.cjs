/**
 * Database initialization script for Ascend UPSC Windows installer
 * 
 * This script creates a SQLite database with initial structure and sample data
 * for the Windows installer to bundle with the application.
 */

const fs = require('fs');
const path = require('path');
const { Database } = require('better-sqlite3');

console.log('===========================================');
console.log('Initializing SQLite database for installer');
console.log('===========================================');

// Path to the database file
const dbPath = path.join(__dirname, 'ascend-upsc.db');

// Check if database already exists
if (fs.existsSync(dbPath)) {
  console.log(`Database already exists at: ${dbPath}`);
  console.log('Skipping initialization');
  process.exit(0);
}

// Create a new database
console.log(`Creating new database at: ${dbPath}`);
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('Creating database tables...');

// Create tables
db.exec(`
-- Subjects table
CREATE TABLE IF NOT EXISTS "subjects" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "created_at" TEXT DEFAULT (datetime('now'))
);

-- Topics table
CREATE TABLE IF NOT EXISTS "topics" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "subject_id" INTEGER NOT NULL,
  "created_at" TEXT DEFAULT (datetime('now')),
  FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE
);

-- Subtopics table
CREATE TABLE IF NOT EXISTS "subtopics" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "topic_id" INTEGER NOT NULL,
  "created_at" TEXT DEFAULT (datetime('now')),
  FOREIGN KEY ("topic_id") REFERENCES "topics" ("id") ON DELETE CASCADE
);

-- Tests table
CREATE TABLE IF NOT EXISTS "tests" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "filename" TEXT,
  "created_at" TEXT DEFAULT (datetime('now')),
  "modified_at" TEXT DEFAULT (datetime('now'))
);

-- Questions table
CREATE TABLE IF NOT EXISTS "questions" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "test_id" INTEGER NOT NULL,
  "question_text" TEXT NOT NULL,
  "option_a" TEXT,
  "option_b" TEXT,
  "option_c" TEXT,
  "option_d" TEXT,
  "correct_option" TEXT NOT NULL,
  "explanation" TEXT,
  "subject_id" INTEGER,
  "topic_id" INTEGER,
  "subtopic_id" INTEGER,
  "created_at" TEXT DEFAULT (datetime('now')),
  FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE SET NULL,
  FOREIGN KEY ("topic_id") REFERENCES "topics" ("id") ON DELETE SET NULL,
  FOREIGN KEY ("subtopic_id") REFERENCES "subtopics" ("id") ON DELETE SET NULL
);

-- Tags table
CREATE TABLE IF NOT EXISTS "tags" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT UNIQUE NOT NULL,
  "question_id" INTEGER NOT NULL,
  "created_at" TEXT DEFAULT (datetime('now')),
  FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE CASCADE
);

-- Attempts table
CREATE TABLE IF NOT EXISTS "attempts" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "test_id" INTEGER NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT,
  "total_questions" INTEGER NOT NULL,
  "attempted_questions" INTEGER DEFAULT 0,
  "correct_answers" INTEGER DEFAULT 0,
  "status" TEXT DEFAULT 'in_progress',
  "created_at" TEXT DEFAULT (datetime('now')),
  FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE
);

-- User Answers table
CREATE TABLE IF NOT EXISTS "user_answers" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "attempt_id" INTEGER NOT NULL,
  "question_id" INTEGER NOT NULL,
  "selected_option" TEXT,
  "is_correct" INTEGER,
  "time_taken" INTEGER,
  "created_at" TEXT DEFAULT (datetime('now')),
  FOREIGN KEY ("attempt_id") REFERENCES "attempts" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE CASCADE
);

-- Flashcards table
CREATE TABLE IF NOT EXISTS "flashcards" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "question_id" INTEGER NOT NULL UNIQUE,
  "status" TEXT DEFAULT 'new',
  "review_count" INTEGER DEFAULT 0,
  "last_reviewed" TEXT,
  "next_review" TEXT,
  "difficulty" TEXT DEFAULT 'medium',
  "created_at" TEXT DEFAULT (datetime('now')),
  FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE CASCADE
);

-- App Settings table
CREATE TABLE IF NOT EXISTS "app_settings" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "key" TEXT UNIQUE NOT NULL,
  "value" TEXT,
  "created_at" TEXT DEFAULT (datetime('now')),
  "modified_at" TEXT DEFAULT (datetime('now'))
);
`);

console.log('✓ Database tables created successfully');

// Insert initial data
console.log('Inserting initial data...');

// Insert subjects
const insertSubject = db.prepare('INSERT INTO subjects (name) VALUES (?)');
const subjects = [
  'History',
  'Geography',
  'Economics',
  'Political Science',
  'Science & Technology',
  'Environment & Ecology',
  'Current Affairs'
];

const subjectIds = {};
subjects.forEach(subject => {
  const info = insertSubject.run(subject);
  subjectIds[subject] = info.lastInsertRowid;
});

// Insert topics for each subject
const insertTopic = db.prepare('INSERT INTO topics (name, subject_id) VALUES (?, ?)');
const topicData = {
  'History': ['Ancient India', 'Medieval India', 'Modern India', 'World History'],
  'Geography': ['Physical Geography', 'Indian Geography', 'World Geography', 'Economic Geography'],
  'Economics': ['Microeconomics', 'Macroeconomics', 'Indian Economy', 'International Economics'],
  'Political Science': ['Indian Constitution', 'Governance', 'International Relations', 'Political Theory'],
  'Science & Technology': ['Physics', 'Chemistry', 'Biology', 'Technology & Innovation'],
  'Environment & Ecology': ['Ecosystem', 'Climate Change', 'Biodiversity', 'Environmental Policies'],
  'Current Affairs': ['National', 'International', 'Economy', 'Science & Tech']
};

const topicIds = {};
for (const subject in topicData) {
  const subjectId = subjectIds[subject];
  topicData[subject].forEach(topic => {
    const info = insertTopic.run(topic, subjectId);
    if (!topicIds[subject]) topicIds[subject] = {};
    topicIds[subject][topic] = info.lastInsertRowid;
  });
}

// Insert subtopics
const insertSubtopic = db.prepare('INSERT INTO subtopics (name, topic_id) VALUES (?, ?)');
const subtopicData = {
  'History': {
    'Ancient India': ['Indus Valley Civilization', 'Vedic Period', 'Buddhism & Jainism', 'Mauryan Empire'],
    'Medieval India': ['Delhi Sultanate', 'Mughal Empire', 'Vijayanagara Empire', 'Medieval Art & Architecture'],
    'Modern India': ['British Rule', 'Freedom Movement', 'Post-Independence India', 'Social Reforms'],
    'World History': ['Renaissance', 'World Wars', 'Cold War', 'Decolonization']
  },
  'Economics': {
    'Microeconomics': ['Market Structures', 'Consumer Theory', 'Production Theory', 'Price Determination'],
    'Macroeconomics': ['National Income', 'Inflation', 'Monetary Policy', 'Fiscal Policy'],
    'Indian Economy': ['Economic Reforms', 'Agriculture', 'Industry', 'Service Sector'],
    'International Economics': ['Trade Theory', 'Balance of Payments', 'Exchange Rates', 'International Organizations']
  }
};

for (const subject in subtopicData) {
  for (const topic in subtopicData[subject]) {
    const topicId = topicIds[subject][topic];
    subtopicData[subject][topic].forEach(subtopic => {
      insertSubtopic.run(subtopic, topicId);
    });
  }
}

// Create a sample test
const insertTest = db.prepare('INSERT INTO tests (title, description, filename) VALUES (?, ?, ?)');
const testInfo = insertTest.run(
  'Economics BASICS Sample Test',
  'A sample test covering fundamental economics concepts',
  'economics_basics.txt'
);
const testId = testInfo.lastInsertRowid;

// Create sample questions
const insertQuestion = db.prepare(`
  INSERT INTO questions 
  (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, subject_id, topic_id) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleQuestions = [
  {
    question: 'Which of the following is NOT a measure of national income?',
    optionA: 'Gross Domestic Product (GDP)',
    optionB: 'Net National Product (NNP)',
    optionC: 'Consumer Price Index (CPI)',
    optionD: 'Gross National Product (GNP)',
    correctOption: 'C',
    explanation: 'Consumer Price Index (CPI) is a measure of inflation, not national income. GDP, NNP, and GNP are all measures of national income.',
    subject: 'Economics',
    topic: 'Macroeconomics'
  },
  {
    question: 'Which of the following is the apex banking institution in India?',
    optionA: 'State Bank of India',
    optionB: 'Reserve Bank of India',
    optionC: 'NITI Aayog',
    optionD: 'Finance Ministry',
    correctOption: 'B',
    explanation: 'The Reserve Bank of India (RBI) is the central bank and apex monetary authority of India, established on April 1, 1935.',
    subject: 'Economics',
    topic: 'Indian Economy'
  },
  {
    question: 'Fiscal policy in India is formulated by:',
    optionA: 'Reserve Bank of India',
    optionB: 'Ministry of Finance',
    optionC: 'NITI Aayog',
    optionD: 'Securities and Exchange Board of India',
    correctOption: 'B',
    explanation: 'Fiscal policy, which involves government revenue and expenditure decisions, is formulated by the Ministry of Finance in India.',
    subject: 'Economics',
    topic: 'Macroeconomics'
  },
  {
    question: 'In economics, what does "Gresham\'s Law" state?',
    optionA: 'Good money drives out bad money',
    optionB: 'Bad money drives out good money',
    optionC: 'Inflation rises as unemployment falls',
    optionD: 'Prices rise when supply exceeds demand',
    correctOption: 'B',
    explanation: 'Gresham\'s Law states that "bad money drives out good money," meaning that when two currencies are in circulation, people will hoard the more valuable one and spend the less valuable one.',
    subject: 'Economics',
    topic: 'Microeconomics'
  },
  {
    question: 'Which of the following is NOT one of the four factors of production in economics?',
    optionA: 'Land',
    optionB: 'Labor',
    optionC: 'Technology',
    optionD: 'Capital',
    correctOption: 'C',
    explanation: 'The four classical factors of production are Land, Labor, Capital, and Entrepreneurship. Technology is considered a factor affecting productivity rather than a distinct factor of production.',
    subject: 'Economics',
    topic: 'Microeconomics'
  }
];

// Insert sample questions
sampleQuestions.forEach(q => {
  const subjectId = subjectIds[q.subject];
  const topicId = topicIds[q.subject][q.topic];
  
  const questionInfo = insertQuestion.run(
    testId,
    q.question,
    q.optionA,
    q.optionB,
    q.optionC,
    q.optionD,
    q.correctOption,
    q.explanation,
    subjectId,
    topicId
  );
  
  // Add some tags to the questions
  const questionId = questionInfo.lastInsertRowid;
  const insertTag = db.prepare('INSERT INTO tags (name, question_id) VALUES (?, ?)');
  
  // Add subject and topic as tags
  insertTag.run(q.subject, questionId);
  insertTag.run(q.topic, questionId);
  
  // Add some generic tags
  const genericTags = ['UPSC', 'Prelims', 'Important'];
  genericTags.forEach(tag => {
    try {
      insertTag.run(tag, questionId);
    } catch (e) {
      // Ignore duplicate tag errors
    }
  });
  
  // Create a flashcard for this question
  const insertFlashcard = db.prepare('INSERT INTO flashcards (question_id) VALUES (?)');
  insertFlashcard.run(questionId);
});

// Add default app settings
const insertSetting = db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)');
insertSetting.run('theme', 'light');
insertSetting.run('first_run', 'true');
insertSetting.run('db_version', '1.0');

console.log('✓ Initial data inserted successfully');
console.log(`✓ Database created at: ${dbPath}`);
console.log(`✓ Database size: ${(fs.statSync(dbPath).size / 1024 / 1024).toFixed(2)} MB`);

// Close the database connection
db.close();

console.log('===========================================');
console.log('Database initialization completed successfully');
console.log('===========================================');