import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ArrowRightIcon, BookIcon, TagIcon, Chrome, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { QuestionWithTags } from "@shared/schema";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export default function QuestionView() {
  const { testId, questionId } = useParams();
  const [, navigate] = useLocation();
  const [allQuestions, setAllQuestions] = useState<QuestionWithTags[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // Get all questions for this test for navigation
  const { data: testQuestions, isLoading: isLoadingTestQuestions } = useQuery<QuestionWithTags[]>({
    queryKey: ['/api/tests', testId, 'questions'],
    enabled: !!testId,
  });

  // Get test-specific question
  const { data: question, isLoading: isLoadingQuestion, error } = useQuery<QuestionWithTags>({
    queryKey: ['/api/questions', questionId],
    enabled: !!questionId,
  });

  // Set up all questions and current index when data loads
  useEffect(() => {
    if (testQuestions && question) {
      setAllQuestions(testQuestions);
      const index = testQuestions.findIndex(q => q.id === parseInt(questionId as string));
      setCurrentIndex(index);
    }
  }, [testQuestions, question, questionId]);

  // Navigate back to test questions
  const goBackToTest = () => {
    if (testId) {
      navigate(`/tests/${testId}/questions`);
    } else {
      navigate('/questions');
    }
  };

  // Navigate to the previous question
  const goToPreviousQuestion = () => {
    if (currentIndex > 0 && testId) {
      const prevQuestion = allQuestions[currentIndex - 1];
      navigate(`/tests/${testId}/questions/${prevQuestion.id}`);
    }
  };

  // Navigate to the next question
  const goToNextQuestion = () => {
    if (currentIndex < allQuestions.length - 1 && testId) {
      const nextQuestion = allQuestions[currentIndex + 1];
      navigate(`/tests/${testId}/questions/${nextQuestion.id}`);
    }
  };

  // Navigate to home
  const goToHome = () => {
    navigate('/');
  };

  // Loading state
  if (isLoadingQuestion || isLoadingTestQuestions) {
    return (
      <div className="container mx-auto py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !question) {
    return (
      <div className="container mx-auto py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Could not find the requested question.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-red-500">
              {error ? (error as Error).message : "Question not found"}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={goBackToTest}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8"
    >
      <Card className="shadow-lg relative">
        {/* Top-level navigation */}
        <div className="flex items-center justify-between p-4">
          <Button variant="outline" size="sm" onClick={goBackToTest}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to All Questions
          </Button>
          <Button variant="outline" size="sm" onClick={goToHome}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>

        {/* Left/Right Navigation */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 ml-2 z-10">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-background/80 backdrop-blur-sm"
            onClick={goToPreviousQuestion}
            disabled={currentIndex <= 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-2 z-10">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-background/80 backdrop-blur-sm"
            onClick={goToNextQuestion}
            disabled={currentIndex >= allQuestions.length - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <BookIcon className="h-5 w-5 mr-2" />
            Question {question.questionNumber} 
            <span className="text-sm text-muted-foreground ml-2">
              {currentIndex >= 0 && `(${currentIndex + 1} of ${allQuestions.length})`}
            </span>
          </CardTitle>
          <CardDescription>
            {testQuestions && testQuestions.length > 0 && testQuestions[0].testId && (
              <>Test: {testQuestions[0].testId}</>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Question text */}
          <div className="mb-6 text-lg">
            {question.questionText}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card className={`p-4 ${question.correctAnswer === 'A' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}`}>
              <div className="font-medium">A. {question.optionA}</div>
              {question.correctAnswer === 'A' && <div className="text-green-600 dark:text-green-400 text-sm mt-2">Correct Answer</div>}
            </Card>
            <Card className={`p-4 ${question.correctAnswer === 'B' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}`}>
              <div className="font-medium">B. {question.optionB}</div>
              {question.correctAnswer === 'B' && <div className="text-green-600 dark:text-green-400 text-sm mt-2">Correct Answer</div>}
            </Card>
            <Card className={`p-4 ${question.correctAnswer === 'C' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}`}>
              <div className="font-medium">C. {question.optionC}</div>
              {question.correctAnswer === 'C' && <div className="text-green-600 dark:text-green-400 text-sm mt-2">Correct Answer</div>}
            </Card>
            <Card className={`p-4 ${question.correctAnswer === 'D' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}`}>
              <div className="font-medium">D. {question.optionD}</div>
              {question.correctAnswer === 'D' && <div className="text-green-600 dark:text-green-400 text-sm mt-2">Correct Answer</div>}
            </Card>
          </div>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {[...question.tags].sort((a, b) => a.tagName.localeCompare(b.tagName)).map(tag => (
                  <Badge
                    key={tag.id}
                    variant={tag.isAIGenerated ? "outline" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {tag.isAIGenerated ? (
                      <Chrome className="h-3 w-3" />
                    ) : (
                      <TagIcon className="h-3 w-3" />
                    )}
                    {tag.tagName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        {/* Bottom navigation controls */}
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={goToPreviousQuestion}
            disabled={currentIndex <= 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button 
            variant="outline" 
            onClick={goToNextQuestion}
            disabled={currentIndex >= allQuestions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}