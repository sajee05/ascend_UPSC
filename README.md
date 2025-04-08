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
- **Database**: PostgreSQL for web version, SQLite for desktop version
- **AI Integration**: OpenAI API for advanced question analysis
- **Desktop Application**: Electron for cross-platform desktop experience

## Getting Started

The Ascend UPSC application is available as both a web application and a standalone desktop application.

### Desktop Application
For installation instructions, please refer to:
- [Windows Installation Guide](WINDOWS_INSTALLER_README.md)
- [macOS Installation Guide](INSTALL_MACOS.md)
- [Portable Usage Guide](PORTABLE_USAGE.md)

#### Windows Installation Options
- **One-Click Installer**: Easy installation with desktop shortcuts
- **Portable Version**: No installation required, run from any location

### Key Features of the Desktop Version
- **No Internet Required**: All features work offline
- **No Login Required**: Access all functionality without an account
- **Portable Database**: Your data stays on your computer
- **Same Experience**: Identical features to the web version

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
