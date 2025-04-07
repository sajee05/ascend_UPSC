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
  });

  // Get attempts for a specific test if testId is provided
  const { data: testAttempts, isLoading: isLoadingTestAttempts } = useQuery({
    queryKey: ['/api/tests', testId, 'attempts'],
    enabled: !!testId,
  });

  // Get all questions (for browsing across tests)
  const { data: allQuestions, isLoading: isLoadingAllQuestions } = useQuery<QuestionWithTags[]>({
    queryKey: ['/api/questions'],
    enabled: !testId && activeTab === "all",
  });

  // Get all tags for filtering
  const { data: allTags, isLoading: isLoadingTags } = useQuery<string[]>({
    queryKey: ['/api/tags'],
  });

  // Filter questions by search and tags
  const filteredQuestions = useCallback(() => {
    const questions = testId ? (testQuestions || []) : (allQuestions || []);
    if (!questions.length) return [];

    let filtered = [...questions];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.questionText.toLowerCase().includes(term) || 
        q.optionA.toLowerCase().includes(term) || 
        q.optionB.toLowerCase().includes(term) || 
        q.optionC.toLowerCase().includes(term) || 
        q.optionD.toLowerCase().includes(term)
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(q => {
        if (!q.tags || !q.tags.length) return false;
        return selectedTags.some(tag => q.tags.some(t => t.tagName === tag));
      });
    }

    // Filter by attempted status if requested
    if (showAttemptedOnly && testAttempts && testAttempts.length > 0) {
      const attemptedQuestionIds = new Set<number>();
      // Logic to get IDs of all attempted questions
      // This would require additional API data

      filtered = filtered.filter(q => attemptedQuestionIds.has(q.id));
    }

    return filtered;
  }, [testQuestions, allQuestions, searchTerm, selectedTags, testId, showAttemptedOnly, testAttempts]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Render loading state
  if (testId && (isLoadingTestQuestions || isLoadingTestAttempts)) {
    return <LoadingState />;
  }

  if (!testId && isLoadingTests && isLoadingAllQuestions) {
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
  if (!questions || questions.length === 0) {
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
  
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <QuestionCard question={question} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function QuestionCard({ question }: { question: QuestionWithTags }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="font-semibold text-sm text-muted-foreground mb-2">
          Q{question.questionNumber})
        </div>
        <div className="line-clamp-3 mb-2 text-sm">{question.questionText}</div>
        
        <div className="flex flex-wrap mt-2 gap-2">
          {question.tags && [...question.tags].sort((a, b) => a.tagName.localeCompare(b.tagName)).map(tag => (
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
          ))}
        </div>
        
        <div className="mt-4 flex justify-end">
          <Link to={`/tests/${question.testId}/questions/${question.id}`}>
            <Button size="sm" variant="outline">
              View Question
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function TestCard({ test }: { test: TestWithStats }) {
  const formattedDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <Link to={`/tests/${test.id}/questions`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">{test.filename}</h3>
          <div className="flex items-center text-xs text-muted-foreground">
            <ClockIcon className="h-3 w-3 mr-1" />
            <span>{formattedDate(test.uploadedAt ? test.uploadedAt.toString() : null)}</span>
          </div>
          
          {test.attempts !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between items-center text-xs mb-1">
                <span>Attempts</span>
                <span className="font-medium">{test.attempts}</span>
              </div>
              <Progress value={Math.min(test.attempts * 10, 100)} className="h-1" />
            </div>
          )}
          
          {test.bestScore !== undefined && test.bestScore !== null && (
            <div className="mt-3 flex items-center text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              <span>Best Score: {test.bestScore}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
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