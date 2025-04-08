import { useParams, useLocation } from "wouter";
import { TestSummary } from "@/components/analytics/test-summary";
import { AdvancedCharts } from "@/components/analytics/advanced-charts";
import { AIAnalytics } from "@/components/analytics/ai-analytics";
import { AnalyticsExport } from "@/components/analytics/analytics-export";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { 
  RefreshCw, 
  BarChart3, 
  ListIcon, 
  Download, 
  ArrowLeft,
  History
} from "lucide-react";
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
          {/* Back button */}
          <div className="mb-6">
            <Button 
              onClick={() => navigate("/")}
              variant="ghost"
              className="gap-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Tests
            </Button>
          </div>
          
          {/* Test Summary Header */}
          <TestSummary analytics={analytics} />
          
          {/* Advanced Charts */}
          <AdvancedCharts 
            overallStats={analytics.overallStats} 
            subjectStats={analytics.subjectStats} 
          />
          
          {/* AI Analytics */}
          <AIAnalytics 
            overallStats={analytics.overallStats} 
            subjectStats={analytics.subjectStats}
          />
          
          {/* Analytics Export */}
          <AnalyticsExport
            testTitle={analytics.title}
            testDate={analytics.date}
            overallStats={analytics.overallStats}
            subjectStats={analytics.subjectStats}
          />
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-8">
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
              <ListIcon className="h-4 w-4" /> All Tests
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
