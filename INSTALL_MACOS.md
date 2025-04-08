# macOS Installation Guide for Ascend UPSC

This guide will walk you through the complete setup process for the Ascend UPSC application on macOS systems.

## Prerequisites

Before starting, ensure you have the following installed on your Mac:

1. **Homebrew**:
   - Open Terminal
   - Install Homebrew using the command from [brew.sh](https://brew.sh/)
   - Verify installation with `brew --version`

2. **Node.js and npm**:
   - Install using Homebrew
   - Verify installation in Terminal

3. **Git**:
   - Install using Homebrew
   - Verify installation in Terminal

4. **PostgreSQL**:
   - Install using Homebrew
   - Start PostgreSQL service
   - Verify installation in Terminal

5. **Visual Studio Code** (optional but recommended):
   - Download and install from [VS Code website](https://code.visualstudio.com/)
   - Alternatively, install using Homebrew

## Installation Steps

### 1. Clone the Repository

1. Open Terminal
2. Navigate to where you want to store the project:
   ```
   cd ~/Documents/Projects
   ```
3. Clone the repository:
   ```
   git clone https://github.com/yourusername/ascend-upsc.git
   cd ascend-upsc
   ```

### 2. Set Up the Database

1. Create a new PostgreSQL database using createdb command
2. Verify the database was created using psql

### 3. Configure Environment Variables

1. In the project root folder, create a file named `.env`
2. Add the following content, adjusting values as needed:
   ```
   DATABASE_URL=postgresql://$(whoami)@localhost:5432/ascend_upsc
   PORT=5000
   NODE_ENV=development
   ```
3. If you plan to use OpenAI features, add your API key:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

### 4. Final Setup

1. Install project dependencies
2. Run database migrations
3. Start the application server
4. Access the application at http://localhost:5000

## Troubleshooting

### Common Issues and Solutions

1. **PostgreSQL Connection Issues**:
   - Check if PostgreSQL service is running
   - Restart PostgreSQL if needed
   - Verify database connection

2. **Node.js Issues**:
   - Update Node.js if needed
   - Clear cache
   - Reinstall dependencies

3. **Git Clone Errors**:
   - Check your internet connection
   - Verify repository access

4. **Port Already in Use Error**:
   - Change the PORT in your .env file
   - Find and stop conflicting processes

5. **Permission Issues**:
   - Check file permissions
   - Ensure database write access

## Support

If you encounter any issues not covered in this guide, please reach out to the development team for support.
