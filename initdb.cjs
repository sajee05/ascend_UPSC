/**
 * Database initialization script
 * Run this script to create and initialize the SQLite database with sample data
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'ascend-upsc.db');

console.log(`Initializing SQLite database at: ${dbPath}`);

// Remove existing database if it exists
if (fs.existsSync(dbPath)) {
  console.log('Removing existing database...');
  fs.unlinkSync(dbPath);
}

// Create new database
const db = new Database(dbPath);

// Create tables
console.log('Creating tables...');

// Subjects table
db.exec(`
  CREATE TABLE subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  )
`);

// Topics table
db.exec(`
  CREATE TABLE topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )
`);

// Tests table
db.exec(`
  CREATE TABLE tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    difficulty TEXT,
    time_limit INTEGER,
    total_questions INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  )
`);

// Questions table
db.exec(`
  CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (test_id) REFERENCES tests(id)
  )
`);

// Question subjects junction table
db.exec(`
  CREATE TABLE question_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )
`);

// Question topics junction table
db.exec(`
  CREATE TABLE question_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
  )
`);

// Tags table
db.exec(`
  CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    tag_name TEXT NOT NULL,
    is_ai_generated INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id)
  )
`);

// Attempts table
db.exec(`
  CREATE TABLE attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    total_time_seconds INTEGER,
    completed INTEGER NOT NULL DEFAULT 0,
    score REAL,
    correct_count INTEGER,
    incorrect_count INTEGER,
    left_count INTEGER,
    FOREIGN KEY (test_id) REFERENCES tests(id)
  )
`);

// User answers table
db.exec(`
  CREATE TABLE user_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_option TEXT,
    is_correct INTEGER,
    is_left INTEGER,
    answer_time INTEGER,
    knowledge_flag INTEGER DEFAULT 0,
    technique_flag INTEGER DEFAULT 0,
    guesswork_flag INTEGER DEFAULT 0,
    confidence INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (attempt_id) REFERENCES attempts(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
  )
`);

// Flashcards table
db.exec(`
  CREATE TABLE flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    last_reviewed_at TEXT,
    next_review_at TEXT,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 1,
    review_count INTEGER NOT NULL DEFAULT 0,
    difficulty_rating INTEGER,
    notes TEXT,
    FOREIGN KEY (question_id) REFERENCES questions(id)
  )
`);

// Users table (for future use)
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )
`);

// Insert sample data
console.log('Inserting sample data...');

// Subjects
const now = new Date().toISOString();
const insertSubject = db.prepare(`
  INSERT INTO subjects (name, description, created_at) 
  VALUES (?, ?, ?)
`);

// Insert some default subjects
const subjects = [
  { name: 'Economics', description: 'Economic concepts and theories' },
  { name: 'History', description: 'Historical events and developments' },
  { name: 'Geography', description: 'Physical and human geography' },
  { name: 'Polity', description: 'Political systems and governance' },
  { name: 'Science & Technology', description: 'Scientific and technological concepts' },
  { name: 'Environment', description: 'Environmental issues and ecology' },
  { name: 'International Relations', description: 'Global politics and diplomacy' },
];

subjects.forEach(subject => {
  insertSubject.run(subject.name, subject.description, now);
});

// Topics
const insertTopic = db.prepare(`
  INSERT INTO topics (subject_id, name, description, created_at) 
  VALUES (?, ?, ?, ?)
`);

// Insert some topics for Economics
const economicsTopics = [
  { name: 'Macroeconomics', description: 'Study of economy-wide phenomena' },
  { name: 'Monetary Policy', description: 'Central bank policies affecting money supply' },
  { name: 'Fiscal Policy', description: 'Government spending and taxation' },
  { name: 'International Trade', description: 'Exchange of goods and services across borders' },
];

economicsTopics.forEach(topic => {
  insertTopic.run(1, topic.name, topic.description, now);
});

// Create a sample test
const insertTest = db.prepare(`
  INSERT INTO tests (name, description, difficulty, time_limit, total_questions, created_at) 
  VALUES (?, ?, ?, ?, ?, ?)
`);

const testId = insertTest.run(
  'Economics Basics Quiz',
  'Test your knowledge of basic economic concepts',
  'medium',
  30,
  5,
  now
).lastInsertRowid;

// Insert sample questions
const insertQuestion = db.prepare(`
  INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, created_at) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const questions = [
  {
    question: 'Which of the following is NOT a function of the Reserve Bank of India?',
    optionA: 'Banker to the Government',
    optionB: 'Issuing currency notes',
    optionC: 'Directly lending to farmers',
    optionD: 'Banker\'s Bank',
    correctAnswer: 'C',
    explanation: 'The RBI does not directly lend to farmers. Agricultural lending is done through commercial banks, regional rural banks, and cooperative banks.',
  },
  {
    question: 'Gross Domestic Product (GDP) measures:',
    optionA: 'The total value of goods and services produced within a country in a year',
    optionB: 'The total income of all citizens of a country',
    optionC: 'The difference between exports and imports',
    optionD: 'The total government revenue in a fiscal year',
    correctAnswer: 'A',
    explanation: 'GDP measures the total market value of all final goods and services produced within a country in a specific time period.',
  },
  {
    question: 'Inflation targeting in India is the responsibility of:',
    optionA: 'Ministry of Finance',
    optionB: 'NITI Aayog',
    optionC: 'Reserve Bank of India',
    optionD: 'Securities and Exchange Board of India',
    correctAnswer: 'C',
    explanation: 'The Reserve Bank of India (RBI) is responsible for inflation targeting in India through its monetary policy framework.',
  },
  {
    question: 'Which of the following is an example of direct tax?',
    optionA: 'Goods and Services Tax (GST)',
    optionB: 'Income Tax',
    optionC: 'Excise Duty',
    optionD: 'Customs Duty',
    correctAnswer: 'B',
    explanation: 'Income tax is a direct tax as it is levied directly on the income of individuals and cannot be transferred to another person.',
  },
  {
    question: 'The Monetary Policy Committee (MPC) in India comprises:',
    optionA: '3 members from RBI and 3 external members',
    optionB: '4 members from RBI and 2 external members',
    optionC: '2 members from RBI and 4 external members',
    optionD: 'All members are from RBI',
    correctAnswer: 'A',
    explanation: 'The MPC consists of six members - three officials from the RBI (including the Governor) and three external members appointed by the Government of India.',
  }
];

const insertQuestionSubject = db.prepare(`
  INSERT INTO question_subjects (question_id, subject_id) 
  VALUES (?, ?)
`);

const insertTag = db.prepare(`
  INSERT INTO tags (question_id, tag_name, is_ai_generated, created_at) 
  VALUES (?, ?, ?, ?)
`);

// Insert questions and link to subjects and tags
questions.forEach((q, index) => {
  const questionId = insertQuestion.run(
    testId,
    q.question,
    q.optionA,
    q.optionB,
    q.optionC,
    q.optionD,
    q.correctAnswer,
    q.explanation,
    now
  ).lastInsertRowid;
  
  // Link question to the Economics subject
  insertQuestionSubject.run(questionId, 1); // Economics subject id is 1
  
  // Add some tags to the questions
  const tags = ['UPSC', 'Economics', 'Basics'];
  tags.forEach(tag => {
    insertTag.run(questionId, tag, 0, now);
  });
});

console.log('Database initialization completed successfully!');
db.close();