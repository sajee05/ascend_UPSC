import { Card, CardContent } from "@/components/ui/card";
import { SubjectStats } from "@shared/schema";
import { motion } from "framer-motion";
import { ArrowUp, Brain, Clock, Award, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface KnowledgeCalibrationCardProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
}

export function KnowledgeCalibrationCard({ overallStats, subjectStats }: KnowledgeCalibrationCardProps) {
  // Calculate knowledge calibration metrics
  const calculateMetrics = () => {
    const totalAttempts = Math.max(1, overallStats.attempts);
    
    // Known & Correct (when knowledge=yes and answer is correct)
    const knownCorrectCount = Math.min(overallStats.knowledgeYes, overallStats.correct);
    const knownCorrectPercentage = Math.round((knownCorrectCount / Math.max(1, overallStats.knowledgeYes)) * 100);
    
    // Known & Incorrect (when knowledge=yes but answer is incorrect)
    const knownIncorrectCount = Math.min(overallStats.knowledgeYes, overallStats.incorrect);
    const knownIncorrectPercentage = Math.round((knownIncorrectCount / Math.max(1, overallStats.knowledgeYes)) * 100);
    
    // Technique Success (when technique=yes and answer is correct)
    const techniqueSuccessCount = Math.min(overallStats.techniqueYes, overallStats.correct);
    const techniqueSuccessPercentage = Math.round((techniqueSuccessCount / Math.max(1, overallStats.techniqueYes)) * 100);
    
    // Lucky Guesses (when guesswork=yes but answer is correct)
    const luckyGuessCount = Math.min(overallStats.guessworkYes, overallStats.correct);
    const luckyGuessPercentage = Math.round((luckyGuessCount / Math.max(1, overallStats.guessworkYes)) * 100);
    
    // High Confidence Accuracy (when confidence=high and answer is correct)
    const highConfidenceCorrectCount = Math.min(overallStats.confidenceHigh, overallStats.correct);
    const highConfidenceAccuracy = Math.round((highConfidenceCorrectCount / Math.max(1, overallStats.confidenceHigh)) * 100);
    
    // Low Confidence Accuracy (when confidence=low but answer is correct)
    const lowConfidenceCorrectCount = Math.min(overallStats.confidenceLow, overallStats.correct);
    const lowConfidenceAccuracy = Math.round((lowConfidenceCorrectCount / Math.max(1, overallStats.confidenceLow)) * 100);
    
    return {
      knownCorrectPercentage,
      knownIncorrectPercentage,
      techniqueSuccessPercentage,
      luckyGuessPercentage,
      highConfidenceAccuracy,
      lowConfidenceAccuracy
    };
  };
  
  const metrics = calculateMetrics();
  
  // Helper function to determine the color based on percentage
  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 60) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-6 text-center text-primary">
            Knowledge Calibration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Claimed Knowledge Accuracy */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 p-2 rounded-full bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div className={`text-3xl font-bold mb-1 ${getColorClass(metrics.knownCorrectPercentage)}`}>
                {metrics.knownCorrectPercentage}%
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Correct when Claimed Knowledge
              </div>
              <Progress 
                value={metrics.knownCorrectPercentage} 
                className="h-2 w-full max-w-[12rem]" 
              />
            </div>
            
            {/* Technique Effectiveness */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 p-2 rounded-full bg-primary/10">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div className={`text-3xl font-bold mb-1 ${getColorClass(metrics.techniqueSuccessPercentage)}`}>
                {metrics.techniqueSuccessPercentage}%
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Technique Effectiveness
              </div>
              <Progress 
                value={metrics.techniqueSuccessPercentage} 
                className="h-2 w-full max-w-[12rem]" 
              />
            </div>
            
            {/* High Confidence Accuracy */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 p-2 rounded-full bg-primary/10">
                <ArrowUp className="h-6 w-6 text-primary" />
              </div>
              <div className={`text-3xl font-bold mb-1 ${getColorClass(metrics.highConfidenceAccuracy)}`}>
                {metrics.highConfidenceAccuracy}%
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                High Confidence Accuracy
              </div>
              <Progress 
                value={metrics.highConfidenceAccuracy} 
                className="h-2 w-full max-w-[12rem]" 
              />
            </div>
            
            {/* Knowledge Overestimation */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div className={`text-3xl font-bold mb-1 ${getColorClass(100 - metrics.knownIncorrectPercentage)}`}>
                {metrics.knownIncorrectPercentage}%
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Knowledge Overestimation
              </div>
              <Progress 
                value={metrics.knownIncorrectPercentage} 
                className="h-2 w-full max-w-[12rem]"
                indicatorColor="rgb(239, 68, 68)" // text-red-500 color
              />
            </div>
            
            {/* Lucky Guesses */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 p-2 rounded-full bg-amber-100 dark:bg-amber-900/20">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div className="text-3xl font-bold mb-1 text-amber-500">
                {metrics.luckyGuessPercentage}%
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Successful Guesses
              </div>
              <Progress 
                value={metrics.luckyGuessPercentage} 
                className="h-2 w-full max-w-[12rem]"
                indicatorColor="rgb(245, 158, 11)" // text-amber-500 color
              />
            </div>
            
            {/* Low Confidence Surprise */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Brain className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-3xl font-bold mb-1 text-blue-500">
                {metrics.lowConfidenceAccuracy}%
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Low Confidence Success
              </div>
              <Progress 
                value={metrics.lowConfidenceAccuracy} 
                className="h-2 w-full max-w-[12rem]"
                indicatorColor="rgb(59, 130, 246)" // text-blue-500 color
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}