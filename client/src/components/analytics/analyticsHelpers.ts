import { AttemptQuestionStat } from "@shared/schema";

// Type definition for aggregated tag analytics
export interface TagAnalytics {
  tag: string;
  attempted: number;
  correct: number;
  incorrect: number;
  left: number;
  knowledgeYes: number;
  knowledgeNo: number;
  educatedGuessYes: number;
  educatedGuessNo: number;
  guessYes: number;
  guessNo: number;
  confidenceHigh: number;
  confidenceMid: number;
  confidenceLow: number;
  accuracy: number; // Store as number 0-100
}

// Helper function to calculate tag-based analytics from detailed question stats
export const calculateTagAnalytics = (attemptQuestionStats: AttemptQuestionStat[]): TagAnalytics[] => {
  const tagMap: { [key: string]: TagAnalytics } = {};

  if (!attemptQuestionStats) return [];

  // Initialize stats for each tag
  attemptQuestionStats.forEach(q => {
    q.tags?.forEach((tag: string) => {
      if (!tagMap[tag]) {
        tagMap[tag] = {
          tag: tag,
          attempted: 0, correct: 0, incorrect: 0, left: 0,
          knowledgeYes: 0, knowledgeNo: 0, educatedGuessYes: 0, educatedGuessNo: 0,
          guessYes: 0, guessNo: 0, confidenceHigh: 0, confidenceMid: 0, confidenceLow: 0,
          accuracy: 0,
        };
      }
    });
  });

  // Aggregate stats
  attemptQuestionStats.forEach(q => {
    const isAttempted = q.status !== 'unanswered';
    const isCorrect = q.status === 'correct';

    q.tags?.forEach((tag: string) => {
      const stats = tagMap[tag];
      if (!stats) return;

      if (isAttempted) {
        stats.attempted++;
        if (isCorrect) {
          stats.correct++;
        } else {
          stats.incorrect++;
        }

        // Metacognitive
        if (q.meta?.knowledge === 'yes') stats.knowledgeYes++;
        if (q.meta?.knowledge === 'no') stats.knowledgeNo++;
        if (q.meta?.technique === 'yes') stats.educatedGuessYes++;
        if (q.meta?.technique === 'no') stats.educatedGuessNo++;
        if (q.meta?.guess === 'yes') stats.guessYes++;
        if (q.meta?.guess === 'no') stats.guessNo++;
        if (q.meta?.confidence === 'high') stats.confidenceHigh++;
        if (q.meta?.confidence === 'mid') stats.confidenceMid++;
        if (q.meta?.confidence === 'low') stats.confidenceLow++;

      } else {
        stats.left++;
      }
    });
  });

  // Calculate accuracy and finalize
  Object.values(tagMap).forEach(stats => {
    stats.accuracy = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;
  });

  return Object.values(tagMap).sort((a, b) => a.tag.localeCompare(b.tag));
};

// Helper function to format accuracy percentage
export const formatAccuracy = (accuracy: number): string => {
  return accuracy.toFixed(0) + '%';
};