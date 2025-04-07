import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/use-settings";
import { SubjectStats } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Brain, PenLine, TrendingUp, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

interface RecommendationCardsProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
}

// Interface for our recommendation items
interface Recommendation {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  subject?: string;
}

export function RecommendationCards({ overallStats, subjectStats }: RecommendationCardsProps) {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    // We'll start with some initial recommendations based on data
    ...generateInitialRecommendations(overallStats, subjectStats)
  ]);

  // Generate initial recommendations based on statistics
  function generateInitialRecommendations(overallStats: SubjectStats, subjectStats: SubjectStats[]): Recommendation[] {
    const initialRecommendations: Recommendation[] = [];
    
    // Sort subjects by accuracy (lowest first)
    const sortedByAccuracy = [...subjectStats].sort((a, b) => a.accuracy - b.accuracy);
    
    // Lowest accuracy subject recommendation
    if (sortedByAccuracy.length > 0) {
      const lowestAccuracy = sortedByAccuracy[0];
      if (lowestAccuracy.accuracy < 60) {
        initialRecommendations.push({
          title: `${lowestAccuracy.subject} Needs Attention`,
          content: `Your accuracy in ${lowestAccuracy.subject} is ${lowestAccuracy.accuracy.toFixed(1)}%, the lowest among all subjects. Consider dedicating more study time to strengthen your fundamentals.`,
          priority: 'high',
          subject: lowestAccuracy.subject
        });
      }
    }
    
    // Check for subjects with high guesswork
    const highGuessworkSubjects = subjectStats.filter(
      subject => (subject.guessworkYes / Math.max(1, subject.attempts)) > 0.3
    );
    
    if (highGuessworkSubjects.length > 0) {
      const highestGuesswork = highGuessworkSubjects.sort(
        (a, b) => (b.guessworkYes / Math.max(1, b.attempts)) - (a.guessworkYes / Math.max(1, a.attempts))
      )[0];
      
      initialRecommendations.push({
        title: `${highestGuesswork.subject} Guesswork Analysis`,
        content: `${Math.round((highestGuesswork.guessworkYes / Math.max(1, highestGuesswork.attempts)) * 100)}% of your ${highestGuesswork.subject} answers involve guesswork. Focus on building a stronger knowledge foundation in this area.`,
        priority: 'medium',
        subject: highestGuesswork.subject
      });
    }
    
    // Check for time management issues
    const slowSubjects = subjectStats.filter(
      subject => subject.avgTimeSeconds > 60 && subject.attempts >= 5
    );
    
    if (slowSubjects.length > 0) {
      const slowestSubject = slowSubjects.sort(
        (a, b) => b.avgTimeSeconds - a.avgTimeSeconds
      )[0];
      
      initialRecommendations.push({
        title: `Time Management for ${slowestSubject.subject}`,
        content: `You're taking an average of ${Math.round(slowestSubject.avgTimeSeconds)} seconds per question in ${slowestSubject.subject}, which is considerably high. Practice timed exercises to improve your speed.`,
        priority: 'medium',
        subject: slowestSubject.subject
      });
    }
    
    // Check for confidence and accuracy mismatches
    const overconfidentSubjects = subjectStats.filter(subject => {
      const confidenceRatio = subject.confidenceHigh / Math.max(1, subject.attempts);
      return confidenceRatio > 0.6 && subject.accuracy < 70;
    });
    
    if (overconfidentSubjects.length > 0) {
      const mostOverconfident = overconfidentSubjects[0];
      initialRecommendations.push({
        title: `Overconfidence in ${mostOverconfident.subject}`,
        content: `You have high confidence in ${mostOverconfident.subject} (${Math.round((mostOverconfident.confidenceHigh / Math.max(1, mostOverconfident.attempts)) * 100)}% of questions), but your accuracy is only ${mostOverconfident.accuracy.toFixed(1)}%. Work on validating your knowledge with more practice.`,
        priority: 'high',
        subject: mostOverconfident.subject
      });
    }
    
    // Add a general recommendation if we don't have enough
    if (initialRecommendations.length < 3) {
      initialRecommendations.push({
        title: "Meta-Cognitive Learning Approach",
        content: "Your self-awareness about your knowledge levels can be improved. For each question, try to consciously evaluate why you know (or don't know) the answer before selecting an option.",
        priority: 'low'
      });
    }
    
    return initialRecommendations;
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch(priority) {
      case 'high':
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case 'medium':
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400";
      case 'low':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getIconForRecommendation = (recommendation: Recommendation) => {
    if (recommendation.title.toLowerCase().includes('time')) {
      return <TrendingUp className="h-5 w-5" />;
    } else if (recommendation.title.toLowerCase().includes('confidence') || recommendation.title.toLowerCase().includes('meta')) {
      return <Brain className="h-5 w-5" />;
    } else if (recommendation.title.toLowerCase().includes('guesswork')) {
      return <PenLine className="h-5 w-5" />;
    } else {
      return <Lightbulb className="h-5 w-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-6 text-center text-primary">
            Meta-Cognitive Improvement Suggestions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="group"
              >
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 bg-primary/5 dark:bg-primary/10 overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start mb-2">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary mr-3">
                        {getIconForRecommendation(recommendation)}
                      </div>
                      <h4 className="font-semibold text-lg flex-1">{recommendation.title}</h4>
                    </div>
                    
                    <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                      {recommendation.content}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 items-center mt-auto">
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${getPriorityBadgeColor(recommendation.priority)}`}
                      >
                        {recommendation.priority} Priority
                      </Badge>
                      
                      {recommendation.subject && (
                        <Badge variant="outline" className="bg-primary/5 dark:bg-primary/20">
                          {recommendation.subject}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}