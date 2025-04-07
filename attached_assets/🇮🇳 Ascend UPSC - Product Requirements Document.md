# 🇮🇳 Ascend UPSC - Product Requirements Document

**Table of Contents**

1. Introduction
2. Goals
3. User Persona
4. Functional Requirements
   4.1. File Upload & Fixed Format Parsing (FR-PARSE)
   4.2. AI Integration (Gemini - Limited Role) (FR-AI)
   4.3. Anki CSV Generation (FR-ANKI)
   4.4. Interactive Quiz Mode (FR-QUIZ)
   4.5. Analytics (FR-ANALYTICS)
   4.6. Automatic Flashcard System (FR-FLASH)
   4.7. UI/UX & Theming (FR-UI)
   4.8. Settings Side Panel (FR-SETTINGS)
   4.9. Database (FR-DB)
5. Non-Functional Requirements (NFR)
6. Implementation Guidelines
7. Appendix: Input File Format Example

---

## 1. Introduction

Ascend UPSC is a sophisticated, Apple-inspired web application designed as a comprehensive test preparation tool for Union Public Service Commission (UPSC) aspirants in India. It focuses on analyzing mock tests provided in a specific text format, enabling efficient revision through automatically generated flashcards, offering interactive quiz experiences with meta-cognitive feedback, and providing structured, visually rich progress tracking.

The platform allows users to upload mock test files (`.txt`) adhering to a predefined `#tag` structure (without explanations). It parses this data, enables interactive quizzes, generates Anki-compatible CSVs, leverages AI (Gemini) for optional subject tagging and analytics recommendations, displays in-depth analytics, and features an automated flashcard system based on performance. The core workflow is streamlined: **Upload -> Quiz -> Analyze -> Revise (Flashcards/Anki)**.

---

## 2. Goals

* **Primary Goal:** Provide UPSC aspirants with a powerful, intuitive, and aesthetically pleasing platform to analyze mock test performance (from a specific `.txt` format), identify weaknesses, and optimize their preparation strategy both immediately after a test and over time, creating a personal SWOT database.
* **Secondary Goals:**
  * Reliably parse the specific `#tag` formatted `.txt` files provided by the user.
  * Streamline the conversion of parsed mock tests into interactive digital quiz formats and revision flashcards (internal & Anki).
  * Offer detailed, actionable, and visually engaging insights through comprehensive analytics, enhanced by optional AI recommendations.
  * Enhance learning retention through an integrated, automatic spaced repetition flashcard system for incorrect answers.
  * Provide a seamless, smooth, highly animated, and visually engaging user experience inspired by Apple's design philosophy, featuring multiple themes.
  * Integrate AI capabilities (Gemini) *responsibly* for optional subject tagging and analytics insights, configurable by the user.
  * Ensure robust local data persistence.

---

## 3. User Persona

* **Name:** Mohd Sajeel Memon
* **Role:** Dedicated UPSC Aspirant
* **Demographics:** 20 Years old, tech-savvy, resides anywhere in India.
* **Needs & Pain Points:**
  * Has mock tests in a specific `.txt` format (`#QuestionStart`, `#AnswerStart` tags, **no** `#Explanation`).
  * Wants deep analysis beyond scores, focusing on *why* errors occur.
  * Needs to identify weak subjects, topics, and meta-cognitive patterns.
  * Requires an efficient, *automatic* method for revising mistakes.
  * Finds manual flashcard creation time-consuming.
  * Seeks insights into knowledge gaps vs. technique vs. guesswork vs. confidence.
  * Desires visual tracking of progress over time.
  * Appreciates clean, intuitive, performant, and beautiful software with fluid animations.
* **Goals with Ascend UPSC:**
  * Instantly process specific `.txt` mock tests.
  * Receive detailed, visual analytics immediately post-quiz.
  * Understand meta-cognitive answering patterns.
  * Utilize auto-generated flashcards for mistake revision.
  * Easily export flashcards to Anki.
  * Track long-term improvement via charts and sortable data.
  * Get optional AI-driven study advice.
  * Customize the look and feel (themes, AI settings).
  * Automate analysis and flashcard creation, saving significant manual effort.

---

## 4. Functional Requirements

### 4.1. File Upload & Fixed Format Parsing (FR-PARSE)

* **FR-PARSE-1:** Allow single `.txt` file upload via drag & drop or browse interface.

* **FR-PARSE-2:** Implement a strict, rule-based parser for the exact format (See Appendix):
  
  ```
  #QuestionStart
  Q[Number]) [Full question text, potentially multi-line, may include ASCII tables...]
  [Option a text, e.g., a) Option text or A. Option Text or (i) statement...]
  [Option b text...]
  [Option c text...]
  [Option d text...]
  #QuestionEnd
  #AnswerStart
  Answer: [Correct Answer Letter and Text, e.g., a) The Preamble or B. 2 only]
  #AnswerEnd
  *(Repeats per question)*
  ```

* **FR-PARSE-3:** Extract accurately:
  
  * `questionText`: Content after `Q[Num])` until first option, preserving line breaks and structure (including text tables).
  * `options`: Object {A, B, C, D} with text, handling various markers (a), A., 1., i.).
  * `correctAnswerLetter`: Normalized uppercase letter (A-D).
  * `correctAnswerText`: Full text after the letter in the Answer block.

* **FR-PARSE-4:** Validate parsed data for reasonable question count and presence of essential fields.

* **FR-PARSE-5:** Display clear error message on format mismatch or significant parsing failure; halt process.

* **FR-PARSE-6:** Store structured test data (questions, options, answers) in DB with a unique Test ID (filename + timestamp based).

* **FR-PARSE-7:** Enable "Generate Anki CSV" and "Start Interactive Quiz" buttons only after successful parsing.

### 4.2. AI Integration (Gemini - Limited Role) (FR-AI)

* **FR-AI-1:** Integrate Google Gemini API (`gemini-1.5-flash` recommended default). Allow user selection of model and API Key input in Settings.
* **FR-AI-2:** **Subject Tagging (Optional):**
  * Trigger: Manual button per question or background process (if enabled).
  * Process: Send `questionText` / `options` to Gemini.
  * Prompt: Configurable (Settings), instructs classification based on predefined subject/topic lists.
  * Output: Suggested tag(s).
  * Storage: Store AI tags in DB, marked 'AI', editable by user.
* **FR-AI-3:** **Analytics Recommendations:**
  * Trigger: Explicit "Get AI Insights" button on Overall Analytics.
  * Process: Send filtered analytics summary to Gemini.
  * Prompt: Configurable (Settings), asks for actionable study advice based on data.
  * Output: Display AI recommendations clearly, marked as AI-generated, with a "Regenerate" option.
* **FR-AI-4:** Use stored API Key/Model from settings. Handle API errors gracefully (show message, don't crash).
* **FR-AI-5:** Manage prompts (Subject Tagging, Analytics) via Settings: view, edit, save, reset to default.
* **FR-AI-6:** **No Parsing Role:** AI is **NOT** used for `.txt` parsing.
* **FR-AI-7:** **No Fact-Checking/Answer Role:** AI does **NOT** determine answers.

### 4.3. Anki CSV Generation (FR-ANKI)

* **FR-ANKI-1:** Generate `.csv` from parsed test data (specific `test_id`) upon user request.
* **FR-ANKI-2:** Format: Comma-separated (`,`), UTF-8. Fields with commas/newlines enclosed in double quotes (`"`).
* **FR-ANKI-3:** Columns (Strict):
  1. Front: `"[Question Text]\n\n[Option A]\n\n[Option B]\n\n[Option C]\n\n[Option D]"` (Double newlines, quoted).
  2. Back: `"[Correct Letter]) [Correct Text]"` (e.g., `"a) The Preamble"`, quoted).
  3. Tags: Space-separated list of associated User/AI tags (e.g., `"Polity Preamble Modern_History"`, quoted).
* **FR-ANKI-4:** Initiate immediate CSV download. Suggested filename: `[Original_Filename]_Anki.csv`.

### 4.4. Interactive Quiz Mode (FR-QUIZ)

* **FR-QUIZ-1:** Start new quiz session linked to Test ID, assign unique Attempt ID.
* **FR-QUIZ-2:** Name attempt: `[Original Filename] - Attempt [Number]`. Store name. Auto-increment number.
* **FR-QUIZ-3:** Present one question per card: Show `questionText` (accurately rendering multi-line text and **text-based tables using monospace font and preserving alignment**), clickable option buttons (A, B, C, D). Use smooth transitions.
* **FR-QUIZ-4:** Stopwatch: Visible MM:SS timer. Start on first question. Record answer timestamps. Stop on final meta-data submit. Store total `HH:MM:SS`.
* **FR-QUIZ-5:** Answer Submission & Feedback: Record `selected_option` & `timestamp`. Compare with `correctAnswerLetter`. Provide immediate visual feedback (correct/incorrect styling). Highlight correct answer if wrong. Disable options post-selection. Store `is_correct`.
* **FR-QUIZ-6:** Meta-Cognitive Questions (Post-Selection/Leave): Reveal smoothly. Require one selection for each:
  1. "Knowledge?" [Yes ✅ / No ❌]
  2. "Technique/Logic?" [Yes ✅ / No ❌]
  3. "Guesswork (Tukka)?" [Yes ✅ / No ❌]
  4. "Confidence?" [High 🟢 / Mid 🟡 / Low 🔴]
     Record `knowledge_flag`, `technique_flag`, `guesswork_flag`, `confidence_level`.
* **FR-QUIZ-7:** Reveal Correct Answer Text: After meta-cognitive input, smoothly display the `correctAnswerText`.
* **FR-QUIZ-9:** AI Subject Tagging Process: If enabled, run asynchronously on question load.
* **FR-QUIZ-10:** Tag Display & Editing: Show tags (User/AI) on card. Edit icon (✏️) opens interface to Add/Remove tags from predefined Subject/Topic lists. User tags take precedence. Save changes to `QuestionTags` (persist across attempts). Predefined lists as specified previously.
* **FR-QUIZ-11:** Navigation Buttons:
  * **Skip:** Move question to end of queue. No answer/meta recorded yet.
  * **Leave:** Record `is_left`=true (score=0). Trigger meta-cognitive questions (FR-QUIZ-6). Reveal answer text (FR-QUIZ-7). Move to next.
  * **Next Question:** Appears after meta-cognitive input/answer reveal. Move to next.
* **FR-QUIZ-12:** Progress Bar & Counter: Animated bar at top. Text: `X / Y Questions Answered/Left`.
* **FR-QUIZ-13:** Quiz Completion: On final question process, stop timer, save state, calculate analytics, redirect automatically to End-of-Test Analytics (FR-ANALYTICS-TEST).

### 4.5. Analytics (FR-ANALYTICS)

* **FR-ANALYTICS-TEST-1:** End-of-Test Screen: Auto-display post-quiz. Show Test Name, Date, Total Time.
* **FR-ANALYTICS-TEST-2:** Detailed Table (Sortable, Horizontally Scrollable/Responsive): Rows per Subject + Overall.
  * Columns: Subject, Attempts, Correct, Incorrect, Left, Score, Accuracy% (Correct/(Correct+Incorrect)), Accuracy% (Personal Best!), Avg Time/Q (secs), Confidence (🟢% 🟡% 🔴%), Knowledge (✅%), Technique (✅%), Guesswork (✅%).
  * Editability: Allow manual edits of Correct/Incorrect/Left counts; auto-update calculated fields. Provide "Save Edits".
* **FR-ANALYTICS-TEST-3:** Scoring Logic: GS (+2 / -0.66 / 0), CSAT (+2.5 / -0.83 / 0). Apply per question tag. Calculate per subject/overall.
* **FR-ANALYTICS-TEST-4:** Graphical Representation (Interactive Charts - Chart.js): Overall Pie (C/I/L), Subject Accuracy Bar, Confidence Pie, Meta-cognitive Bar. Optional: Accuracy vs. Time plot.
* **FR-ANALYTICS-TEST-5:** Action Buttons: Re-attempt Test, New Test (Upload), View Overall Analytics, Review Answers (browse this attempt's Qs with user data).
* **FR-ANALYTICS-TEST-6:** Persist calculated attempt analytics and raw `UserAnswers` (timestamps, meta-data) to DB.
* **FR-ANALYTICS-OVERALL-1:** Overall Dashboard Access: Via Settings or End-of-Test screen.
* **FR-ANALYTICS-OVERALL-2:** Scope: Aggregates data from ALL saved attempts.
* **FR-ANALYTICS-OVERALL-3:** Filtering: Interactive controls for Time Range, Subject(s), Tag(s), Test Name, Confidence, Meta-cognitive flags.
* **FR-ANALYTICS-OVERALL-4:** Visualizations (Dynamic, Filterable Charts): Accuracy/Score Trend (Line), Subject Comparison (Bar), Meta-cognitive Trends (Stacked Bar/Line), Heatmap (Subject Accuracy vs. Date/Test#).
* **FR-ANALYTICS-OVERALL-5:** Data Exploration Views (Filterable/Sortable Tables): Error Log, Correct Log, Left Log, Views filtered by Meta-cognitive responses (Guesswork=True, Knowledge=False, Confidence=Low, etc.). Show Date, Test, Q#, Text, Tags, User/Correct Ans, Meta-data.
* **FR-ANALYTICS-OVERALL-6:** Improvement Tracking: Display metrics comparing filtered periods.
* **FR-ANALYTICS-OVERALL-7:** AI Recommendations (FR-AI-3): "Get AI Insights" button triggers display based on *current filters*.

### 4.6. Automatic Flashcard System (FR-FLASH)

* **FR-FLASH-1:** Auto-Creation: Add `question_id` to flashcard pool (`Flashcards` table) when answered **Incorrectly**. Associate tags. (Optional setting: add Left/Skipped).
* **FR-FLASH-2:** Access: Via "Flashcards" button in Settings.
* **FR-FLASH-3:** Deck Filtering: Study by Subject, Tag, Source Test, Status (New, Learning, Due).
* **FR-FLASH-4:** Spaced Repetition System (SRS):
  * Algorithm: Simplified SM-2 logic. Store `interval`, `ease_factor`, `due_date`.
  * Queue: Show cards due today or earlier, respecting filters.
  * Interface: Front (Question + Options), Reveal (Correct Letter + Text).
  * Rating: "Again", "Hard", "Good", "Easy" buttons adjust interval/ease.
  * Scheduling: Update card stats and `due_date` in DB.
* **FR-FLASH-5:** Progress Stats: Display "X Due", "Y New", "Z Total".

### 4.7. UI/UX & Theming (FR-UI)

* **FR-UI-1:** Aesthetic: Strict Apple-inspired design: clean, minimalist, intuitive, SF Pro/Inter fonts, ample spacing, clear hierarchy. Fluidity and elegance are key.
* **FR-UI-2:** Animations: High-quality, smooth (60fps target), non-jarring CSS/JS animations for transitions, interactions, reveals, progress bars, panels, loading states.
* **FR-UI-3:** Dark Mode: Global ☀️/🌙 toggle. Smooth transition. Persist preference.
* **FR-UI-4:** Theming: Select via Settings. Themes: Apple (Default), Gucci, Cyberpunk, Coffee, Real Madrid, RCB. Use CSS variables extensively. Each theme MUST have distinct, tested Light/Dark modes ensuring readability. Implement specified colors (Real Madrid/RCB) ensuring contrast. Persist selection.
* **FR-UI-5:** Branding: Title `🇮🇳 Ascend UPSC`. Header name `🇮🇳 Ascend UPSC`.
* **FR-UI-6:** Scroll Bars: Minimal themed or clean native scrollbars for constrained areas. Use `overflow: auto;`.
* **FR-UI-7:** Responsiveness: Desktop/laptop primary. Graceful adaptation to tablet/mobile. No horizontal scroll on main content.
* **FR-UI-8:** Button States: Clear, themed :default, :hover, :active, :disabled states.
* **FR-UI-8.1:** Universal Scrollability: Ensure all potentially constrained areas (cards, modals, panels) scroll if content overflows.
* **FR-UI-9:** Feedback: Clear visual cues for uploads, saves, loading.
* **FR-UI-10:** Typography: `SF Pro Text`/`Inter`/`sans-serif`. `JetBrains Mono` for code/tables in questions. Support browser zoom.
* **FR-UI-11:** Micro-interactions: Subtle hovers, smooth toggles, skeleton loading.
* **FR-UI-12:** Accessibility: Aim for WCAG AA contrast. Respect `prefers-reduced-motion`. Keyboard navigable with visible focus.
* **FR-UI-13:** Theme Extensions: Optional Apple blur, Cyberpunk scanlines, Coffee texture (toggleable if performance impact).
* **FR-UI-14:** Branding Details: Custom ↑ glyph. Themed favicons. Subtle loading animation.
* **FR-UI-15:** Advanced Feedback: Progress rings, error shakes, success micro-animations (optional).
* **FR-UI-16:** Optional Features (Settings Toggle): Themed cursors, sound effects (off by default).

### 4.8. Settings Side Panel (FR-SETTINGS)

* **FR-SETTINGS-1:** Access: Gear icon ⚙️. Smooth slide-in (right). Scrollable content. Close button (X).
* **FR-SETTINGS-2:** Navigation: Sections/tabs for Gemini, Theme, Prompt Management, History, Analytics (link), Flashcards (link).
* **FR-SETTINGS-3:** Gemini Settings: Model dropdown, masked API Key input, Save button + feedback.
* **FR-SETTINGS-4:** Theme Settings: Visual swatches. Immediate application & persistence.
* **FR-SETTINGS-5:** Prompt Customization: Textareas for Tagging/Analytics prompts. View, Edit, Save, Reset defaults.
* **FR-SETTINGS-6:** History: Scrollable list of past attempts (Name, Date). Click -> View attempt's analytics.
* **FR-SETTINGS-7:** Analytics Button: Link to Overall Dashboard.
* **FR-SETTINGS-8:** Flashcards Button: Link to Flashcard study interface.
* **FR-SETTINGS-11:** Persistence: API Key, Prompts saved on action. Theme/Mode saved on change.

### 4.9. Database (FR-DB)

* **FR-DB-1:** Use SQLite via `sql.js` (client-side) or local file (if using wrapper/backend).
* **FR-DB-2:** Schema (Conceptual):
  * `UserSettings` (theme, dark_mode, api_key, gemini_model, tagging_prompt, analytics_prompt)
  * `Tests` (test_id PK, filename, upload_timestamp, total_questions)
  * `Questions` (question_id PK, test_id FK, q_number, q_text, opt_a, opt_b, opt_c, opt_d, correct_letter, correct_text)
  * `QuestionTags` (tag_id PK, question_id FK, tag_name, source ('AI'/'User'), UNIQUE(question_id, tag_name))
  * `QuizAttempts` (attempt_id PK, test_id FK, timestamp, time_seconds, score, correct_n, incorrect_n, left_n, name)
  * `UserAnswers` (answer_id PK, attempt_id FK, question_id FK, selected_opt, is_correct, is_left, timestamp, knowledge_flag, technique_flag, guesswork_flag, confidence_level)
  * `Flashcards` (flashcard_id PK, question_id FK UNIQUE, due_date, interval, ease_factor, status)
* **FR-DB-3:** Index FKs and columns used heavily in filtering/joining (timestamps, tags, correctness, confidence).

---

## 5. Non-Functional Requirements (NFR)

* **NFR-ACCURACY-1:** Parser 100% accurate for spec format. Precise scoring/stats.
* **NFR-PERFORMANCE-1:** Interactions < 300ms. Smooth 60fps animations.
* **NFR-PERFORMANCE-2:** Analytics dashboard load < 2s (optimize queries).
* **NFR-PERFORMANCE-3:** Async AI calls with loaders. Fast parsing (< 1s).
* **NFR-USABILITY-1:** Highly intuitive, minimal learning. Aesthetically engaging.
* **NFR-USABILITY-2:** Clear feedback. High readability (aim for WCAG AA).
* **NFR-RELIABILITY-1:** Stable, no data loss. Core features reliable.
* **NFR-RELIABILITY-2:** Flawless theme/dark mode switching.
* **NFR-RELIABILITY-3:** Robust error handling (File, DB, API) with user-friendly messages.
* **NFR-SECURITY-1:** Standard practices for local app. Inform user if API key stored in browser localStorage.
* **NFR-MAINTAINABILITY-1:** Modular, commented code. Heavy use of CSS variables.

---

## 6. Appendix: Input File Format Example for your better understanding :

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
Q2) Which of the following describes the most significant advantage of the Parliamentary form of Government?
a) It ensures the separation of powers between the executive and the legislature.
b) It provides that the power is constitutionally divided between the national government and the regional governments.
c) It establishes a responsible government whereby the executive is responsible to the legislature for its actions.
d) It provides a stable government, thus ensuring the formulation and implementation of long-term policies.
#QuestionEnd
#AnswerStart
Answer: c) It establishes a responsible government whereby the executive is responsible to the legislature for its actions.
#AnswerEnd

#QuestionStart
Q3) Consider the following pairs with reference to making of the Constitution of India:
| Personality | Role in Constitutional Making |
|-------------------------|----------------------------------------------------|
| 1. K.M. Munshi | Member of the Drafting Committee of the Constitution |
| 2. B.N. Rau | Constitutional Advisor to the Constituent Assembly |
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

The Centre altering the names and boundaries of States unilaterally.

Unequal representation of states in the Rajya Sabha.

Different federal arrangements for Union Territories compared to states.
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

It is an electronic trading platform for primary market transactions in government securities (G-sec).

Non-bank brokers registered with SEBI can directly access NDS-OM.
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
Q2) The term ‘Amaterasu particle,’ recently seen in the news, is associated with which among the following?
A. Radioactive polymetallic nodules discovered in the Indian Ocean basin
B. High-energy cosmic rays penetrating the Earth
C. Sub-atomic particles discovered by ITER reactor
D. DNA segment responsible for intra-species mutations
#QuestionEnd
#AnswerStart
Answer: B. High-energy cosmic rays penetrating the Earth
#AnswerEnd

#QuestionStart
Q3) Which of the following countries have the Equator passing through them?

Peru

Angola

Kenya

Singapore
Select the correct answer using the code given below.
A. 2 only
B. 3 only
C. 1 and 4 only
D. 1 and 3 only
#QuestionEnd
#AnswerStart
Answer: B. 3 only
#AnswerEnd

#QuestionStart
Q4) Which of the following is/are correct with reference to the National Mineral Policy 2019?

It pertains to all major and minor minerals, including coal-based and other fuel-based minerals.

It introduces the concept of Exclusive Mining Zones which come with in-principle statutory clearances for grant of mining lease.

It provides for the right of first refusal to the Prospecting Licence holders at the time of auction.
Select the correct answer using the code given below.
A. 1 only
B. 1 and 2 only
C. 2 and 3 only
D. 1, 2 and 3
#QuestionEnd
#AnswerStart
Answer: C. 2 and 3 only
#AnswerEnd
```
