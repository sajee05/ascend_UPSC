import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { QuizCard } from "@/components/quiz-card";
import { AnsweredQuestionCard } from "@/components/answered-question-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/ui/logo";
import { Cog, Moon, Sun, Clock, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { useUIState } from "@/hooks/use-ui-state";
import { Attempt, InsertUserAnswer, QuestionWithTags, UserAnswer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { formatTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Quiz() {
  const { attemptId } = useParams();
  const [, navigate] = useLocation();
  const { settings, updateSettings } = useSettings();
  const { updateUIState } = useUIState();
  const { toast } = useToast();
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [userAnswers, setUserAnswers] = useState<Map<number, UserAnswer>>(new Map());
  const [timer, setTimer] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // End quiz dialog state
  const [showEndQuizDialog, setShowEndQuizDialog] = useState(false);

  // Fetch attempt data
  const { data: attempt, isLoading: isLoadingAttempt } = useQuery<Attempt>({
    queryKey: [`/api/attempts/${attemptId}`],
    enabled: !!attemptId,
  });

  // Fetch questions for the test
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<QuestionWithTags[]>({
    queryKey: [`/api/tests/${attempt?.testId}/questions`],
    enabled: !!attempt?.testId,
  });

  // Fetch existing answers (in case of returning to quiz)
  const { data: existingAnswers, isLoading: isLoadingAnswers } = useQuery<UserAnswer[]>({
    queryKey: [`/api/attempts/${attemptId}/answers`],
    enabled: !!attemptId,
    onSuccess: (data) => {
      // Initialize answered questions and user answers
      const answered = new Set<number>();
      const answers = new Map<number, UserAnswer>();
      
      data.forEach(answer => {
        const questionId = answer.questionId;
        answered.add(questionId);
        answers.set(questionId, answer);
      });
      
      setAnsweredQuestions(answered);
      setUserAnswers(answers);
      
      // Set current question to first unanswered question
      if (questions && questions.length > 0) {
        const firstUnansweredIndex = questions.findIndex(q => !answered.has(q.id));
        if (firstUnansweredIndex !== -1) {
          setCurrentQuestionIndex(firstUnansweredIndex);
        }
      }
    }
  });

  // Timer effect
  useEffect(() => {
    if (!quizStarted || quizCompleted) return;
    
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [quizStarted, quizCompleted]);

  // Start quiz when data is loaded
  useEffect(() => {
    if (
      questions && 
      questions.length > 0 && 
      attempt && 
      !attempt.completed && 
      !quizStarted
    ) {
      setQuizStarted(true);
    }
  }, [questions, attempt, quizStarted]);

  // Check if quiz is completed
  useEffect(() => {
    if (
      questions && 
      answeredQuestions.size >= questions.length && 
      quizStarted && 
      !quizCompleted && 
      !isSubmitting
    ) {
      completeQuiz();
    }
  }, [questions, answeredQuestions, quizStarted, quizCompleted, isSubmitting]);

  // Handle answer selection
  const handleAnswerSelected = async (option: string) => {
    if (!questions || !attempt) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    const isCorrect = option === currentQuestion.correctAnswer;
    
    try {
      const answerData: InsertUserAnswer = {
        attemptId: parseInt(attemptId!),
        questionId: currentQuestion.id,
        selectedOption: option,
        isCorrect,
        isLeft: false,
        answerTimeSeconds: timer,
        knowledgeFlag: null,
        techniqueFlag: null,
        guessworkFlag: null,
        confidenceLevel: null,
      };
      
      const response = await apiRequest("POST", "/api/answers", answerData);
      const userAnswer = await response.json();
      
      // Update local state
      setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]));
      setUserAnswers(prev => new Map(prev).set(currentQuestion.id, userAnswer));
      
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle skipping a question
  const handleSkip = () => {
    if (!questions) return;
    
    // Move current question to the end of the queue
    setCurrentQuestionIndex(prevIndex => {
      const nextIndex = (prevIndex + 1) % questions.length;
      
      // If we've gone through all questions, stay on the current one
      if (answeredQuestions.size === questions.length - 1) {
        return prevIndex;
      }
      
      // Skip already answered questions
      if (questions[nextIndex] && answeredQuestions.has(questions[nextIndex].id)) {
        return (nextIndex + 1) % questions.length;
      }
      
      return nextIndex;
    });
  };

  // Handle leaving a question
  const handleLeave = async () => {
    if (!questions || !attempt) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    try {
      const answerData: InsertUserAnswer = {
        attemptId: parseInt(attemptId!),
        questionId: currentQuestion.id,
        selectedOption: null,
        isCorrect: false,
        isLeft: true,
        answerTimeSeconds: timer,
        knowledgeFlag: null,
        techniqueFlag: null,
        guessworkFlag: null,
        confidenceLevel: null,
      };
      
      const response = await apiRequest("POST", "/api/answers", answerData);
      const userAnswer = await response.json();
      
      // Update local state
      setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]));
      setUserAnswers(prev => new Map(prev).set(currentQuestion.id, userAnswer));
      
    } catch (error) {
      console.error("Error marking question as left:", error);
      toast({
        title: "Error",
        description: "Failed to mark question as left. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (!questions) return;
    
    setCurrentQuestionIndex(prevIndex => {
      // Find the next unanswered question
      let nextIndex = (prevIndex + 1) % questions.length;
      let loopCount = 0;
      
      while (
        answeredQuestions.has(questions[nextIndex].id) && 
        loopCount < questions.length
      ) {
        nextIndex = (nextIndex + 1) % questions.length;
        loopCount++;
      }
      
      // If all questions are answered, stay on the current one
      if (loopCount >= questions.length) {
        return prevIndex;
      }
      
      return nextIndex;
    });
  };

  // Complete quiz
  const completeQuiz = async () => {
    if (!attempt || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Update attempt as completed
      await apiRequest("PATCH", `/api/attempts/${attemptId}`, {
        endTime: new Date().toISOString(),
        totalTimeSeconds: timer,
        completed: true,
      });
      
      setQuizCompleted(true);
      
      // Navigate to analytics page
      navigate(`/test-analytics/${attemptId}`);
    } catch (error) {
      console.error("Error completing quiz:", error);
      toast({
        title: "Error",
        description: "Failed to complete quiz. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    updateSettings({ theme: newTheme as "light" | "dark" });
  };

  // Open settings panel
  const openSettings = () => {
    updateUIState({ settingsPanelOpen: true });
  };
  
  // Handle end quiz button click
  const handleEndQuizClick = () => {
    setShowEndQuizDialog(true);
  };
  
  // Handle end quiz confirmation
  const handleEndQuizConfirm = () => {
    completeQuiz();
    setShowEndQuizDialog(false);
  };

  if (isLoadingAttempt || isLoadingQuestions || isLoadingAnswers) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Logo />
          <div className="text-muted-foreground">Loading quiz...</div>
        </div>
      </div>
    );
  }

  if (!attempt || !questions) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Logo />
          <div className="text-red-500">Quiz not found</div>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentUserAnswer = currentQuestion ? userAnswers.get(currentQuestion.id) : undefined;
  const questionCount = questions.length;
  const answeredCount = answeredQuestions.size;
  const progressPercentage = (answeredCount / questionCount) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-30 backdrop-blur bg-opacity-90 dark:bg-opacity-90">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          {/* Logo */}
          <Logo />
          
          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2" />
              <span>{formatTime(timer)}</span>
            </div>
            
            {/* Dark Mode Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleDarkMode}
            >
              {settings.theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
            
            {/* Settings Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={openSettings}
            >
              <Cog className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Quiz Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Quiz Info */}
            <div>
              <h2 className="text-2xl font-semibold">
                {attempt.testId} - Attempt {attempt.attemptNumber}
              </h2>
            </div>
            
            {/* Progress and End Quiz Button */}
            <div className="flex flex-col items-end gap-2">
              <div className="sm:text-right">
                <p className="text-sm font-medium mb-1">
                  {answeredCount} / {questionCount} Questions
                </p>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleEndQuizClick}
                disabled={isSubmitting}
              >
                <LogOut className="h-4 w-4" />
                End Quiz
              </Button>
            </div>
          </div>
          
          {/* Question Card */}
          <AnimatePresence mode="wait">
            {currentQuestion && !currentUserAnswer && (
              <motion.div
                key={`question-${currentQuestion.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <QuizCard
                  question={currentQuestion}
                  onAnswerSelected={handleAnswerSelected}
                  onSkip={handleSkip}
                  onLeave={handleLeave}
                  timer={timer}
                  questionNumber={currentQuestion.questionNumber}
                  totalQuestions={questionCount}
                />
              </motion.div>
            )}
            
            {currentQuestion && currentUserAnswer && (
              <motion.div
                key={`answer-${currentQuestion.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AnsweredQuestionCard
                  question={currentQuestion}
                  userAnswer={currentUserAnswer}
                  onNext={handleNextQuestion}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* End Quiz Confirmation Dialog */}
      <AlertDialog open={showEndQuizDialog} onOpenChange={setShowEndQuizDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this quiz? You have answered {answeredCount} out of {questionCount} questions.
              {answeredCount < questionCount && (
                <p className="mt-2 text-destructive font-medium">
                  Warning: You still have {questionCount - answeredCount} unanswered questions.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndQuizConfirm}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? "Submitting..." : "End Quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
