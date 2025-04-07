import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, BookIcon, TagIcon, Chrome } from "lucide-react";
import { QuestionWithTags } from "@shared/schema";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionView() {
  const { testId, questionId } = useParams();
  const [, navigate] = useLocation();

  // Get test-specific question
  const { data: question, isLoading, error } = useQuery<QuestionWithTags>({
    queryKey: ['/api/questions', questionId],
    enabled: !!questionId,
  });

  // Navigate back to test questions
  const goBackToTest = () => {
    if (testId) {
      navigate(`/tests/${testId}/questions`);
    } else {
      navigate('/questions');
    }
  };

  // Loading state
  if (isLoading) {
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
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={goBackToTest}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Questions
            </Button>
          </div>
          <CardTitle className="text-xl mt-4 flex items-center">
            <BookIcon className="h-5 w-5 mr-2" />
            Question {question.questionNumber}
          </CardTitle>
          <CardDescription>
            Test ID: {question.testId}
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

          {/* Explanation - commented out as it's not available in the current schema
          {question.explanation && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium mb-2">Explanation</h3>
              <p>{question.explanation}</p>
            </div>
          )}
          */}

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
      </Card>
    </motion.div>
  );
}