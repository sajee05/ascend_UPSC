  async getTestAnalytics(attemptId: number): Promise<TestAnalytics | undefined> {
    // Get attempt
    const [attempt] = await db.select()
      .from(attempts)
      .where(eq(attempts.id, attemptId));
    
    if (!attempt) return undefined;
    
    // Get test
    const [test] = await db.select()
      .from(tests)
      .where(eq(tests.id, attempt.testId));
    
    if (!test) return undefined;
    
    // Get answers for this attempt
    const answers = await db.select()
      .from(userAnswers)
      .where(eq(userAnswers.attemptId, attemptId));
    
    if (answers.length === 0) return undefined;
    
    // Get questions for this test
    const questions = await this.getQuestionsByTest(attempt.testId);
    
    // Map question IDs to questions for easy lookup
    const questionMap = new Map<number, QuestionWithTags>();
    questions.forEach(q => questionMap.set(q.id, q));
    
    // Get all subjects from questions (prioritize new schema, fallback to tags)
    const subjectTags = new Set<string>();
    questions.forEach(q => {
      // Check for subject data first (new schema)
      if (q.subjects && q.subjects.length > 0) {
        q.subjects.forEach(subject => {
          subjectTags.add(subject.name);
        });
      } else {
        // Fallback to tags for backward compatibility
        q.tags.forEach(tag => {
          if (!tag.isAIGenerated) subjectTags.add(tag.tagName);
        });
      }
    });
    
    // For each subject, calculate stats
    const subjectStats: SubjectStats[] = [];
    
    // Function to calculate stats for a subset of answers
    const calculateStats = (filteredAnswers: UserAnswer[]): SubjectStats => {
      const correct = filteredAnswers.filter(a => a.isCorrect).length;
      const incorrect = filteredAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
      const left = filteredAnswers.filter(a => a.isLeft).length;
      
      // Calculate other stats
      const score = correct * 2 - incorrect * 0.66;
      const accuracy = filteredAnswers.length > 0 ? (correct / (correct + incorrect)) * 100 : 0;
      
      // Calculate confidence stats
      const highConfidence = filteredAnswers.filter(a => a.confidenceLevel === 'high').length;
      const midConfidence = filteredAnswers.filter(a => a.confidenceLevel === 'mid').length;
      const lowConfidence = filteredAnswers.filter(a => a.confidenceLevel === 'low').length;
      
      // Calculate meta-cognitive stats
      const knowledgeYes = filteredAnswers.filter(a => a.knowledgeFlag).length;
      const techniqueYes = filteredAnswers.filter(a => a.techniqueFlag).length;
      const guessworkYes = filteredAnswers.filter(a => a.guessworkFlag).length;
      
      // Calculate average time
      const totalTime = filteredAnswers.reduce((sum, a) => sum + (a.answerTimeSeconds || 0), 0);
      const avgTime = filteredAnswers.length > 0 ? totalTime / filteredAnswers.length : 0;
      
      // Calculate attempt-based statistics
      const firstAttemptCorrect = filteredAnswers.filter(a => a.isCorrect && a.attemptNumber === 1).length;
      const secondAttemptCorrect = filteredAnswers.filter(a => a.isCorrect && a.attemptNumber === 2).length;
      const thirdPlusAttemptCorrect = filteredAnswers.filter(a => a.isCorrect && a.attemptNumber && a.attemptNumber >= 3).length;
      
      // Distribution of attempt numbers
      const attemptDistribution: {[key: number]: number} = {};
      filteredAnswers.forEach(answer => {
        const attemptNum = answer.attemptNumber || 1; // Default to 1 if not set
        attemptDistribution[attemptNum] = (attemptDistribution[attemptNum] || 0) + 1;
      });
      
      return {
        subject: '',  // Will be set by caller
        attempts: filteredAnswers.length,
        correct,
        incorrect,
        left,
        score,
        accuracy,
        personalBest: accuracy, // For overall stats, this will be updated later
        avgTimeSeconds: avgTime,
        confidenceHigh: highConfidence,
        confidenceMid: midConfidence,
        confidenceLow: lowConfidence,
        knowledgeYes,
        techniqueYes,
        guessworkYes,
        // New attempt-based stats
        firstAttemptCorrect,
        secondAttemptCorrect,
        thirdPlusAttemptCorrect,
        attemptDistribution,
      };
    };
    
    // Overall stats first
    const overallStats = calculateStats(answers);
    overallStats.subject = 'OVERALL';
    
    // Stats by subject
    for (const subject of subjectTags) {
      // Get questions with this subject (check both new schema and old tags)
      const subjectQuestionIds = questions
        .filter(q => {
          // Check subjects first (new schema)
          if (q.subjects && q.subjects.length > 0) {
            return q.subjects.some(s => s.name === subject);
          } 
          // Fallback to tags
          return q.tags.some(t => t.tagName === subject);
        })
        .map(q => q.id);
      
      // Get answers for these questions
      const subjectAnswers = answers.filter(a => subjectQuestionIds.includes(a.questionId));
      
      if (subjectAnswers.length > 0) {
        const stats = calculateStats(subjectAnswers);
        stats.subject = subject;
        
        // Get user's personal best for this subject from other attempts
        const otherAttempts = await db.select()
          .from(attempts)
          .where(and(
            eq(attempts.testId, attempt.testId),
            sql`${attempts.id} != ${attemptId}`
          ));
        
        let personalBest = stats.accuracy;
        
        for (const otherAttempt of otherAttempts) {
          const otherAnswers = await db.select()
            .from(userAnswers)
            .where(eq(userAnswers.attemptId, otherAttempt.id));
          
          const otherSubjectAnswers = otherAnswers
            .filter(a => subjectQuestionIds.includes(a.questionId));
          
          if (otherSubjectAnswers.length > 0) {
            const otherCorrect = otherSubjectAnswers.filter(a => a.isCorrect).length;
            const otherIncorrect = otherSubjectAnswers.filter(a => !a.isCorrect && !a.isLeft).length;
            const otherAccuracy = (otherCorrect / (otherCorrect + otherIncorrect)) * 100;
            
            if (otherAccuracy > personalBest) {
              personalBest = otherAccuracy;
            }
          }
        }
        
        stats.personalBest = personalBest;
        subjectStats.push(stats);
      }
    }
    
    // Calculate overall stats using all answers
    return {
      testId: test.id,
      attemptId,
      title: test.title,
      date: dateToString(attempt.startTime) || "",
      totalTimeSeconds: attempt.totalTimeSeconds || 0,
      overallStats: overallStats,
      subjectStats,
    };
  }