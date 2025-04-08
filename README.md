# Ascend UPSC

An advanced UPSC exam preparation platform that combines AI technologies with interactive learning tools to optimize study strategies and enhance mock test performance.

## Features

- **Test Upload & Management**: Upload mock test files in text format and organize them by subject
- **Interactive Quiz**: Take quizzes with features like timed mode and confidence rating
- **Question Analysis**: Review your answers with AI-powered analysis on why options are right or wrong
- **Flashcards**: Review cards from previously incorrect answers using spaced repetition
- **Analytics Dashboard**: Get detailed insights into your performance across subjects
- **Anki Export**: Export questions to Anki format for continued practice

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, and Shadcn UI components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL for data storage
- **AI Integration**: OpenAI API for advanced question analysis

## Getting Started

For installation instructions, please refer to:
- [Windows Installation Guide](INSTALL_WINDOWS.md)
- [macOS Installation Guide](INSTALL_MACOS.md)

## File Format for Test Upload

The application accepts text files formatted with specific tags to identify questions and answers:

```
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

## Development Team

- Project initially created as a UPSC preparation tool with focus on AI-powered analysis

## License

This project is proprietary software. All rights reserved.
