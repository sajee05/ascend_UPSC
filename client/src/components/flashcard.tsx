import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Flashcard as FlashcardType, QuestionWithTags } from "@shared/schema";
import { TagIcon, Chrome } from "lucide-react";

interface FlashcardProps {
  flashcard: FlashcardType & { question: QuestionWithTags };
  onRate: (id: number, difficulty: "again" | "hard" | "good" | "easy") => void;
}

export function Flashcard({ flashcard, onRate }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { question } = flashcard;

  // Reset flip state when flashcard changes
  useEffect(() => {
    setIsFlipped(false);
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

  // Format monospace text tables
  const formattedQuestionText = question.questionText.split('\n').map((line, i) => (
    <div key={i} className={line.includes('\t') || line.match(/\s{2,}/) ? "font-mono whitespace-pre overflow-x-auto" : ""}>
      {line}
    </div>
  ));

  return (
    <div className="perspective-1000 max-w-3xl mx-auto my-8" ref={cardRef}>
      <motion.div 
        className="relative min-h-[400px] transform-style-preserve-3d transition-all duration-300"
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
              <div className="text-base">
                <p className="mb-2">
                  {question.correctAnswer === 'A' && question.optionA}
                  {question.correctAnswer === 'B' && question.optionB}
                  {question.correctAnswer === 'C' && question.optionC}
                  {question.correctAnswer === 'D' && question.optionD}
                </p>
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
  );
}
