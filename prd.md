# 🇮🇳 Ascend UPSC - Comprehensive Product Requirements Document

**Version:** 1.0
**Date:** 2024-07-27

**Table of Contents**

1. Introduction
2. Goals
3. User Persona
4. Functional Requirements
   4.1. File Upload, Parsing & Preview (FR-PARSE)
   4.2. AI Integration (Gemini) (FR-AI)
   4.3. Interactive Quiz Mode (FR-QUIZ)
   4.4. Analytics (Post-Test & Overall) (FR-ANALYTICS)
   4.5. Automatic Flashcard System (FR-FLASH)
   4.6. Anki CSV Generation (FR-ANKI)
   4.7. UI/UX & Theming (FR-UI)
   4.8. Settings Side Panel (FR-SETTINGS)
   4.9. Database (FR-DB)
   4.10. Data Management (FR-MANAGE)
5. Non-Functional Requirements (NFR)
6. Implementation Guidelines
7. Appendix: Input File Format Example

---

## 1. Introduction

Ascend UPSC is a sophisticated, Apple-inspired web application designed as a comprehensive test preparation tool for Union Public Service Commission (UPSC) aspirants in India. It focuses on analyzing mock tests provided in a specific text format (`.txt`), enabling efficient revision through automatically generated flashcards, offering interactive quiz experiences with detailed meta-cognitive feedback, and providing structured, visually rich progress tracking both immediately after a test and over the long term.

The platform allows users to upload mock test files adhering to a predefined `#tag` structure (without explanations). It parses this data, enables interactive quizzes, leverages AI (Gemini) for optional explanations, subject tagging, and analytics recommendations, displays in-depth analytics, features an automated flashcard system based on performance, and allows export to Anki. The core workflow is streamlined: **Upload -> (Preview) -> Parse -> Quiz -> Analyze -> Revise (Flashcards/Anki)**.

---

## 2. Goals

* **Primary Goal:** Provide UPSC aspirants with a powerful, intuitive, and aesthetically pleasing platform to upload and analyze mock test performance (from a specific `.txt` format), identify weaknesses (subject-wise, topic-wise, meta-cognitively), and optimize their preparation strategy, creating a personal SWOT database.
* **Secondary Goals:**
  * Reliably parse the specific `#tag` formatted `.txt` files provided by the user, with a preview option.
  * Streamline the conversion of parsed mock tests into interactive digital quiz formats and revision flashcards (internal & Anki).
  * Offer detailed, actionable, and visually engaging insights through comprehensive post-test and overall analytics, enhanced by optional AI features.
  * Enhance learning retention through an integrated, automatic spaced repetition flashcard system for incorrect answers.
  * Provide a seamless, smooth, highly animated, and visually engaging user experience inspired by Apple's design philosophy, featuring multiple customizable themes (including Real Madrid & RCB) and consistent dark/light modes.
  * Integrate AI capabilities (Gemini) *responsibly* for optional answer explanations, subject tagging, and analytics insights, configurable by the user.
  * Ensure robust local data persistence and reliable progress saving.
  * Enable basic data management, including test deletion.

---

## 3. User Persona

* **Name:** Mohd Sajeel Memon
* **Role:** Dedicated UPSC Aspirant
* **Demographics:** 20 Years old, tech-savvy, resides anywhere in India.
* **Needs & Pain Points:**
  * Has mock tests in a specific `.txt` format (`#QuestionStart`, `#AnswerStart` tags, **no** `#Explanation`).
  * Wants deep analysis beyond scores, focusing on *why* errors occur (Knowledge vs. Technique vs. Guesswork vs. Confidence).
  * Needs to identify weak subjects, topics, and meta-cognitive patterns over time.
  * Requires an efficient, *automatic* method for revising mistakes without manual flashcard creation.
  * Seeks insights into knowledge gaps, technique effectiveness, and confidence calibration.
  * Desires visual tracking of progress and performance evolution.
  * Appreciates clean, intuitive, performant, beautiful software with fluid animations and customization options (themes).
  * Wants optional AI assistance for explanations and study guidance.
* **Goals with Ascend UPSC:**
  * Instantly process specific `.txt` mock tests with validation preview.
  * Receive detailed, visual analytics immediately post-quiz and track overall progress.
  * Understand meta-cognitive answering patterns (Knowledge, PoM, Tukke-baazi, Confidence).
  * Utilize auto-generated flashcards for mistake revision within the app.
  * Easily export flashcards to Anki.
  * Track long-term improvement via charts (time vs accuracy, subject trends) and sortable data logs (error log).
  * Get optional AI-driven explanations during review and study advice based on analytics.
  * Customize the look and feel (themes, AI settings) and ensure a smooth mobile experience.
  * Automate analysis and flashcard creation, saving significant manual effort.

---

## 4. Functional Requirements

### 4.1. File Upload, Parsing & Preview (FR-PARSE)

* **FR-PARSE-1:** Allow single `.txt` file upload via drag & drop or browse interface.

* **FR-PARSE-2:** **Upload Preview:** Before final parsing/import, display a preview screen showing the first few questions (e.g., 3-5) as they would be parsed from the selected file. Include navigation arrows (Previous/Next) to cycle through these preview questions. Add "Start Test / Import" and "Go Back / Cancel" buttons.

* **FR-PARSE-3:** Implement a strict, rule-based parser for the exact format (See Appendix):
  
  ```
  #QuestionStart
  Q[Number]) [Full question text, potentially multi-line, may include ASCII tables...]
  [Option a text, e.g., a) Option text or A. Option Text or 1. Statement...]
  [Option b text...]
  [Option c text...]
  [Option d text...]
  #QuestionEnd
  #AnswerStart
  Answer: [Correct Answer Letter and Text, e.g., a) The Preamble or B. 2 only]
  #AnswerEnd
  *(Repeats per question)*
  ```

* **FR-PARSE-4:** Extract accurately:
  
  * `questionText`: Content after `Q[Num])` until first option, preserving line breaks, structure, and rendering **Markdown pipe tables correctly** (e.g., using monospace font, preserving alignment). Handle numbered/lettered statements within the question text.
  * `options`: Object {A, B, C, D} with text, handling various markers (a), A., 1., i.).
  * `correctAnswerLetter`: Normalized uppercase letter (A-D).
  * `correctAnswerText`: Full text after the letter in the Answer block.

* **FR-PARSE-5:** Validate parsed data (after confirmation from preview) for reasonable question count and presence of essential fields.

* **FR-PARSE-6:** Display clear error message on format mismatch or significant parsing failure during final import; halt process.

* **FR-PARSE-7:** Store structured test data (questions, options, answers) in DB with a unique Test ID (filename + timestamp based).

* **FR-PARSE-8:** Enable "Start Interactive Quiz" button only after successful parsing and import.

### 4.2. AI Integration (Gemini) (FR-AI)

* **FR-AI-1:** Integrate Google Gemini API (configurable model, `gemini-2.0-flash` recommended default). Allow user selection of model and API Key input in Settings.
* **FR-AI-2:** **Subject/Topic Tagging (Optional & Controlled):**
  * Trigger: Manual button ("AI Tag") per question during quiz/review, OR optional background process (configurable in Settings) to tag each question *once* (based on `question_id`) when first encountered.
  * Process: Send `questionText` / `options` to Gemini.
  * Prompt: Configurable via Settings (view, edit, save, reset, copy). Instructs classification based on predefined/user-managed subject/topic lists.
  * Output: Suggested tag(s).
  * Storage: Store AI tags in `QuestionTags` DB table, marked 'AI', editable/overridable by user tags. User tags take precedence.
* **FR-AI-3:** **AI Explanation (Optional):**
  * Trigger: Manual button ("Get AI Explanation") available near "Next Question" button during the quiz (after answering) or during review.
  * Process: Send `questionText`, `options`, `correctAnswerLetter`, `correctAnswerText`, and potentially `userSelectedOption` to Gemini.
  * Prompt: Configurable via Settings (view, edit, save, reset, copy). Asks for a concise explanation of the correct answer and potentially why other options are incorrect.
  * Output: Display explanation in a designated area (e.g., modal or expandable section). Render basic Markdown (paragraphs, lists, bold/italics). Prepend explanation with an uncertainty indicator (e.g., `*AI generated explanation, verify if critical.*`).
  * Storage: Do not store explanations by default to manage DB size, regenerate on demand.
* **FR-AI-4:** **Analytics Recommendations:**
  * Trigger: Explicit "Get AI Insights" button on Overall Analytics dashboard.
  * Process: Send filtered analytics summary (key metrics, weak areas, meta-cognitive patterns) to Gemini.
  * Prompt: Configurable via Settings (view, edit, save, reset, copy). Asks for actionable study advice, improvement strategies, and potential areas to focus on based on the provided data.
  * Output: Display AI recommendations clearly in a designated area, marked as AI-generated, with a "Regenerate" option. Render basic Markdown.
* **FR-AI-5:** Use stored API Key/Model from settings. Handle API errors gracefully (show user-friendly message, log error, don't crash). Provide loading indicators for AI operations.
* **FR-AI-6:** **No Parsing Role:** AI is **NOT** used for `.txt` parsing.
* **FR-AI-7:** **No Fact-Checking/Answer Role:** AI does **NOT** determine or validate correct answers from the input file.

### 4.3. Interactive Quiz Mode (FR-QUIZ)

* **FR-QUIZ-1:** Start new quiz session linked to Test ID, assign unique Attempt ID.
* **FR-QUIZ-2:** Name attempt: Default `[Original Filename] - Attempt [Number]`. Allow user renaming. Store name. Auto-increment number for subsequent attempts of the same test.
* **FR-QUIZ-3:** Present one question per card: Show `questionText` (accurately rendering multi-line text and **Markdown pipe tables using monospace font and preserving alignment**), clickable option buttons (A, B, C, D). Use smooth transitions between questions.
* **FR-QUIZ-4:** Stopwatch: Visible MM:SS timer. Start on first question view. Record `timestamp` on answer submission/leave. Stop on final meta-data submit for the last question. Store total quiz `time_seconds`.
* **FR-QUIZ-5:** Answer Submission & Feedback:
  * Record `selected_option` & `timestamp`. Compare with `correctAnswerLetter`.
  * Provide immediate visual feedback (correct/incorrect styling on selected option button). Highlight correct answer button if user was wrong.
  * Disable option buttons post-selection.
  * Store `is_correct` flag.
  * Handle intermittent "failed to submit answer" errors robustly (e.g., retry mechanism, clear user message).
* **FR-QUIZ-6:** Meta-Cognitive Input (Post-Selection/Leave): Reveal smoothly after option selection/leave action. Require one selection for each category before proceeding:
  1. "Knowledge Based?" [Yes ✅ / No ❌]
  2. "Process of Elimination / Logic?" [Yes ✅ / No ❌]
  3. "Pure Guesswork (Tukka)?" [Yes ✅ / No ❌]
  4. "Confidence Level?" [High 🟢 / Medium 🟡 / Low 🔴]
  * Use clear button states (default, selected, hover). Fix any state/aesthetic issues.
  * Record `knowledge_flag`, `technique_flag`, `guesswork_flag`, `confidence_level`.
* **FR-QUIZ-7:** Reveal Correct Answer Text: After meta-cognitive input is submitted, smoothly display the full `correctAnswerText`.
* **FR-QUIZ-8:** Navigation Buttons:
  * **Skip:** Move current question to the end of the quiz queue. No answer/meta recorded yet.
  * **Leave:** Mark question as `is_left=true` (score=0). Trigger meta-cognitive questions (FR-QUIZ-6). Reveal answer text (FR-QUIZ-7). Move to the next question.
  * **Next Question:** Appears after meta-cognitive input/answer reveal. Move to next question.
  * **Generate AI Explanation:** (FR-AI-3) Button appears near "Next Question" after meta input.
* **FR-QUIZ-9:** Undo Answer: Provide an "Undo" button immediately after submitting an answer (before navigating away or getting AI explanation). Reverts the answer submission, meta-cognitive input, score adjustment, and re-enables options for the *current* question. Disappears once "Next Question" is clicked or explanation requested.
* **FR-QUIZ-10:** Tag Display & Editing:
  * Display current tags (User/AI) associated with the question visibly on the card. Ensure tags load correctly and remain visible after answering/interactions.
  * Provide an Edit icon (✏️) to open an interface (modal/popover) to Add/Remove tags. Allow selection from predefined Subject/Topic lists and creation of new custom tags. User tags take precedence over AI tags if conflicts arise.
  * Save tag changes to `QuestionTags` (persist across attempts for the same `question_id`). Maintain a consistent taxonomy for predefined tags.
* **FR-QUIZ-11:** AI Subject Tagging Process: If enabled (FR-AI-2), run tag generation asynchronously (e.g., when question loads or via manual trigger). Display tags once available.
* **FR-QUIZ-12:** Progress Bar & Counter: Animated bar at top. Text: `X / Y Questions Answered/Left`.
* **FR-QUIZ-13:** Auto-Save Progress: Automatically save the current state (answered questions, meta-data, timer, remaining queue) to the database periodically (e.g., every 1-2 minutes) and after each question submission to minimize data loss on browser close/crash.
* **FR-QUIZ-14:** Quiz Completion: On submitting the final question's meta-data, stop timer, perform final save of the attempt state, calculate initial analytics, and automatically redirect smoothly to the End-of-Test Analytics screen (FR-ANALYTICS-TEST). Ensure this transition is reliable.
* **FR-QUIZ-15:** Hide Analytics Access: Disable access to the main Analytics dashboards (Overall Analytics) while a quiz session is active.

### 4.4. Analytics (Post-Test & Overall) (FR-ANALYTICS)

* **FR-ANALYTICS-TEST-1:** **End-of-Test Summary Screen:** Auto-display immediately post-quiz. Show Test Name, Attempt Name, Date, Total Time Taken.
* **FR-ANALYTICS-TEST-2:** **Performance Overview:** Display key metrics: Overall Score, Accuracy %, Correct, Incorrect, Left.
* **FR-ANALYTICS-TEST-3:** **Detailed Subject/Topic Breakdown Table:** (Sortable, Horizontally Scrollable/Responsive on mobile). Rows per Subject/Topic + Overall.
  * Columns: Subject/Topic, Attempts (within this test, usually 1), Correct, Incorrect, Left, Score (calculated based on FR-ANALYTICS-TEST-5), Accuracy % (C / (C+I)), Avg Time/Q (secs), Confidence Breakdown (High% Mid% Low%), Meta-Cognitive Flags (% Knowledge, % Technique/PoM, % Guesswork/Tukka).
  * Ensure data accuracy and fix any calculation bugs.
* **FR-ANALYTICS-TEST-4:** **Graphical Representation (Interactive Charts - e.g., Chart.js):**
  * Overall Pie Chart (Correct / Incorrect / Left).
  * Subject/Topic Accuracy Bar Chart.
  * Confidence Distribution Pie Chart.
  * Meta-cognitive Strategy Bar Chart (% Knowledge / Technique / Guesswork).
  * Optional: Time per Question Distribution Histogram.
  * Ensure charts render correctly without glitches.
* **FR-ANALYTICS-TEST-5:** **Scoring Logic:** Configurable scoring (Default: UPSC GS: +2 Correct, -0.66 Incorrect, 0 Left/Skipped; UPSC CSAT: +2.5 Correct, -0.83 Incorrect, 0 Left/Skipped). Apply per question based on test type/tags if available, otherwise use a default. Calculate score per subject/topic and overall.
* **FR-ANALYTICS-TEST-6:** **Action Buttons:** Re-attempt Test, New Test (Upload), View Overall Analytics, Review Answers (browse this specific attempt's questions showing user answer, correct answer, meta-data, tags, time taken).
* **FR-ANALYTICS-TEST-7:** Persist calculated attempt analytics (`QuizAttempts` table) and raw answer details (`UserAnswers` table) to DB.
* **FR-ANALYTICS-OVERALL-1:** **Overall Analytics Dashboard Access:** Via Settings panel or link from End-of-Test screen.
* **FR-ANALYTICS-OVERALL-2:** **Scope & Filtering:** Aggregate data from ALL saved attempts. Provide comprehensive interactive filter controls:
  * Date Range (Presets & Custom).
  * Subject(s) / Topic(s) (Multi-select, based on User/AI tags).
  * Specific Tag(s) (Multi-select).
  * Test Name(s) (Multi-select).
  * Confidence Level(s).
  * Meta-cognitive Flags (e.g., Show only 'Guesswork=True AND Incorrect').
* **FR-ANALYTICS-OVERALL-3:** **Visualizations (Dynamic, Filterable Charts - e.g., Chart.js):**
  * Performance Trend: Score / Accuracy % over time (Line chart).
  * Subject/Topic Comparison: Accuracy % / Score per subject/topic (Bar chart). Group tags by subject.
  * Meta-cognitive Insights:
    * Knowledge/Confidence Calibration: Accuracy % vs. Confidence Level (Bar/Line chart).
    * Technique/Guesswork Effectiveness: Accuracy % when Technique/Guesswork flags were used (Bar chart).
    * Trends over time for meta-cognitive patterns (Stacked Bar/Line).
  * Activity Heatmap: Test frequency / Performance intensity over calendar days/weeks.
  * Time Analysis: Distribution of time taken per question (Histogram), Time vs. Accuracy (Scatter plot, optional).
  * Ensure charts are accurate, responsive, and free of glitches.
* **FR-ANALYTICS-OVERALL-4:** **Data Exploration Views (Filterable/Sortable Tables):**
  * **Detailed Error Log:** List of all incorrect answers matching filters. Columns: Date, Test Name, Q#, Question Text (partial/tooltip), User Answer, Correct Answer, User/AI Tags, Time Taken, Confidence, Meta-cognitive flags. Include classification (if tagged) and track improvement status (e.g., 'Reviewed', 'Flashcard Created').
  * Correct Log / Left Log: Similar tables for correct/left answers.
  * Filtered Views: Pre-defined views filtered by specific meta-cognitive responses (e.g., "Low Confidence Corrects", "High Confidence Errors", "Successful Guesses").
* **FR-ANALYTICS-OVERALL-5:** **Improvement Tracking:** Display comparative metrics between two user-defined periods based on filters (e.g., accuracy change in 'Polity' from last month to this month). Use progress indicators/summary stats.
* **FR-ANALYTICS-OVERALL-6:** **AI Recommendations (FR-AI-4):** "Get AI Insights" button triggers display based on *currently applied filters*. Render insights with Markdown support.
* **FR-ANALYTICS-OVERALL-7:** **Interface:** Present overall analytics within a clean, possibly tabbed interface for different views (Dashboard, Error Log, Trends, etc.). Ensure interface is themeable.

### 4.5. Automatic Flashcard System (FR-FLASH)

* **FR-FLASH-1:** **Auto-Creation:** Automatically add `question_id` to the flashcard pool (`Flashcards` table) when a question is answered **Incorrectly** during a quiz. Associate relevant question tags. (Optional setting: add Left/Skipped questions too). Ensure a question is added only once, even if answered incorrectly multiple times across different attempts.
* **FR-FLASH-2:** **Flashcard Deck Access:** Via a dedicated "Flashcards" button/section, likely accessible from the Settings panel or main navigation.
* **FR-FLASH-3:** **Deck Filtering & Study Options:** Allow users to study flashcards filtered by: Subject, Topic, Tag, Source Test, Status (New, Learning, Due).
* **FR-FLASH-4:** **Spaced Repetition System (SRS):**
  * Algorithm: Implement a simplified SM-2 like logic. Store `interval` (days), `ease_factor`, `due_date`, `status` ('New', 'Learning', 'Review') for each flashcard in the DB.
  * Study Queue: Present cards that are `due_date <= today` or 'New', respecting selected filters. Prioritize 'Learning'/'Review' cards due today over 'New' cards.
  * Interface:
    * Front: Display `questionText` and `options`.
    * Back (On Reveal): Display `correctAnswerLetter` + `correctAnswerText`.
  * User Rating: Provide buttons like "Again" (reset interval), "Hard" (small interval increase), "Good" (standard interval increase based on ease), "Easy" (larger interval increase).
  * Scheduling: Update card's `interval`, `ease_factor`, `due_date`, and `status` in the DB based on user rating.
* **FR-FLASH-5:** **Progress Statistics:** Display key flashcard stats: "X Cards Due Today", "Y New Cards", "Z Total Cards in Deck".

### 4.6. Anki CSV Generation (FR-ANKI)

* **FR-ANKI-1:** Provide a "Generate Anki CSV" button, likely available after parsing a test or from a test list/history view. Acts on a specific `test_id`.
* **FR-ANKI-2:** Generate a `.csv` file from the parsed test data (all questions within that `test_id`).
* **FR-ANKI-3:** **Format:** Comma-separated (`,`), UTF-8 encoding. Fields containing commas, double quotes, or newlines MUST be enclosed in double quotes (`"`). Double quotes within a field should be escaped as `""`.
* **FR-ANKI-4:** **Columns (Strict Order):**
  1. **Front:** `"[Full Question Text]\n\n[Option A Text]\n\n[Option B Text]\n\n[Option C Text]\n\n[Option D Text]"` (Ensure literal double newlines `\n\n` between question and options, and between options. Entire content enclosed in double quotes).
  2. **Back:** `"[Correct Letter]) [Correct Answer Text]"` (e.g., `"a) The Preamble"`, enclosed in double quotes).
  3. **Tags:** `"[Tag1 Tag2 Tag3...]"` (Space-separated list of all associated User/AI tags for the question, enclosed in double quotes).
* **FR-ANKI-5:** Initiate immediate CSV download upon button click. Suggested filename: `[Original_Test_Filename]_Anki.csv`.

### 4.7. UI/UX & Theming (FR-UI)

* **FR-UI-1:** **Aesthetic:** Strict Apple-inspired design: clean, minimalist, intuitive layout. Utilize fonts like SF Pro Text/Inter or similar sans-serif families. Ensure ample white space, clear visual hierarchy, and focus on elegance and fluidity.
* **FR-UI-2:** **Animations & Transitions:** Implement high-quality, smooth (target 60fps), non-jarring animations using CSS transitions/animations or a suitable JS library (if needed) for: screen transitions, panel slide-ins (Settings), button interactions, feedback messages, progress bars, question card transitions, modal reveals. Respect `prefers-reduced-motion`.
* **FR-UI-3:** **Dark/Light Mode:** Global toggle (e.g., ☀️/🌙 icon in header/settings). Apply smoothly without page reload. Persist user preference (e.g., in `localStorage` and DB `UserSettings`). Ensure high contrast and readability in both modes for all themes.
* **FR-UI-4:** **Theming:**
  * Provide theme selection via Settings panel (visual swatches).
  * Implement themes: Apple (Default), Gucci, Cyberpunk, Coffee, **Real Madrid**, **RCB**.
  * Use CSS variables extensively for colors, fonts, spacing etc., to allow easy theme switching.
  * Each theme MUST have distinct, well-tested Light and Dark modes, ensuring excellent readability and contrast ratios (aim WCAG AA). Apply themes consistently across the *entire* application (modals, charts, panels, etc.). Prevent app reload on theme change.
  * Persist selected theme. Fix any theme button alignment, spacing, or icon issues.
* **FR-UI-5:** **Branding & Navigation:**
  * Display title `🇮🇳 Ascend UPSC` prominently (e.g., header).
  * Make the main title/logo clickable, navigating the user to the home/dashboard screen.
* **FR-UI-6:** **Scroll Bars:** Utilize minimal themed scrollbars or clean native browser scrollbars for constrained content areas (e.g., side panels, long question text, tables). Ensure `overflow: auto;` is used appropriately. Ensure universal scrollability where content might overflow its container.
* **FR-UI-7:** **Responsiveness:** Primarily target Desktop/Laptop resolutions. Ensure graceful adaptation to Tablet and Mobile viewports. Optimize layouts, text flow, and interactions (e.g., button sizes, table display) for smaller screens. Avoid horizontal scrolling on the main page content. Fix options going out of bounds in mobile view.
* **FR-UI-8:** **Button States:** Implement clear, visually distinct, and themed states for all interactive elements (buttons, toggles, inputs): `:default`, `:hover`, `:active`, `:focus`, `:disabled`.
* **FR-UI-9:** **Feedback & Loading States:** Provide clear visual feedback for user actions: upload progress, saving confirmation (e.g., settings saved checkmark), loading indicators (spinners, skeleton screens) during data fetching, parsing, or AI operations.
* **FR-UI-10:** **Typography:** Use primary font (SF Pro Text/Inter/sans-serif) consistently. Use a monospace font (e.g., `JetBrains Mono`, `Fira Code`, `monospace`) specifically for rendering code blocks or **text-based tables within questions** to maintain alignment. Ensure text is legible and respects browser zoom settings.
* **FR-UI-11:** **Micro-interactions:** Incorporate subtle effects for enhanced UX: smooth hovers, toggle switches, loading animations, subtle button presses.
* **FR-UI-12:** **Accessibility:** Strive for WCAG 2.1 AA compliance: ensure sufficient color contrast, support keyboard navigation with visible focus indicators, use semantic HTML, provide ARIA attributes where necessary.
* **FR-UI-13:** **Optional Enhancements (Configurable if performance impact):** Themed cursors, subtle background textures (Coffee theme), visual effects (Cyberpunk scanlines, Apple blur - use sparingly). Sound effects for actions (off by default).
* **FR-UI-14:** **Markdown Rendering:** Support basic Markdown rendering (paragraphs, bold, italics, lists, pipe tables) in question display (FR-PARSE-4), AI explanations (FR-AI-3), and AI analytics insights (FR-AI-4).

### 4.8. Settings Side Panel (FR-SETTINGS)

* **FR-SETTINGS-1:** **Access & Behavior:** Accessible via a persistent Gear icon (⚙️). Panel should slide in smoothly from the side (e.g., right). Content within the panel must be scrollable if it exceeds viewport height. Include a clear Close button (X).
* **FR-SETTINGS-2:** **Navigation:** Use clear sections or tabs within the panel for organizing settings: General, Gemini AI, Theme, Prompt Management, History, Data Management.
* **FR-SETTINGS-3:** **Gemini AI Settings:**
  * Dropdown to select Gemini Model (e.g., `gemini-1.5-flash`, `gemini-pro`).
  * Input field for API Key (masked, with show/hide toggle).
  * Save button with clear confirmation feedback (e.g., "Settings Saved ✓").
  * Option to enable/disable background AI tagging (FR-AI-2).
  * Option to enable/disable adding Left/Skipped questions to flashcards (FR-FLASH-1).
* **FR-SETTINGS-4:** **Theme Settings:** Display visual swatches for available themes (Apple, Gucci, Cyberpunk, Coffee, Real Madrid, RCB). Clicking a swatch should immediately apply the theme across the app (light/dark mode respected) and persist the choice.
* **FR-SETTINGS-5:** **Prompt Customization:**
  * Provide labeled text areas to view and edit the prompts used for: AI Subject Tagging, AI Explanation, AI Analytics Recommendations.
  * Include buttons: "Save Changes", "Reset to Default", "Copy Prompt". Provide confirmation on save.
* **FR-SETTINGS-6:** **History:** Display a scrollable, searchable list of past test attempts (Attempt Name, Test Name, Date, Score/Accuracy). Clicking an entry should navigate to that specific attempt's detailed analytics screen (FR-ANALYTICS-TEST).
* **FR-SETTINGS-7:** **Links:** Provide clear buttons/links to navigate to the Overall Analytics dashboard (FR-ANALYTICS-OVERALL) and the Flashcard study interface (FR-FLASH).
* **FR-SETTINGS-8:** **Persistence:** All settings (API Key, Model, Prompts, Theme, Mode, optional toggles) must be saved reliably (e.g., `localStorage` or DB `UserSettings`) and loaded on app start.

### 4.9. Database (FR-DB)

* **FR-DB-1:** **Technology:** Utilize SQLite, likely via `sql.js` for client-side storage or potentially a wrapper if using Electron/Tauri for a desktop version. Ensure reliable data persistence.
* **FR-DB-2:** **Schema (Conceptual - Needs Refinement):**
  * `UserSettings`: (id PK, theme, dark_mode, api_key, gemini_model, tagging_prompt, explanation_prompt, analytics_prompt, auto_ai_tagging_enabled, flashcard_left_skipped)
  * `Tests`: (test_id PK, filename TEXT, upload_timestamp INTEGER, total_questions INTEGER)
  * `Questions`: (question_id PK, test_id FK REFERENCES Tests, q_number INTEGER, q_text TEXT, opt_a TEXT, opt_b TEXT, opt_c TEXT, opt_d TEXT, correct_letter TEXT, correct_text TEXT)
  * `Tags`: (tag_id PK, tag_name TEXT UNIQUE) -- Central tag list
  * `QuestionTags`: (qt_id PK, question_id FK REFERENCES Questions, tag_id FK REFERENCES Tags, source TEXT CHECK(source IN ('AI', 'User')), UNIQUE(question_id, tag_id)) -- Many-to-many linking Qs and Tags
  * `QuizAttempts`: (attempt_id PK, test_id FK REFERENCES Tests, user_attempt_name TEXT, start_timestamp INTEGER, end_timestamp INTEGER, time_seconds INTEGER, score REAL, correct_n INTEGER, incorrect_n INTEGER, left_n INTEGER)
  * `UserAnswers`: (answer_id PK, attempt_id FK REFERENCES QuizAttempts, question_id FK REFERENCES Questions, selected_opt TEXT, is_correct INTEGER, is_left INTEGER, submission_timestamp INTEGER, knowledge_flag INTEGER, technique_flag INTEGER, guesswork_flag INTEGER, confidence_level TEXT)
  * `Flashcards`: (flashcard_id PK, question_id FK REFERENCES Questions UNIQUE, due_date INTEGER, interval REAL, ease_factor REAL, status TEXT CHECK(status IN ('New', 'Learning', 'Review')))
* **FR-DB-3:** **Indexing:** Implement indexes on Foreign Keys (FKs) and columns frequently used in WHERE clauses or JOINs (e.g., `timestamp` fields, `tag_id`, `question_id`, `attempt_id`, `is_correct`, `confidence_level`, `due_date`, `status`). Ensure schema supports efficient linking between tables.
* **FR-DB-4:** **Data Integrity:** Use constraints (UNIQUE, CHECK, FKs) where appropriate. Handle database operations robustly, including error handling and potential migrations if the schema evolves. Ensure reliable saving of all user progress and generated data.

### 4.10. Data Management (FR-MANAGE)

* **FR-MANAGE-1:** **Delete Test:** Provide the ability to delete an entire test (`test_id`) and all associated data (questions, attempts, answers, tags specific only to its questions) from the database. This action should require user confirmation (e.g., modal dialog "Are you sure you want to delete '[Test Name]' and all its data? This cannot be undone."). Access likely via the Test History list in Settings.
* **FR-MANAGE-2:** **Manage Tags:** (Optional - Future Enhancement) Interface to view, rename, merge, or delete custom user-created tags from the central `Tags` list.

---

## 5. Non-Functional Requirements (NFR)

* **NFR-ACCURACY-1:** Parser must be 100% accurate for the specified `.txt` format. Scoring, analytics calculations, and SRS logic must be precise and correct. Fix any existing inaccuracies in analytics data.
* **NFR-PERFORMANCE-1:** UI interactions (button clicks, panel opens, tab switches) should feel instantaneous (< 200ms). Animations should be consistently smooth (target 60fps). Reduce loading times across the application.
* **NFR-PERFORMANCE-2:** Parsing of typical test files (e.g., 100 questions) should complete quickly (< 2 seconds after preview confirmation).
* **NFR-PERFORMANCE-3:** Analytics dashboard (Overall) loading and filtering should be performant, even with significant data (< 3 seconds for typical operations). Optimize database queries.
* **NFR-PERFORMANCE-4:** AI API calls must be asynchronous, non-blocking, with clear loading indicators.
* **NFR-USABILITY-1:** Application must be highly intuitive, requiring minimal learning curve for the target user. Interface should be aesthetically pleasing and engaging.
* **NFR-USABILITY-2:** Provide clear, concise feedback for all operations. Ensure high readability and legibility across all themes and modes (aim WCAG AA contrast).
* **NFR-RELIABILITY-1:** Application must be stable. No loss of user data (test results, settings, flashcard progress). Core features (parsing, quiz, analytics, flashcards) must function reliably. Fix intermittent errors like "failed to submit answer".
* **NFR-RELIABILITY-2:** Theme and Dark/Light mode switching must be flawless and instantly applied without requiring page reloads or causing display issues.
* **NFR-RELIABILITY-3:** Implement robust error handling for file operations (upload, parsing), database interactions (saving, querying), and API calls (network errors, invalid keys). Display user-friendly error messages. Ensure reliable behavior after the last question (transition to analytics).
* **NFR-SECURITY-1:** Follow standard security practices for web/local applications. Inform the user clearly if the API key is stored in browser `localStorage` (less secure) vs. a more secure local store if using a wrapper technology. Do not expose sensitive data unnecessarily.
* **NFR-MAINTAINABILITY-1:** Codebase should be well-structured, modular, and commented. Utilize CSS variables extensively for theming. Follow consistent coding standards.
* **NFR-COMPATIBILITY-1:** Ensure compatibility with latest versions of major modern web browsers (Chrome, Firefox, Safari, Edge).

---

## 6. Implementation Guidelines

* **Framework:** Consider a modern JavaScript framework (React, Vue, Svelte) for building the UI components and managing state.
* **Styling:** Use CSS-in-JS, Tailwind CSS, or well-structured CSS/SASS with heavy reliance on CSS variables for theming and dark/light modes.
* **Charting:** Use a library like Chart.js, D3.js (if complex visualizations needed), or other suitable charting libraries. Ensure they are themeable.
* **Database:** Use Python's built-in sqlite3 (SQLite).
* **State Management:** Employ a robust state management solution if using React/Vue (e.g., Redux Toolkit, Zustand, Pinia).
* **AI Integration:** Use official Google Gemini SDKs/APIs.
* **Animations:** Leverage CSS transitions/animations where possible for performance. Use a minimal JS animation library (like Framer Motion for React) if complex animations are required.

---

## 7. Appendix: Input File Format Example

*(This confirms the expected input format the parser (FR-PARSE) needs to handle)*

```text
#QuestionStart
Q1) The mind of the makers of the Constitution of India is reflected in which of the following?
a) The Preamble
b) The Fundamental Rights
c) The Directive Principles of State Policy
d) The Fundamental Duties
#QuestionEnd
#AnswerStart
Answer: a) The Preamble
#AnswerEnd

#QuestionStart
Q3) Consider the following pairs with reference to making of the Constitution of India:
| Personality               | Role  in  Constitutional Making                  |
|---------------------------|----------------------------------------------------|
| 1. K.M. Munshi            | Member  of  the  Drafting Committee of the Constitution |
| 2. B.N. Rau               | Constitutional  Advisor  to the Constituent Assembly |
| 3. Alladi Krishnaswami Ayyar | Chairman of the Steering Committee of the Constituent Assembly |
How many pairs given above are correctly matched?
a) Only one
b) Only two
c) All three
d) None
#QuestionEnd
#AnswerStart
Answer: b) Only two
#AnswerEnd

#QuestionStart
Q4) In the context of Constitution of India, consider the following provisions:
1. The Centre altering the names and boundaries of States unilaterally.
2. Unequal representation of states in the Rajya Sabha.
3. Different federal arrangements for Union Territories compared to states.
How many of the above are examples of the asymmetric federalism in India?
a) Only one
b) Only two
c) All three
d) None
#QuestionEnd
#AnswerStart
Answer: c) All three
#AnswerEnd

#QuestionStart
Q1) Consider the following statements regarding Negotiated Dealing System–Order Matching (NDS-OM):
1. It is an electronic trading platform for primary market transactions in government securities (G-sec).
2. Non-bank brokers registered with SEBI can directly access NDS-OM.
Which of the statements given above is/are correct?
A. 1 only
B. 2 only
C. Both 1 and 2
D. Neither 1 nor 2
#QuestionEnd
#AnswerStart
Answer: B. 2 only
#AnswerEnd

#QuestionStart
Q9) Consider the following statements regarding Short Term Capital Gains Tax in India:
1. It refers to a tax on the gain that arises from the sale of an asset after holding it less than sixty months.
2. Securities Transaction Tax (STT) is an indirect tax levied on sale and purchase of equities.
Which of the statements given above is/are not correct?
A. 1 only
B. 2 only
C. Both 1 and 2
D. Neither 1 nor 2
#QuestionEnd
#AnswerStart
Answer: C. Both 1 and 2
#AnswerEnd
```

---

**End of Document**

A web-based UPSC exam preparation platform that converts text-based mock tests into interactive study materials with comprehensive analytics and flashcard functionality.

Core Features:

- Parse specially formatted .txt files with #tag format (including multi-line questions and Markdown tables) into structured test data, with a preview step before import.

- Interactive quiz interface presenting one question at a time, with immediate feedback, smooth transitions, and a stopwatch.

- Meta-cognitive input tracking post-answer for Knowledge, Process of Elimination/Logic, Guesswork (Tukka), and Confidence Level (High/Medium/Low).

- Optional Google Gemini AI integration (configurable model & API key) for on-demand explanations during quiz/review, automated subject/topic tagging (user-controlled), and analytics recommendations, using customizable prompts.

- Comprehensive analytics dashboard (post-test summary and filterable overall trends) showing performance metrics (score, accuracy, time), subject/topic breakdowns, meta-cognitive patterns (e.g., Confidence vs Accuracy), graphical charts, and a detailed sortable error log.

- Automatic flashcard creation system for incorrectly answered questions (optionally for left questions), featuring a built-in Spaced Repetition System (SRS) for studying.

- Ability to generate Anki-compatible CSV exports from parsed tests.

- Robust local data persistence using a database (originally planned SQLite, will use PostgreSQL as per REPLIT's limitations) to save tests, questions, attempts, answers, meta-data, tags, flashcard progress, and user settings.

- Highly animated, customizable UI inspired by Apple, featuring multiple themes (Apple, Gucci, Cyberpunk, Coffee, Real Madrid, RCB) with consistent light/dark modes.

- Settings side panel for managing AI configuration, theme selection, prompt customization, viewing test history, and accessing data management options (like deleting tests).

Visual References:  
Combines Apple's premium minimalist design (clean, intuitive, fluid animations) with Quizlet's educational interface structure (card-based quizzes, animations, progress tracking), emphasizing clean typography, clear visual hierarchy, and intuitive navigation.

Style Guide:

- Colors: Primary #007AFF (iOS blue), Secondary #34C759 (success green), Background #F5F5F7 (light grey - light mode), Text #1D1D1F (near black - light mode), Accent #FF3B30 (attention red). Dark mode variants defined per theme.

- Design: SF Pro Text/Inter/similar sans-serif fonts (primary), Monospace font (e.g., JetBrains Mono, Fira Code) for text tables within questions. Card-based layout with ample white space, consistent padding (e.g., 24px), subtle shadows, smooth 60fps animations/transitions, responsive design adapting gracefully to tablet/mobile.

- Components: Clean, sortable, scrollable tables; interactive charts (e.g., Chart.js); animated progress indicators; tabbed navigation or clear sections; themed minimal scrollbars; distinct button states (:default, :hover, :active, :focus, :disabled); clear loading indicators (spinners, skeletons)
