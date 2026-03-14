## ⚠️ **A word of caution before you spend time on this project:**

* The project is **abandoned** and **no longer maintained**.
* For issues, ask AI or figure them out yourself.
* It’s **100% functional**, but I personally don’t use it anymore. doing things manually has a much better ROI. I’ve made the repo public in case someone still wants to try it.
* You can check the files in the **“raw material”** folder. I’ve already uploaded processed material for **FORUM Toolkit, Vivek Singh 450 Book, etc.** So if you manage to get the program running, feel free to run it right away. The rest should be self-explanatory.
* Most of it is **vibe coded**.
* You’ll need a **Gemini API key** to generate explanations. If you want your own explanations from the mock, you’ll have to modify the schema mechanism and add explanation-extraction instructions to the system prompt.

### 📌 **Tech tools shouldn’t be used just for the sake of it or out of FOMO.** Add them to your workflow/Use them only when you genuinely feel the need to. stick to old school methods instead of doing productive procrastination. 


## 📺 YouTube Showcase

[![Watch on YouTube](https://img.youtube.com/vi/GCZYYjAsYY8/maxresdefault.jpg)](https://youtu.be/GCZYYjAsYY8)

▶ Click the thumbnail to watch the video on YouTube.


## Introduction

Ascend UPSC is a sophisticated, Apple-inspired web application designed as a comprehensive test preparation tool for Union Public Service Commission (UPSC) aspirants in India. It focuses on analyzing mock tests provided in a specific text format (`.txt`), enabling efficient revision through automatically generated flashcards, offering interactive quiz experiences with detailed meta-cognitive feedback, and providing structured, visually rich progress tracking both immediately after a test and over the long term.

The platform allows users to upload mock test files adhering to a predefined `#tag` structure (without explanations). It parses this data, enables interactive quizzes, leverages AI (Gemini) for optional explanations, subject tagging, and analytics recommendations, displays in-depth analytics, features an automated flashcard system based on performance, and allows export to Anki. The core workflow is streamlined: **Upload -> (Preview) -> Parse -> Quiz -> Analyze -> Revise (Flashcards/Anki)**.

---

## Goals

- **Primary Goal:** Provide UPSC aspirants with a powerful, intuitive, and aesthetically pleasing platform to upload and analyze mock test performance (from a specific `.txt` format), identify weaknesses (subject-wise, topic-wise, meta-cognitively), and optimize their preparation strategy, creating a personal SWOT database.
- **Secondary Goals:**
  - Reliably parse the specific `#tag` formatted `.txt` files provided by the user, with a preview option.
  - Streamline the conversion of parsed mock tests into interactive digital quiz formats and revision flashcards (internal & Anki).
  - Offer detailed, actionable, and visually engaging insights through comprehensive post-test and overall analytics, enhanced by optional AI features.
  - Enhance learning retention through an integrated, automatic spaced repetition flashcard system for incorrect answers.
  - Provide a seamless, smooth, highly animated, and visually engaging user experience inspired by Apple's design philosophy, featuring multiple customizable themes (including Real Madrid & RCB) and consistent dark/light modes.
  - Integrate AI capabilities (Gemini) *responsibly* for optional answer explanations, subject tagging, and analytics insights, configurable by the user.
  - Ensure robust local data persistence and reliable progress saving.
  - Enable basic data management, including test deletion.

--- 

## Features

- **Test Upload & Management**: Upload mock test files in text format and organize them by subject
- **Interactive Quiz**: Take quizzes with features like timed mode and confidence rating
- **Question Analysis**: Review your answers with AI-powered analysis on why options are right or wrong
- **Flashcards**: Review cards from previously incorrect answers using spaced repetition
- **Analytics Dashboard**: Get detailed insights into your performance across subjects
- **Anki Export**: Export questions to Anki format for continued practice

---

## First-Time Setup

Follow these steps to set up the Ascend UPSC application locally.

### Prerequisites

- **Node.js**: Ensure you have Node.js installed (LTS version recommended). You can download it from [https://nodejs.org/](https://nodejs.org/). Node.js includes npm (Node Package Manager).
- **Project Files**: You need the project source code in a local directory.

### Windows 11 (Using PowerShell)

1. **Open PowerShell**: Navigate to the root directory of the project (where `package.json` is located).

2. **Install Dependencies**: Run the following command to install the necessary packages:
   
   ```powershell
   npm install
   ```

3. **Set Up Database**: Initialize or update the SQLite database schema:
   
   ```powershell
   npm run db:push
   ```

4. **Run Development Server**: Start the application:
   
   ```powershell
   npm run dev
   ```

### macOS (Using Terminal)

1. **Open Terminal**: Navigate to the root directory of the project (where `package.json` is located).

2. **Install Dependencies**: Run the following command to install the necessary packages:
   
   ```bash
   npm install
   ```

3. **Set Up Database**: Initialize or update the SQLite database schema:
   
   ```bash
   npm run db:push
   ```

4. **Run Development Server**: Start the application:
   
   ```bash
   npm run dev
   ```

---

## Usage

1. **Start the Application**: Run `npm run dev` in your terminal from the project's root directory.
2. **Access in Browser**: Open your web browser and navigate to the URL provided in the terminal output (usually `http://localhost:5173 OR http://localhost:3000` or similar).
3. **Core Workflow**:
   * **Upload**: Go to the upload section, select your formatted `.txt` mock test file, preview the parsed questions, and import the test.
   * **Quiz**: Select an imported test and start an interactive quiz session. Answer questions and provide meta-cognitive feedback (Knowledge, Technique, Guesswork, Confidence).
   * **Analyze**: After completing a quiz, review the detailed End-of-Test analytics. Access the Overall Analytics fancy dashboard via the Settings panel (⚙️ icon) for aggregated insights across all tests And `history` is all you need.
   * **Revise**: Study incorrectly answered questions using the automatically generated flashcards. Access the Flashcards section via the Settings panel.
   * **Settings**: Click the Gear icon (⚙️) to open the side panel. Here you can configure Gemini AI settings (API key, model), change themes, customize AI prompts, view test history, and manage data.

---

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, and Shadcn UI components
- **Backend**: Node.js with Express
- **Database**: SQLite (for development via `npm run dev`)
- **AI Integration**: Google Gemini API for advanced question analysis
- **ORM**: Drizzle ORM

---

## File Format for Test Upload

The application accepts text files (`.txt`) formatted with specific tags to identify questions and answers, copy the prompt from `copy parsing promp` and pasting it to `Gemini AI atudio` with your required PDF:

<img src="file:///C:/Users/FO/AppData/Roaming/marktext/images/2025-04-15-17-09-10-image.png" title="" alt="" width="657">

```text
#QuestionStart
Q1) Question text here...
a) Option A
b) Option B
c) Option C
d) Option D
#QuestionEnd
#AnswerStart
Answer: a) Option A text
#AnswerEnd
#QuestionStart
Q2) Next question...
...
```

*(Ensure your file strictly follows this format, including the `#tag` lines)*

**Here is the Parsing Prompt, for reference:**

```
Your Task:** You are an expert data formatter. Your goal is to convert all questions, answers, and explanatios fom the provided input text into a specific, structured format. Adhere strictly to the rules below.

**Input:** The input text will contain one or more questions, typically with multiple-choice options, a designated correct answer, and an accompanying explanation.

**Output Format:** For *each* question found in the input, you MUST structure the output exactly as follows:

#QuestionStart
Q1) [Insert the full question text here]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

#QuestionStart
Q2) [Insert the full question text here (i) statement 1 if any, (ii) statement 2 if any]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

#QuestionStart
Q3) [Insert the full question text here
table in text blocks if any (identify from pdf)
|---------------------------------|
| abc | xyz | 
|---------------------------------|]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

#QuestionStart
Q4) [Insert the full question text here (⭐ Please Re-check)]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

*Mandatory Rules & Constraints:**

1. **Exact Formatting:** Ensure table formatting is exactly as it is above (add "|"" in between the options). If there statements in the questions, involve them just below the question without spacing, given you the output below to be used as a rigid example.Use the precise tags (`#QuestionStart`, `#QuestionEnd`, `#AnswerStart`, `#AnswerEnd`) and prefixes (`Q1)`, `Answer:`, `Explanation:`) as shown. Maintain the line breaks as demonstrated in the format structure and the example.

2. **100% Accuracy to Input:** Reproduce the question text, all options, the identified correct answer, and the explanation text *exactly* as they appear in the input provided format. Do not rephrase, summarize, or omit any part of the original content unless addressing rule #5, in which case add the correction with in a bracket along with explanation but dont modify original..

3. **Stay Within Scope:** (Remove any sources like-Laxmikant/NCERT/etc, coaching names like forum IAS/visionIAS, links mentioned)=from the explanation. Do NOT add any information, details, or context that is not explicitly present in the original input provided for that specific question.

4. **No Hallucination:** Ensure, the answer is not just "a" but "a) answer". Output Should be exactly like depicted in the example. with proper line spacing vertically. Do not invent questions, answers, options, or explanations. Stick strictly to the provided source material.

5. **Error Identification and Correction (Questions Only):**

  - Carefully review the `Question and its respective answer` text provided in the input for each question.
  - If you identify a clear general knowledge error, factual inaccuracy, or logical inconsistency , you MUST:
    - Place a star emoji (⭐) immediately *after* the question.
    - Immediately following the ⭐, write: "please re-check" enclosed in parentheses `()`. (see Q4) from above example)
  - **Important:** Apply this error correction *only* by indicating asa specified. Do *not* alter the question, options, or the indicated correct answer even if you suspect they are wrong in the source; reproduce them as given. If the source explanation itself seems factually flawed *according to common knowledge/factually/logically or inconsistency in option and its explanation*, apply the correction method by just indicating to recheck. I repeat, NEVER CHANGE ANY TEXT just indicate as described above.
6. **OCR correction:** it is possible the input provided to you maybe in jumbled or abruptly broken text format, convert it into normal paragraphs but DO NOT change the content. **Example**: *Jumbled-ocr Input*:
  The President of India is empowered to proclaim a national emergency only after receiving a
  written recommendation from the Union Cabinet.
  *nomralised*:
  The President of India is empowered to proclaim a national emergency only after receiving a written recommendation from the Union Cabinet.

7. CRITICAL! NEVER INSERT answer's explanation. just verify that correct answer and explanation given in the answer is matching internally. in the output only mention the correct option with option number i.e. a), b), c), d) and its answer in front of it. for eg: a) America


*Process all questions present in the input text according to these rules, only output the output no unnecessary text like "here is your output" + give it to me in code-block so that i can directly copy paste*.
```

## Attribution

created by sxjeel,
Not allowed for commercial use.
