import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chrome, BookOpen, Lightbulb, Brain, RefreshCwIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { getAnalyticsInsights, getStudyPlanRecommendations, getLearningPatternAnalysis } from "@/lib/gemini";
import { SubjectStats } from "@shared/schema";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

interface EnhancedAIInsightsProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
}

export function EnhancedAIInsights({ overallStats, subjectStats }: EnhancedAIInsightsProps) {
  const [activeTab, setActiveTab] = useState("insights");
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [learningPattern, setLearningPattern] = useState<string | null>(null);
  const { settings } = useSettings();
  const { toast } = useToast();

  const generateInsights = async () => {
    if (!settings.aiEnabled || !settings.aiApiKey) {
      toast({
        title: "AI Integration Disabled",
        description: "Please enable AI integration in settings and provide an API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const aiInsights = await getAnalyticsInsights(
        { overallStats, subjectStats },
        settings.aiApiKey,
        settings.aiModel,
        settings.analyticsPrompt
      );
      
      setInsights(aiInsights);
    } catch (error) {
      console.error("Error getting AI insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateStudyPlan = async () => {
    if (!settings.aiEnabled || !settings.aiApiKey) {
      toast({
        title: "AI Integration Disabled",
        description: "Please enable AI integration in settings and provide an API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const plan = await getStudyPlanRecommendations(
        { overallStats, subjectStats },
        settings.aiApiKey,
        settings.aiModel,
        settings.studyPlanPrompt
      );
      
      setStudyPlan(plan);
    } catch (error) {
      console.error("Error getting study plan:", error);
      toast({
        title: "Error",
        description: "Failed to generate study plan. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateLearningPattern = async () => {
    if (!settings.aiEnabled || !settings.aiApiKey) {
      toast({
        title: "AI Integration Disabled",
        description: "Please enable AI integration in settings and provide an API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const pattern = await getLearningPatternAnalysis(
        { overallStats, subjectStats },
        settings.aiApiKey,
        settings.aiModel,
        settings.learningPatternPrompt
      );
      
      setLearningPattern(pattern);
    } catch (error) {
      console.error("Error getting learning pattern:", error);
      toast({
        title: "Error",
        description: "Failed to analyze learning pattern. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Generate content if this tab is selected for the first time and has no content
    if (value === "insights" && !insights && !isLoading) {
      generateInsights();
    } else if (value === "studyPlan" && !studyPlan && !isLoading) {
      generateStudyPlan();
    } else if (value === "learningPattern" && !learningPattern && !isLoading) {
      generateLearningPattern();
    }
  };

  if (!settings.aiEnabled || !settings.aiApiKey) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <Card className="border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="flex items-center space-x-2">
            <Chrome className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              AI insights are disabled. Enable AI in settings to get personalized recommendations.
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  const renderContent = (content: string | null, loading: boolean, regenerateFunction: () => Promise<void>) => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-2 mt-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      );
    }

    if (!content) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <p className="text-muted-foreground mb-4">No data available yet</p>
          <Button onClick={regenerateFunction} variant="outline">
            Generate
          </Button>
        </div>
      );
    }

    return (
      <div className="prose prose-sm dark:prose-invert mt-4 max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
          {content || ''}
        </ReactMarkdown>

        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-3"
          onClick={regenerateFunction}
          disabled={isLoading}
        >
          <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-8"
    >
      <Card className="border-l-4 border-amber-500 dark:border-amber-400">
        <CardContent className="p-6">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="font-medium mb-4 flex items-center">
                AI-Powered Learning Assistant
                <span className="ml-2 px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                  {settings.aiModel}
                </span>
              </h3>
              
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="insights" className="flex items-center space-x-1">
                    <Lightbulb className="h-4 w-4 mr-1" />
                    <span>Insights</span>
                  </TabsTrigger>
                  <TabsTrigger value="studyPlan" className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>Study Plan</span>
                  </TabsTrigger>
                  <TabsTrigger value="learningPattern" className="flex items-center space-x-1">
                    <Brain className="h-4 w-4 mr-1" />
                    <span>Learning Pattern</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="insights" className="space-y-4">
                  {renderContent(insights, isLoading && activeTab === "insights", generateInsights)}
                </TabsContent>
                
                <TabsContent value="studyPlan" className="space-y-4">
                  {renderContent(studyPlan, isLoading && activeTab === "studyPlan", generateStudyPlan)}
                </TabsContent>
                
                <TabsContent value="learningPattern" className="space-y-4">
                  {renderContent(learningPattern, isLoading && activeTab === "learningPattern", generateLearningPattern)}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}