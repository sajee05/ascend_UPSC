import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubjectStats } from "@shared/schema";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BrainCircuit, 
  PieChart, 
  TrendingUp, 
  Lightbulb, 
  Zap, 
  BarChart3, 
  Calendar,
  Sparkles,
  BookOpen,
  AlertTriangle,
  Check,
  ArrowUpRight
} from "lucide-react";

interface AIAnalyticsProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
}

export function AIAnalytics({ overallStats, subjectStats }: AIAnalyticsProps) {
  const [activeInsight, setActiveInsight] = useState<string>("performance");
  
  // ---------------- AI INSIGHTS PREPARATION ----------------
  
  // Sort subjects by accuracy for strengths and weaknesses 
  const sortedByAccuracy = [...subjectStats].sort((a, b) => b.accuracy - a.accuracy);
  
  // Strengths (top 2 subjects)
  const strengths = sortedByAccuracy.slice(0, 2).map(subject => ({
    name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
    accuracy: subject.accuracy,
    score: subject.score,
    attempts: subject.attempts
  }));
  
  // Weaknesses (bottom 2 subjects)
  const weaknesses = [...sortedByAccuracy].reverse().slice(0, 2).map(subject => ({
    name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
    accuracy: subject.accuracy,
    score: subject.score,
    attempts: subject.attempts
  }));
  
  // Time efficiency (subjects sorted by score/time ratio)
  const timeEfficiency = [...subjectStats]
    .sort((a, b) => {
      const aRatio = a.score / (a.avgTimeSeconds || 1);
      const bRatio = b.score / (b.avgTimeSeconds || 1);
      return bRatio - aRatio;
    })
    .slice(0, 2)
    .map(subject => ({
      name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
      avgTime: subject.avgTimeSeconds,
      accuracy: subject.accuracy,
      score: subject.score
    }));
  
  // Knowledge calibration analysis
  const overconfidentSubjects = subjectStats.filter(subject => {
    const confidenceRating = subject.attempts > 0 ? 
      (subject.confidenceHigh / subject.attempts) * 100 : 0;
    return confidenceRating > subject.accuracy + 15; // Subjects where confidence exceeds accuracy by 15%+
  }).map(subject => ({
    name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
    confidence: subject.attempts > 0 ? (subject.confidenceHigh / subject.attempts) * 100 : 0,
    accuracy: subject.accuracy
  }));
  
  const underconfidentSubjects = subjectStats.filter(subject => {
    const confidenceRating = subject.attempts > 0 ? 
      (subject.confidenceHigh / subject.attempts) * 100 : 0;
    return subject.accuracy > confidenceRating + 15; // Subjects where accuracy exceeds confidence by 15%+
  }).map(subject => ({
    name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
    confidence: subject.attempts > 0 ? (subject.confidenceHigh / subject.attempts) * 100 : 0,
    accuracy: subject.accuracy
  }));
  
  // Get topic recommendations based on strengths/weaknesses
  const getTopicRecommendations = () => {
    // Determine if the student is advanced, intermediate, or beginner
    let studentLevel = "intermediate";
    
    if (overallStats.accuracy > 75) {
      studentLevel = "advanced";
    } else if (overallStats.accuracy < 50) {
      studentLevel = "beginner";
    }
    
    // General study recommendations
    if (studentLevel === "advanced") {
      return {
        focus: "Mastery and Advanced Topics",
        recommendations: [
          "Focus on specialized topics within your strong subjects",
          "Tackle previous years' questions to understand exam patterns",
          "Aim for depth in weak areas rather than breadth",
          "Practice interconnecting different subjects in your answers"
        ]
      };
    } else if (studentLevel === "beginner") {
      return {
        focus: "Foundational Concepts",
        recommendations: [
          "Master the NCERT books for your weaker subjects",
          "Use mind maps to connect related concepts",
          "Focus on short answer questions before attempting lengthy ones",
          "Dedicate more time to understanding fundamental theories"
        ]
      };
    } else {
      return {
        focus: "Balanced Development",
        recommendations: [
          "Begin advanced studies in your strong subjects",
          "Focus on middle-level questions in weaker areas",
          "Practice more time-bound tests to improve efficiency",
          "Create structured notes connecting multiple topics"
        ]
      };
    }
  };
  
  // Prepare flashcard recommendations
  const flashcardRecommendations = weaknesses.map(weakness => ({
    subject: weakness.name,
    topics: [
      `Key concepts in ${weakness.name}`,
      `Important theories from ${weakness.name}`,
      `Historical developments in ${weakness.name}`
    ]
  }));
  
  // Generate a study plan based on current performance
  const generateStudyPlan = () => {
    // Weekly focus areas based on strengths and weaknesses
    return [
      {
        day: "Monday-Tuesday",
        focus: weaknesses[0]?.name || "Weak Subject 1",
        approach: "Deep dive into foundational concepts",
        activities: [
          "Read NCERT chapters", 
          "Practice basic questions", 
          "Create concept maps"
        ]
      },
      {
        day: "Wednesday",
        focus: strengths[0]?.name || "Strong Subject 1",
        approach: "Advanced practice and mastery",
        activities: [
          "Solve previous years' questions", 
          "Work on case studies", 
          "Read advanced material"
        ]
      },
      {
        day: "Thursday-Friday",
        focus: weaknesses[1]?.name || "Weak Subject 2",
        approach: "Structured learning and practice",
        activities: [
          "Review notes", 
          "Practice time-bound tests", 
          "Identify knowledge gaps"
        ]
      },
      {
        day: "Saturday",
        focus: "Revision and Integration",
        approach: "Connect concepts across subjects",
        activities: [
          "Take a full mock test", 
          "Review incorrect answers", 
          "Update flashcards"
        ]
      },
      {
        day: "Sunday",
        focus: "Rest and Review",
        approach: "Light review and planning",
        activities: [
          "Plan the next week", 
          "Review performance metrics", 
          "Brief reading of current affairs"
        ]
      }
    ];
  };
  
  // Performance metrics interpretation
  const performanceMetrics = [
    {
      metric: "Overall Accuracy",
      value: `${overallStats.accuracy.toFixed(1)}%`,
      interpretation: overallStats.accuracy > 70 ? "Strong" : 
                     overallStats.accuracy > 50 ? "Moderate" : "Needs improvement",
      action: overallStats.accuracy > 70 ? "Focus on mastery and advanced topics" :
             overallStats.accuracy > 50 ? "Balance between reinforcing strengths and improving weaknesses" :
             "Focus on fundamentals and core concepts"
    },
    {
      metric: "Knowledge Self-Assessment",
      value: `${Math.round((overallStats.knowledgeYes / Math.max(1, overallStats.attempts)) * 100)}%`,
      interpretation: overallStats.knowledgeYes > (overallStats.attempts * 0.7) ? "Good knowledge awareness" :
                     overallStats.knowledgeYes > (overallStats.attempts * 0.5) ? "Moderate knowledge awareness" :
                     "Low knowledge awareness",
      action: overallStats.knowledgeYes > (overallStats.attempts * 0.7) ? "Continue current approach" :
             overallStats.knowledgeYes > (overallStats.attempts * 0.5) ? "Work on identifying knowledge gaps" :
             "Focus on core concepts and fundamentals"
    },
    {
      metric: "Time Efficiency",
      value: `${overallStats.avgTimeSeconds.toFixed(0)} sec/question`,
      interpretation: overallStats.avgTimeSeconds < 60 ? "Excellent" :
                     overallStats.avgTimeSeconds < 90 ? "Good" :
                     overallStats.avgTimeSeconds < 120 ? "Acceptable" : "Needs improvement",
      action: overallStats.avgTimeSeconds < 60 ? "Maintain speed while ensuring accuracy" :
             overallStats.avgTimeSeconds < 90 ? "Practice timed mock tests" :
             overallStats.avgTimeSeconds < 120 ? "Work on speed-reading and quick decision making" :
             "Focus on question prioritization and time management"
    }
  ];
  
  // Topic recommendations based on the study plan
  const topicRecommendations = getTopicRecommendations();
  
  // Study plan
  const studyPlan = generateStudyPlan();

  return (
    <div className="mt-8 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI-Powered Analytics
        </h2>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Intelligent insights and personalized recommendations based on your performance data.
      </p>
      
      <Tabs defaultValue="performance" value={activeInsight} onValueChange={setActiveInsight} className="mb-8">
        <TabsList className="grid grid-cols-3 w-full sm:w-[400px]">
          <TabsTrigger value="performance" className="flex items-center gap-1">
            <PieChart className="h-3 w-3" /> Performance
          </TabsTrigger>
          <TabsTrigger value="study" className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> Study Plan
          </TabsTrigger>
          <TabsTrigger value="metacognitive" className="flex items-center gap-1">
            <BrainCircuit className="h-3 w-3" /> Metacognitive
          </TabsTrigger>
        </TabsList>
        
        {/* PERFORMANCE INSIGHTS */}
        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Top Performing Areas
                </CardTitle>
                <CardDescription>Your strongest subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {strengths.map((strength, index) => (
                    <li key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <div className="font-medium">{strength.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {strength.attempts} questions attempted
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {strength.accuracy.toFixed(1)}% accurate
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Continue mastering these subjects to excel.
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Areas Needing Improvement
                </CardTitle>
                <CardDescription>Subjects requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {weaknesses.map((weakness, index) => (
                    <li key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <div className="font-medium">{weakness.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {weakness.attempts} questions attempted
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        {weakness.accuracy.toFixed(1)}% accurate
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Focused practice will help improve these areas.
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  Time Efficiency
                </CardTitle>
                <CardDescription>Best time utilization subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {timeEfficiency.map((subject, index) => (
                    <li key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <div className="font-medium">{subject.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {subject.avgTime.toFixed(1)} seconds per question
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {subject.accuracy.toFixed(1)}% accurate
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                You answer questions efficiently in these areas.
              </CardFooter>
            </Card>
            
            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Performance Metrics Analysis
                </CardTitle>
                <CardDescription>AI interpretation of your key metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceMetrics.map((metric, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 border-b pb-3">
                      <div className="col-span-3 font-medium">{metric.metric}</div>
                      <div className="col-span-2 text-center font-semibold">{metric.value}</div>
                      <div className="col-span-3 text-sm">
                        <Badge variant={
                          metric.interpretation.includes("Strong") || 
                          metric.interpretation.includes("Good") || 
                          metric.interpretation.includes("Excellent") ? 
                          "outline" : "secondary"
                        } className={
                          (metric.interpretation.includes("Strong") || 
                          metric.interpretation.includes("Good") || 
                          metric.interpretation.includes("Excellent")) ? 
                          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : 
                          "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }>
                          {metric.interpretation}
                        </Badge>
                      </div>
                      <div className="col-span-4 text-sm text-muted-foreground">
                        {metric.action}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* STUDY PLAN */}
        <TabsContent value="study" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Personalized Study Plan
                </CardTitle>
                <CardDescription>Weekly schedule based on your performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studyPlan.map((day, index) => (
                    <div key={index} className="border-b pb-3">
                      <div className="flex justify-between">
                        <h4 className="font-semibold text-primary">{day.day}</h4>
                        <Badge variant="outline">{day.focus}</Badge>
                      </div>
                      <p className="text-sm mt-1">{day.approach}</p>
                      <ul className="mt-2 space-y-1">
                        {day.activities.map((activity, actIdx) => (
                          <li key={actIdx} className="text-sm flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Topic Recommendations
                </CardTitle>
                <CardDescription>{topicRecommendations.focus}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {topicRecommendations.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm flex items-start gap-2 pb-2 border-b">
                      <ArrowUpRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Generate Detailed Plan
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Flashcard Recommendations
                </CardTitle>
                <CardDescription>Suggested flashcard topics based on your weak areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {flashcardRecommendations.map((subject, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">{subject.subject}</h4>
                      <ul className="space-y-2">
                        {subject.topics.map((topic, topicIdx) => (
                          <li key={topicIdx} className="text-sm flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="sm">
                  Generate Flashcards
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* METACOGNITIVE INSIGHTS */}
        <TabsContent value="metacognitive" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Overconfidence
                </CardTitle>
                <CardDescription>Subjects where confidence exceeds accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                {overconfidentSubjects.length > 0 ? (
                  <ul className="space-y-3">
                    {overconfidentSubjects.map((subject, index) => (
                      <li key={index} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Gap: {Math.abs(subject.confidence - subject.accuracy).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            Confidence: <span className="font-semibold">{subject.confidence.toFixed(1)}%</span>
                          </div>
                          <div className="text-sm">
                            Accuracy: <span className="font-semibold">{subject.accuracy.toFixed(1)}%</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No significant overconfidence detected
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Be more careful in these areas and double-check your answers.
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-500" />
                  Underconfidence
                </CardTitle>
                <CardDescription>Subjects where accuracy exceeds confidence</CardDescription>
              </CardHeader>
              <CardContent>
                {underconfidentSubjects.length > 0 ? (
                  <ul className="space-y-3">
                    {underconfidentSubjects.map((subject, index) => (
                      <li key={index} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Gap: {Math.abs(subject.accuracy - subject.confidence).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            Accuracy: <span className="font-semibold">{subject.accuracy.toFixed(1)}%</span>
                          </div>
                          <div className="text-sm">
                            Confidence: <span className="font-semibold">{subject.confidence.toFixed(1)}%</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No significant underconfidence detected
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Trust your knowledge more in these subjects; you're doing better than you think.
              </CardFooter>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  Knowledge Calibration Strategy
                </CardTitle>
                <CardDescription>Recommendations to improve your metacognitive skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-primary/5">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Self-Assessment Practice
                    </h4>
                    <p className="text-sm">
                      Before checking answers, rate your confidence level for each question. Compare these 
                      ratings with your actual results to improve your ability to judge your own knowledge.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-primary/5">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Reflective Review
                    </h4>
                    <p className="text-sm">
                      After each test, spend time analyzing why you got questions wrong, especially 
                      those where you were confident. Look for patterns in your thinking process.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-primary/5">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Structured Knowledge Mapping
                    </h4>
                    <p className="text-sm">
                      Create concept maps for subjects where you show overconfidence to identify knowledge 
                      gaps. For underconfident areas, practice more and track your consistent successes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}