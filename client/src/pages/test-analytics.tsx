import { useParams, useLocation } from "wouter";
import { TestSummary } from "@/components/analytics/test-summary";
import { Charts } from "@/components/analytics/charts";
import { PerformanceTable } from "@/components/analytics/performance-table";
import { EnhancedAIInsights } from "@/components/analytics/enhanced-ai-insights";
import { AttemptTrackingCharts } from "@/components/analytics/attempt-tracking-chart";
import { InfographicGenerator } from "@/components/analytics/infographic-generator";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Cog, Moon, Sun, RefreshCw, BarChart3, ListIcon, Download, History, Share2 } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { useUIState } from "@/hooks/use-ui-state";
import { useQuery } from "@tanstack/react-query";
import { TestAnalytics } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { downloadCSV, generateFileName, generateCSV } from "@/lib/utils";

export default function TestAnalyticsPage() {
  const { attemptId } = useParams();
  const [, navigate] = useLocation();
  const { settings, updateSettings } = useSettings();
  const { updateUIState } = useUIState();
  const { toast } = useToast();

  // Fetch test analytics data
  const { data: analytics, isLoading, error } = useQuery<TestAnalytics>({
    queryKey: [`/api/analytics/test/${attemptId}`],
    enabled: !!attemptId,
  });

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    updateSettings({ theme: newTheme as "light" | "dark" });
  };

  // Open settings panel
  const openSettings = () => {
    updateUIState({ settingsPanelOpen: true });
  };

  // Handle re-attempt test
  const handleReAttemptTest = async () => {
    if (!analytics) return;
    
    try {
      // Create a new attempt
      const response = await apiRequest("POST", "/api/attempts", {
        testId: analytics.testId,
        attemptNumber: 1, // This will be adjusted on the server based on existing attempts
      });
      
      const attempt = await response.json();
      
      // Navigate to quiz page
      navigate(`/quiz/${attempt.id}`);
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle generate Anki CSV
  const handleGenerateAnki = async () => {
    if (!analytics) return;
    
    try {
      // Fetch anki data
      const response = await fetch(`/api/tests/${analytics.testId}/anki`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate Anki data");
      }
      
      const ankiData = await response.json();
      
      // Generate and download CSV
      const csvContent = generateCSV(
        ankiData,
        ["front", "back", "tags"]
      );
      
      const filename = generateFileName(analytics.title + '_Anki', 'csv');
      downloadCSV(csvContent, filename);
      
      toast({
        title: "Success",
        description: `Anki CSV generated for ${analytics.title}`,
      });
    } catch (error) {
      console.error("Error generating Anki CSV:", error);
      toast({
        title: "Error",
        description: "Failed to generate Anki CSV. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Logo />
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Logo />
          <div className="text-red-500">
            {error ? `Error: ${(error as Error).message}` : "Analytics not found"}
          </div>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Test Summary Header */}
          <TestSummary analytics={analytics} />
          
          {/* Charts */}
          <Charts 
            overallStats={analytics.overallStats} 
            subjectStats={analytics.subjectStats} 
          />
          
          {/* Attempt Tracking Charts */}
          <div className="mt-8 mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-primary" />
              Attempt Tracking Analytics
            </h2>
            <p className="text-muted-foreground mb-6">
              Track your performance across multiple attempts and see how you improve over time.
            </p>
            <AttemptTrackingCharts stats={analytics.overallStats} />
          </div>
          
          {/* Detailed Analytics Table */}
          <PerformanceTable 
            overallStats={analytics.overallStats} 
            subjectStats={analytics.subjectStats}
            editable={true}
          />
          
          {/* AI Recommendations */}
          <EnhancedAIInsights 
            overallStats={analytics.overallStats} 
            subjectStats={analytics.subjectStats}
          />
          
          {/* Infographic Generator */}
          <div className="mt-8 mb-8">
            <InfographicGenerator
              testTitle={analytics.title}
              testDate={analytics.date}
              overallStats={analytics.overallStats}
              subjectStats={analytics.subjectStats}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleReAttemptTest}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Re-attempt Test
            </Button>
            <Button 
              onClick={() => navigate("/overall-analytics")}
              className="gap-2"
              variant="secondary"
            >
              <BarChart3 className="h-4 w-4" /> Overall Analytics
            </Button>
            <Button 
              onClick={() => navigate("/")}
              className="gap-2"
              variant="outline"
            >
              <ListIcon className="h-4 w-4" /> Review Answers
            </Button>
            <Button 
              onClick={handleGenerateAnki}
              className="gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" /> Generate Anki CSV
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
