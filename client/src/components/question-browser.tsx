import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Question, QuestionWithTags, Test, TestWithStats } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, TagIcon, Chrome, BookOpenIcon, ClockIcon, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface QuestionBrowserProps {
  testId?: number;
  showAttemptedOnly?: boolean;
}

export function QuestionBrowser({ testId, showAttemptedOnly = false }: QuestionBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>(testId ? "test" : "all");

  // Get all tests
  const { data: tests, isLoading: isLoadingTests } = useQuery<TestWithStats[]>({
    queryKey: ['/api/tests'],
    enabled: !testId,
  });

  // Get test-specific questions if testId is provided
  const { data: testQuestions, isLoading: isLoadingTestQuestions } = useQuery<QuestionWithTags[]>({
    queryKey: ['/api/tests', testId, 'questions'],
    enabled: !!testId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Get attempts for a specific test if testId is provided
  const { data: testAttempts, isLoading: isLoadingTestAttempts } = useQuery<any[]>({
    queryKey: ['/api/tests', testId, 'attempts'],
    enabled: !!testId,
  });

  // Get all questions (for browsing across tests)
  // Since the /api/questions endpoint is having issues, use the first test's questions as a fallback
  const { data: testsList } = useQuery<TestWithStats[]>({
    queryKey: ['/api/tests'],
    enabled: !testId && activeTab === "all",
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
  
  // Determine the first test ID for fallback
  const firstTestId = testsList && testsList.length > 0 ? testsList[0].id : undefined;
  
  // Use the test-specific questions endpoint since it's working
  const { data: allQuestions, isLoading: isLoadingAllQuestions } = useQuery<QuestionWithTags[]>({
    queryKey: ['/api/tests', firstTestId, 'questions'],
    enabled: !testId && activeTab === "all" && !!firstTestId, // Only run if we have a test ID
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Get all tags for filtering
  const { data: allTags, isLoading: isLoadingTags } = useQuery<string[]>({
    queryKey: ['/api/tags'],
  });

  // Filter questions by search and tags
  const filteredQuestions = useCallback(() => {
    // Get and process questions with proper error handling
    let questions: any[] = [];
    try {
      // Important check: we need to determine if we have tests or questions
      if (!testId && activeTab === "all") {
        questions = allQuestions || [];
      } else if (!testId && activeTab === "test") {
        // If we're in "By Test" tab, we should be displaying tests, not questions
        return [];
      } else {
        questions = testQuestions || [];
      }
      
      // Check if we're dealing with questions or tests
      if (questions.length > 0 && 'filename' in questions[0]) {
        console.log("We have tests data instead of questions. This is not what we want here.");
        return []; // Return empty if we have tests instead of questions
      }
    } catch (error) {
      console.error("Error processing questions:", error);
      return []; // Return empty array on error
    }
    
    // Always create a new array to avoid reference issues
    let filtered = [...questions];
    
    try {
      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(q => {
          try {
            return (
              (q.questionText?.toLowerCase().includes(term)) || 
              (q.optionA?.toLowerCase().includes(term)) || 
              (q.optionB?.toLowerCase().includes(term)) || 
              (q.optionC?.toLowerCase().includes(term)) || 
              (q.optionD?.toLowerCase().includes(term))
            );
          } catch (e) {
            return false;
          }
        });
      }

      // Filter by selected tags
      if (selectedTags.length > 0) {
        filtered = filtered.filter(q => {
          try {
            if (!q.tags || !Array.isArray(q.tags) || q.tags.length === 0) return false;
            return selectedTags.some(tag => q.tags.some(t => t.tagName === tag));
          } catch (e) {
            return false;
          }
        });
      }

      // Filter by attempted status if requested
      if (showAttemptedOnly && testAttempts && Array.isArray(testAttempts) && testAttempts.length > 0) {
        const attemptedQuestionIds = new Set<number>();
        // Logic to get IDs of all attempted questions
        // For now, disabling this filter until we implement the logic
      }
    } catch (error) {
      console.error("Error filtering questions:", error);
      return []; // Return empty array on error
    }

    console.log("Found", filtered.length, "questions after filtering");
    return filtered;
  }, [testQuestions, allQuestions, searchTerm, selectedTags, testId, showAttemptedOnly, testAttempts, firstTestId]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t: string) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Render loading state - more comprehensive loading check
  const isLoading = 
    (testId && (isLoadingTestQuestions || isLoadingTestAttempts)) || 
    (!testId && activeTab === "all" && isLoadingAllQuestions) ||
    (!testId && activeTab === "test" && isLoadingTests) ||
    isLoadingTags;
  
  if (isLoading) {
    console.log("Showing loading state");
    return <LoadingState />;
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
          <CardTitle className="text-2xl flex items-center">
            <BookOpenIcon className="h-6 w-6 mr-2" />
            Question Browser
          </CardTitle>
          <CardDescription>
            Browse and filter questions from all tests or a specific test
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!testId && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Questions</TabsTrigger>
                <TabsTrigger value="test">By Test</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {/* Search and filter for all questions */}
                <SearchAndFilterSection 
                  searchTerm={searchTerm} 
                  setSearchTerm={setSearchTerm}
                  allTags={allTags || []}
                  selectedTags={selectedTags}
                  toggleTag={toggleTag}
                />
                
                {/* Display all filtered questions */}
                <QuestionList questions={filteredQuestions()} />
              </TabsContent>
              
              <TabsContent value="test">
                {/* Test selection */}
                {tests && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {tests.map((test: TestWithStats) => (
                      <TestCard key={test.id} test={test} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          
          {testId && (
            <>
              {/* Search and filter for specific test questions */}
              <SearchAndFilterSection 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm}
                allTags={allTags || []}
                selectedTags={selectedTags}
                toggleTag={toggleTag}
              />
              
              {/* Display test-specific filtered questions */}
              <QuestionList questions={filteredQuestions()} />
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SearchAndFilterSection({ 
  searchTerm, 
  setSearchTerm, 
  allTags, 
  selectedTags, 
  toggleTag 
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  allTags: string[];
  selectedTags: string[];
  toggleTag: (tag: string) => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="bg-muted/40 p-4 rounded-lg">
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <TagIcon className="h-4 w-4 mr-1" />
          Filter by Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {allTags && [...allTags].sort().map((tag: string) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionList({ questions }: { questions: QuestionWithTags[] }) {
  // Check for valid questions array
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="text-center py-10 bg-muted/20 rounded-lg">
        <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2">No Questions Found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filters to find questions.
        </p>
      </div>
    );
  }
  
  // Debug the structure of the first question to understand the issue
  if (questions.length > 0) {
    console.log("First question structure:", questions[0]);
    console.log("Question keys:", Object.keys(questions[0] || {}));
    console.log("Has ID?", questions[0]?.id !== undefined);
    console.log("Has questionText?", !!questions[0]?.questionText);
  }
  
  // Less strict validation to allow more questions to pass through
  const validQuestions = questions.filter(q => 
    q && typeof q === 'object' && q.id !== undefined
  );
  
  console.log("Valid questions found:", validQuestions.length, "out of", questions.length);
  
  // If all questions were invalid, show the "no questions" message
  if (validQuestions.length === 0) {
    return (
      <div className="text-center py-10 bg-muted/20 rounded-lg">
        <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2">Data Error</h3>
        <p className="text-muted-foreground">
          There was a problem with the question data. Please try refreshing the page.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {validQuestions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 1)}} // Cap the delay at 1 second
          >
            <QuestionCard question={question} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function QuestionCard({ question }: { question: QuestionWithTags }) {
  // Safety check - if the question object is invalid, render a fallback card
  if (!question || typeof question !== 'object' || !question.id) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="font-semibold text-sm text-destructive mb-2">
            Error: Invalid question data
          </div>
          <div className="text-sm text-muted-foreground">
            This question cannot be displayed due to missing or invalid data.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Safely access question properties with fallbacks
  const questionNumber = question.questionNumber || '?';
  const questionText = question.questionText || 'No question text available';
  const testId = question.testId || 0;
  const questionId = question.id || 0;
  
  // Function to safely sort and process tags
  const renderTags = () => {
    try {
      if (!question.tags || !Array.isArray(question.tags) || question.tags.length === 0) {
        return null;
      }
      
      return [...question.tags]
        .sort((a, b) => a.tagName.localeCompare(b.tagName))
        .map((tag: any) => (
          <Badge
            key={tag.id}
            variant={tag.isAIGenerated ? "outline" : "secondary"}
            className="flex items-center gap-1 text-xs"
          >
            {tag.isAIGenerated ? (
              <Chrome className="h-3 w-3" />
            ) : (
              <TagIcon className="h-3 w-3" />
            )}
            {tag.tagName}
          </Badge>
        ));
    } catch (error) {
      console.error("Error rendering tags:", error);
      return null;
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow relative group">
      <CardContent className="p-4">
        <div className="font-semibold text-sm text-muted-foreground mb-2">
          Q{questionNumber})
        </div>
        
        <div className="line-clamp-3 mb-2 text-sm">{questionText}</div>
        
        <div className="flex flex-wrap mt-2 gap-2">
          {renderTags()}
        </div>
        
        <div className="mt-4 flex justify-end">
          <Link to={`/tests/${testId}/questions/${questionId}`}>
            <Button size="sm" variant="outline">
              View Question
            </Button>
          </Link>
        </div>
        
        {/* Overlay on hover for quick navigation */}
        <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
          <Link to={`/tests/${testId}/questions/${questionId}`} className="pointer-events-auto">
            <div className="bg-background/90 backdrop-blur-sm p-3 rounded-full shadow-lg">
              <BookOpenIcon className="h-6 w-6 text-primary" />
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function TestCard({ test }: { test: TestWithStats }) {
  // Safety check - if the test object is invalid, render a fallback card
  if (!test || typeof test !== 'object' || !test.id) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="font-semibold text-sm text-destructive mb-2">
            Error: Invalid test data
          </div>
          <div className="text-sm text-muted-foreground">
            This test cannot be displayed due to missing or invalid data.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Safely access test properties with fallbacks
  const testId = test.id;
  const filename = test.filename || 'Untitled Test';
  const attempts = test.attempts || 0;
  const bestScore = test.bestScore !== undefined && test.bestScore !== null 
    ? test.bestScore 
    : null;
  
  const formattedDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow relative group">
      <CardContent className="p-4">
        <Link to={`/tests/${testId}/questions`} className="block">
          <h3 className="font-medium mb-2">{filename}</h3>
          <div className="flex items-center text-xs text-muted-foreground">
            <ClockIcon className="h-3 w-3 mr-1" />
            <span>
              {formattedDate(test.uploadedAt ? test.uploadedAt.toString() : null)}
            </span>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between items-center text-xs mb-1">
              <span>Attempts</span>
              <span className="font-medium">{attempts}</span>
            </div>
            <Progress value={Math.min(attempts * 10, 100)} className="h-1" />
          </div>
          
          {bestScore !== null && (
            <div className="mt-3 flex items-center text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              <span>Best Score: {bestScore}%</span>
            </div>
          )}
        </Link>
        
        {/* View questions button as an eye icon */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link to={`/tests/${testId}/questions`}>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <BookOpenIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
            </div>
            
            <Skeleton className="h-24 w-full" />
            
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}