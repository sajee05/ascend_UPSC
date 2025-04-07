import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayIcon, DownloadIcon, BarChart3Icon, Loader2Icon, EyeIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, downloadCSV, generateFileName } from "@/lib/utils";
import { TestWithStats, QuestionWithTags } from "@shared/schema";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// QuizPreviewDialog component
function QuizPreviewDialog({ 
  testId, 
  isOpen, 
  onClose, 
  onStartQuiz 
}: { 
  testId: number; 
  isOpen: boolean; 
  onClose: () => void; 
  onStartQuiz: () => void;
}) {
  const [previewQuestions, setPreviewQuestions] = useState<QuestionWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load the questions for this test
  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/tests/${testId}/questions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to load questions");
      }

      const questions = await response.json();
      setPreviewQuestions(questions);
    } catch (err) {
      console.error("Error loading questions:", err);
      setError("Failed to load questions for preview");
      toast({
        title: "Error",
        description: "Failed to load quiz questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load questions when the dialog opens
  useEffect(() => {
    if (isOpen && testId) {
      loadQuestions();
    }
  }, [isOpen, testId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quiz Preview</DialogTitle>
          <DialogDescription>
            Review the questions before starting the quiz
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2Icon className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
            <p>Loading questions...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="font-medium">This quiz contains {previewQuestions.length} questions:</p>
            <div className="space-y-3 mt-4">
              {previewQuestions.slice(0, 3).map((question, index) => (
                <Card key={question.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <p className="font-medium">Question {index + 1}: {question.questionText.length > 100 
                      ? question.questionText.substring(0, 100) + '...' 
                      : question.questionText}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                      <p>A: {question.optionA.substring(0, 40)}...</p>
                      <p>B: {question.optionB.substring(0, 40)}...</p>
                      <p>C: {question.optionC.substring(0, 40)}...</p>
                      <p>D: {question.optionD.substring(0, 40)}...</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {previewQuestions.length > 3 && (
                <p className="text-center text-muted-foreground">
                  And {previewQuestions.length - 3} more questions...
                </p>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button 
            onClick={onStartQuiz} 
            disabled={isLoading || !!error}
            className="ml-2"
          >
            Start Quiz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TestList() {
  const [isGeneratingAnki, setIsGeneratingAnki] = useState<number | null>(null);
  const [isStartingQuiz, setIsStartingQuiz] = useState<number | null>(null);
  const [previewTestId, setPreviewTestId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: tests, isLoading, error } = useQuery<TestWithStats[]>({
    queryKey: ["/api/tests"],
  });
  
  // Show preview before starting quiz
  const handlePreviewQuiz = (testId: number) => {
    setPreviewTestId(testId);
  };
  
  // Close preview dialog
  const handleClosePreview = () => {
    setPreviewTestId(null);
  };

  const handleStartQuiz = async (testId: number) => {
    try {
      setIsStartingQuiz(testId);
      
      // Get previous attempts to determine attempt number
      const attemptsResponse = await fetch(`/api/tests/${testId}/attempts`, {
        credentials: 'include',
      });
      
      if (!attemptsResponse.ok) {
        throw new Error("Failed to fetch attempts");
      }
      
      const attempts = await attemptsResponse.json();
      const attemptNumber = attempts.length + 1;
      
      // Create a new attempt
      const attemptResponse = await apiRequest("POST", "/api/attempts", {
        testId,
        attemptNumber,
      });
      
      const attempt = await attemptResponse.json();
      
      // Close the preview dialog if it's open
      setPreviewTestId(null);
      
      // Navigate to quiz page
      navigate(`/quiz/${attempt.id}`);
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStartingQuiz(null);
    }
  };

  const handleGenerateAnki = async (testId: number, title: string) => {
    try {
      setIsGeneratingAnki(testId);
      
      // Fetch anki data
      const response = await fetch(`/api/tests/${testId}/anki`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate Anki data");
      }
      
      const ankiData = await response.json();
      
      // Convert to CSV
      const csvData = ankiData.map((item: any) => ({
        front: item.front,
        back: item.back,
        tags: item.tags,
      }));
      
      const csv = csvData.map(row => {
        // Properly handle commas and newlines by quoting
        const front = `"${row.front.replace(/"/g, '""')}"`;
        const back = `"${row.back.replace(/"/g, '""')}"`;
        const tags = `"${row.tags}"`;
        return `${front},${back},${tags}`;
      }).join('\n');
      
      // Add header
      const csvContent = `front,back,tags\n${csv}`;
      
      // Clean the title for filename
      const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = generateFileName(cleanTitle + '_Anki', 'csv');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: `Anki CSV generated for ${title}`,
      });
    } catch (error) {
      console.error("Error generating Anki CSV:", error);
      toast({
        title: "Error",
        description: "Failed to generate Anki CSV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAnki(null);
    }
  };

  const handleViewAnalytics = async (testId: number) => {
    try {
      // Get the most recent completed attempt
      const attemptsResponse = await fetch(`/api/tests/${testId}/attempts`, {
        credentials: 'include',
      });
      
      if (!attemptsResponse.ok) {
        throw new Error("Failed to fetch attempts");
      }
      
      const attempts = await attemptsResponse.json();
      const completedAttempts = attempts.filter((a: any) => a.completed);
      
      if (completedAttempts.length === 0) {
        toast({
          title: "No completed attempts",
          description: "You need to complete a quiz attempt first.",
          variant: "warning",
        });
        return;
      }
      
      // Sort by newest first
      completedAttempts.sort((a: any, b: any) => 
        new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
      );
      
      // Navigate to the analytics page for the most recent attempt
      navigate(`/test-analytics/${completedAttempts[0].id}`);
    } catch (error) {
      console.error("Error viewing analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-60" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <CardContent className="p-4">
          <p className="text-red-600 dark:text-red-400">Error loading tests: {(error as Error).message}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/tests"] })}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!tests || tests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No tests uploaded yet. Upload your first test above.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Preview dialog */}
      {previewTestId && (
        <QuizPreviewDialog
          testId={previewTestId}
          isOpen={previewTestId !== null}
          onClose={handleClosePreview}
          onStartQuiz={() => handleStartQuiz(previewTestId)}
        />
      )}
    
      {tests.map((test) => (
        <Card 
          key={test.id} 
          className="transition-all hover:shadow-md"
        >
          <CardContent className="p-4">
            <div className="flex flex-wrap justify-between items-center">
              <div>
                <h4 className="font-medium">{test.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Uploaded on {formatDate(test.uploadedAt)} • {test.questionCount} questions
                  {test.attempts > 0 && ` • ${test.attempts} attempt${test.attempts !== 1 ? 's' : ''}`}
                  {test.bestScore !== null && ` • Best score: ${test.bestScore.toFixed(1)}`}
                </p>
              </div>
              <div className="flex space-x-2 mt-2 sm:mt-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Start Quiz"
                  onClick={() => handlePreviewQuiz(test.id)}
                  disabled={isStartingQuiz === test.id}
                >
                  {isStartingQuiz === test.id ? (
                    <Loader2Icon className="h-4 w-4 animate-spin text-green-600 dark:text-green-400" />
                  ) : (
                    <PlayIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Browse Questions"
                  onClick={() => navigate(`/tests/${test.id}/questions`)}
                >
                  <EyeIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Generate Anki CSV"
                  onClick={() => handleGenerateAnki(test.id, test.title)}
                  disabled={isGeneratingAnki === test.id}
                >
                  {isGeneratingAnki === test.id ? (
                    <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <DownloadIcon className="h-4 w-4 text-primary" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="View Analytics"
                  onClick={() => handleViewAnalytics(test.id)}
                  disabled={test.attempts === 0}
                >
                  <BarChart3Icon className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
