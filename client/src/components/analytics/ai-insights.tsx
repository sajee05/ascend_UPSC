import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chrome, RefreshCwIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { getAnalyticsInsights } from "@/lib/gemini";
import { SubjectStats } from "@shared/schema";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

interface AIInsightsProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
}

export function AIInsights({ overallStats, subjectStats }: AIInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
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

  if (!insights && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <Button 
          variant="secondary" 
          onClick={generateInsights}
          disabled={!settings.aiEnabled || !settings.aiApiKey}
        >
          <Chrome className="h-4 w-4 mr-2" />
          Get AI Insights
        </Button>
        {(!settings.aiEnabled || !settings.aiApiKey) && (
          <p className="text-sm text-muted-foreground mt-2">
            AI integration is disabled. Enable it in settings to get insights.
          </p>
        )}
      </motion.div>
    );
  }

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
            <div className="flex-shrink-0 mr-4">
              <Chrome className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-2 flex items-center">
                AI-Generated Insights
                <span className="ml-2 px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                  {settings.aiModel}
                </span>
              </h3>
              
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown 
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      // Add custom components for better table rendering
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-4">
                          <table className="border-collapse w-full border border-gray-300 dark:border-gray-700" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => (
                        <thead className="bg-muted" {...props} />
                      ),
                      th: ({node, ...props}) => (
                        <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold" {...props} />
                      ),
                      td: ({node, ...props}) => (
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-2" {...props} />
                      ),
                      tr: ({node, ...props}) => (
                        <tr className="border-b border-gray-300 dark:border-gray-700" {...props} />
                      ),
                      code: ({node, ...props}) => (
                        <code className="bg-muted px-1 py-0.5 rounded font-mono text-sm" {...props} />
                      ),
                      pre: ({node, ...props}) => (
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto" {...props} />
                      ),
                    }}
                  >
                    {insights || ''}
                  </ReactMarkdown>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-3"
                onClick={generateInsights}
                disabled={isLoading}
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate Insights
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
