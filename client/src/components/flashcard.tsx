import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Flashcard as FlashcardType, QuestionWithTags } from "@shared/schema";
import { TagIcon, Chrome, Info, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FlashcardProps {
  flashcard: FlashcardType & { question: QuestionWithTags };
  onRate: (id: number, difficulty: "again" | "hard" | "good" | "easy") => void;
}

export function Flashcard({ flashcard, onRate }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAiAnalysisOpen, setIsAiAnalysisOpen] = useState(false);
  const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { question } = flashcard;

  // Reset flip state when flashcard changes
  useEffect(() => {
    setIsFlipped(false);
    setSelectedOption(null);
  }, [flashcard.id]);

  const handleFlip = () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    setIsFlipped(!isFlipped);
    
    // Add a slight delay to allow animation to complete
    setTimeout(() => {
      setIsFlipping(false);
    }, 300);
  };

  const handleRate = (difficulty: "again" | "hard" | "good" | "easy") => {
    onRate(flashcard.id, difficulty);
  };

  const handleAiAnalysis = async (option: string) => {
    setSelectedOption(option);
    setIsAiAnalysisLoading(true);
    setIsAiAnalysisOpen(true);
    
    try {
      // Here you would make an API call to get AI analysis
      // For now, let's simulate it with a timeout
      const optionText = getOptionText(option);
      const isCorrect = option === question.correctAnswer;
      const prompt = `Analyze in detail why the answer option "${option}) ${optionText}" for the following question is ${isCorrect ? "correct" : "incorrect"}:
      
      Question: ${question.questionText}
      
      Options:
      A) ${question.optionA}
      B) ${question.optionB}
      C) ${question.optionC}
      D) ${question.optionD}
      
      Correct answer: ${question.correctAnswer}) ${question.correctAnswerText}
      
      Provide a thorough explanation of the concepts involved and why this specific option is ${isCorrect ? "the right choice" : "wrong"}.`;
      
      // Simulate API call with setTimeout for now
      // In a real implementation, you would call your AI service
      setTimeout(() => {
        // This is a placeholder. In the real implementation, you would get this from the API
        const analysis = isCorrect 
          ? `The option ${option}) ${optionText} is correct because:\n\n${question.correctAnswerText}\n\nThis aligns with the key concepts in this topic which involve...`
          : `The option ${option}) ${optionText} is incorrect. The right answer is ${question.correctAnswer}) ${question.correctAnswerText}.\n\nThis option is wrong because...`;
        
        setAiAnalysis(analysis);
        setIsAiAnalysisLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error getting AI analysis:", error);
      toast({
        title: "Error",
        description: "Failed to get AI analysis. Please try again.",
        variant: "destructive",
      });
      setIsAiAnalysisLoading(false);
    }
  };

  const getOptionText = (option: string): string => {
    switch (option) {
      case 'A': return question.optionA;
      case 'B': return question.optionB;
      case 'C': return question.optionC;
      case 'D': return question.optionD;
      default: return '';
    }
  };

  const getOptionClass = (option: string): string => {
    if (!isFlipped) return "border hover:border-primary/50";
    
    if (option === question.correctAnswer) {
      return "border-2 border-green-500 bg-green-50 dark:bg-green-950/20";
    }
    
    return "border hover:border-primary/50";
  };

  // Format monospace text tables
  const formattedQuestionText = question.questionText.split('\n').map((line, i) => (
    <div key={i} className={line.includes('\t') || line.match(/\s{2,}/) ? "font-mono whitespace-pre overflow-x-auto" : ""}>
      {line}
    </div>
  ));

  return (
    <>
      <div className="perspective-1000 max-w-3xl mx-auto my-8" ref={cardRef}>
        <motion.div 
          className="relative min-h-[450px] transform-style-preserve-3d transition-all duration-300"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Front of Card */}
          <Card 
            className={`absolute w-full h-full backface-hidden ${isFlipped ? 'pointer-events-none' : ''} cursor-pointer`}
            onClick={handleFlip}
          >
            <CardContent className="p-6 h-full flex flex-col">
              {/* Question Text */}
              <div className="flex-grow mb-6">
                <h3 className="text-lg font-medium mb-4">
                  Q{question.questionNumber}) 
                </h3>
                <div className="text-base space-y-2">
                  {formattedQuestionText}
                </div>
              </div>
              
              {/* Options */}
              <div className="space-y-2 mb-6">
                <div className="p-2.5 rounded-lg border">
                  a) {question.optionA}
                </div>
                <div className="p-2.5 rounded-lg border">
                  b) {question.optionB}
                </div>
                <div className="p-2.5 rounded-lg border">
                  c) {question.optionC}
                </div>
                <div className="p-2.5 rounded-lg border">
                  d) {question.optionD}
                </div>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {question.tags.map(tag => (
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
              
              {/* Flashcard Controls */}
              <div className="text-center text-sm text-muted-foreground">
                Click to see answer
              </div>
            </CardContent>
          </Card>

          {/* Back of Card */}
          <Card 
            className={`absolute w-full h-full backface-hidden rotate-y-180 ${!isFlipped ? 'pointer-events-none' : ''}`}
          >
            <CardContent className="p-6 h-full flex flex-col">
              {/* Answer */}
              <div className="flex-grow mb-6">
                <h3 className="text-lg font-medium mb-4 text-green-600 dark:text-green-400">
                  Answer: {question.correctAnswer}) {question.correctAnswerText}
                </h3>
                
                {/* Options with Analysis buttons */}
                <div className="space-y-3 mb-6">
                  <div className={`relative p-2.5 rounded-lg ${getOptionClass('A')} flex justify-between items-center`}>
                    <div>A) {question.optionA}</div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAiAnalysis('A');
                      }}
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Analyze
                    </Button>
                    {question.correctAnswer === 'A' && (
                      <CheckCircle2 className="absolute -left-2 -top-2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  
                  <div className={`relative p-2.5 rounded-lg ${getOptionClass('B')} flex justify-between items-center`}>
                    <div>B) {question.optionB}</div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAiAnalysis('B');
                      }}
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Analyze
                    </Button>
                    {question.correctAnswer === 'B' && (
                      <CheckCircle2 className="absolute -left-2 -top-2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  
                  <div className={`relative p-2.5 rounded-lg ${getOptionClass('C')} flex justify-between items-center`}>
                    <div>C) {question.optionC}</div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAiAnalysis('C');
                      }}
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Analyze
                    </Button>
                    {question.correctAnswer === 'C' && (
                      <CheckCircle2 className="absolute -left-2 -top-2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  
                  <div className={`relative p-2.5 rounded-lg ${getOptionClass('D')} flex justify-between items-center`}>
                    <div>D) {question.optionD}</div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAiAnalysis('D');
                      }}
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Analyze
                    </Button>
                    {question.correctAnswer === 'D' && (
                      <CheckCircle2 className="absolute -left-2 -top-2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Flashcard Rating Buttons */}
              <div>
                <p className="font-medium mb-3">How well did you know this?</p>
                <div className="grid grid-cols-4 gap-2">
                  <Button 
                    variant="outline" 
                    className="py-2 px-3 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                    onClick={() => handleRate("again")}
                  >
                    Again
                  </Button>
                  <Button 
                    variant="outline" 
                    className="py-2 px-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                    onClick={() => handleRate("hard")}
                  >
                    Hard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="py-2 px-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                    onClick={() => handleRate("good")}
                  >
                    Good
                  </Button>
                  <Button 
                    variant="outline" 
                    className="py-2 px-3 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                    onClick={() => handleRate("easy")}
                  >
                    Easy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* AI Analysis Dialog */}
      <Dialog open={isAiAnalysisOpen} onOpenChange={setIsAiAnalysisOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Analysis of Option {selectedOption}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {isAiAnalysisLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Generating analysis...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-3 rounded-md ${
                  selectedOption === question.correctAnswer 
                    ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800" 
                    : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                }`}>
                  <div className="flex items-start">
                    {selectedOption === question.correctAnswer ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">
                        {selectedOption === question.correctAnswer 
                          ? "Correct Answer" 
                          : "Incorrect Answer"}
                      </p>
                      <p className="text-sm">
                        {selectedOption}: {getOptionText(selectedOption || '')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Analysis</h4>
                  <div className="whitespace-pre-line text-sm">
                    {aiAnalysis}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsAiAnalysisOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
