# macOS Installation Guide for Ascend UPSC Project

This guide provides the steps to set up and run the Ascend UPSC project on a macOS machine.

## Prerequisites

* **Git:** Ensure Git is installed. You can download it from [https://git-scm.com/](https://git-scm.com/) or install it using Homebrew (`brew install git`).
* **Node.js & npm:** Ensure Node.js (which includes npm) is installed. It's recommended to use a version manager like `nvm`. You can find installation instructions at [https://nodejs.org/](https://nodejs.org/).

## Setup Steps

1. **Clone the Repository:**
   Open your terminal and clone the project repository. Replace `<your-repository-url>` with the actual URL.
   
   ```bash
   git clone <your-repository-url>
   cd ascend_UPSC # Or the actual directory name if different
   ```

2. **Install Dependencies:**
   It's crucial to perform a clean installation to get macOS-compatible versions of dependencies, especially native modules like `better-sqlite3`.
   
   ```bash
   # Remove potentially incompatible node_modules and lockfile
   rm -rf node_modules
   rm -f package-lock.json # Use -f to ignore if the file doesn't exist
   
   # Install dependencies
   npm install
   ```

3. **Run Database Migrations:**
   Apply the necessary database schema changes.
   
   ```bash
   npm run db:push
   ```
   
   *Note: This command might require execute permissions. `npm install` usually handles this, but if you encounter permission errors related to `drizzle-kit`, you might need to run `chmod +x node_modules/.bin/drizzle-kit`.*

4. **Start the Development Server:**
   
   ```bash
   npm run dev
   ```
   
   *Note: Similar to `drizzle-kit`, if you encounter permission errors related to `tsx`, you might need `chmod +x node_modules/.bin/tsx`.*

Your application should now be running. Access it as specified by the development server output (usually `http://localhost:xxxx`).