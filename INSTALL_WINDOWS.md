# Windows Installation Guide for Ascend UPSC

This guide will walk you through the complete setup process for the Ascend UPSC application on Windows systems.

## Prerequisites

Before starting, ensure you have the following installed on your Windows machine:

1. **Node.js and npm**:
   - Download and install the latest LTS version from [Node.js official website](https://nodejs.org/)
   - Verify installation with `node -v` and `npm -v` in Command Prompt

2. **Git**:
   - Download and install from [Git for Windows](https://git-scm.com/download/win)
   - Verify installation with `git --version`

3. **PostgreSQL**:
   - Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
   - During installation, note your password and the port (default is 5432)
   - Verify installation by launching pgAdmin

4. **Visual Studio Code** (optional but recommended):
   - Download and install from [VS Code website](https://code.visualstudio.com/)

## Installation Steps

### 1. Clone the Repository

1. Open Command Prompt (or Git Bash)
2. Navigate to where you want to store the project:
   ```
   cd C:\path\to\your\projects
   ```
3. Clone the repository:
   ```
   git clone https://github.com/yourusername/ascend-upsc.git
   cd ascend-upsc
   ```

### 2. Set Up the Database

1. Open pgAdmin (installed with PostgreSQL)
2. Right-click on "Servers" → "PostgreSQL" → Enter your password
3. Right-click on "Databases" → "Create" → "Database"
4. Name the database "ascend_upsc" and save

Alternatively, use Command Prompt:
```
psql -U postgres
CREATE DATABASE ascend_upsc;
\q
```

### 3. Configure Environment Variables

1. In the project root folder, create a file named `.env`
2. Add the following content, adjusting values as needed:
   ```
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ascend_upsc
   PORT=5000
   NODE_ENV=development
   ```
3. If you plan to use OpenAI features, add your API key:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

### 4. Install Dependencies

1. In Command Prompt, navigate to the project directory
2. Use the Node Package Manager to install all required packages

### 5. Run Database Migrations

Use the database migration script to initialize the database with the required tables.

### 6. Start the Application

1. Start the development server using the npm script
2. Open your browser and go to `http://localhost:5000`

## Troubleshooting

### Common Issues and Solutions

1. **PostgreSQL Connection Issues**:
   - Verify PostgreSQL is running (check Services in Windows)
   - Confirm credentials in your .env file
   - Try connecting with pgAdmin to test your credentials

2. **Node.js Installation Problems**:
   - Uninstall and reinstall Node.js
   - Make sure npm is properly installed with Node.js
   - Check your PATH environment variables

3. **Database Migration Errors**:
   - Ensure PostgreSQL service is running
   - Check if the database was created properly
   - Verify your DATABASE_URL environment variable

4. **Port Already in Use Error**:
   - Change the PORT in your .env file
   - Check for other applications using port 5000
   - Use Task Manager to end processes that might be using the port

5. **OpenAI API Issues**:
   - Verify your API key is correct and has sufficient credits
   - Check your network connection and proxy settings

## Support

If you encounter any issues not covered in this guide, please reach out to the development team for support.
