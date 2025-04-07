import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2Icon, XCircleIcon, ArrowRightIcon } from "lucide-react";
import { motion } from "framer-motion";
import { QuestionWithTags, UserAnswer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AnsweredQuestionCardProps {
  question: QuestionWithTags;
  userAnswer: UserAnswer;
  onNext: () => void;
}

export function AnsweredQuestionCard({ 
  question, 
  userAnswer, 
  onNext 
}: AnsweredQuestionCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [metaData, setMetaData] = useState({
    knowledgeFlag: userAnswer.knowledgeFlag || false,
    techniqueFlag: userAnswer.techniqueFlag || false,
    guessworkFlag: userAnswer.guessworkFlag || false,
    confidenceLevel: userAnswer.confidenceLevel || 'mid',
  });
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  // If all meta questions are answered, show the correct answer
  useEffect(() => {
    if (
      metaData.knowledgeFlag !== null &&
      metaData.techniqueFlag !== null &&
      metaData.guessworkFlag !== null &&
      metaData.confidenceLevel !== null
    ) {
      const timer = setTimeout(() => {
        setShowCorrectAnswer(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [metaData]);

  const updateUserAnswer = async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      await apiRequest("PATCH", `/api/answers/${userAnswer.id}`, metaData);
    } catch (error) {
      console.error("Error updating user answer:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMetaOptionSelect = (
    field: 'knowledgeFlag' | 'techniqueFlag' | 'guessworkFlag',
    value: boolean
  ) => {
    setMetaData(prev => ({ ...prev, [field]: value }));
    // We don't need to call updateUserAnswer here as it will be called when 
    // submitting the entire form at the end
  };

  const handleConfidenceSelect = (value: 'high' | 'mid' | 'low') => {
    setMetaData(prev => ({ ...prev, confidenceLevel: value }));
  };

  const handleNextQuestion = async () => {
    await updateUserAnswer();
    onNext();
  };

  // Format monospace text tables
  const formattedQuestionText = question.questionText.split('\n').map((line, i) => (
    <div key={i} className={line.includes('\t') || line.match(/\s{2,}/) ? "font-mono whitespace-pre" : ""}>
      {line}
    </div>
  ));

  return (
    <Card className="mb-6 shadow-lg">
      <CardContent className="p-6">
        {/* Question Text */}
        <div className="mb-4">
          <div className="font-semibold text-sm text-muted-foreground mb-2">
            Q{question.questionNumber})
          </div>
          <div className="text-lg space-y-2">
            {formattedQuestionText}
          </div>
        </div>
        
        {/* Options with Feedback */}
        <div className="space-y-3 mb-6">
          {["A", "B", "C", "D"].map((option) => {
            const isSelected = userAnswer.selectedOption === option;
            const isCorrect = question.correctAnswer === option;
            
            // Determine styling
            let optionClassName = "p-3 rounded-lg border";
            
            if (isSelected && isCorrect) {
              optionClassName = cn(optionClassName, "border-2 border-green-500 bg-green-50 dark:bg-green-900/20");
            } else if (isSelected && !isCorrect) {
              optionClassName = cn(optionClassName, "border-2 border-red-500 bg-red-50 dark:bg-red-900/20");
            } else if (!isSelected && isCorrect && showCorrectAnswer) {
              optionClassName = cn(optionClassName, "border-2 border-green-500 bg-green-50 dark:bg-green-900/20");
            } else {
              optionClassName = cn(optionClassName, "border-gray-200 dark:border-gray-700", 
                !isSelected && "opacity-75");
            }
            
            return (
              <div key={option} className={optionClassName}>
                <div className="flex items-start">
                  <span className="font-medium mr-2">{option})</span>
                  <span>
                    {option === "A"
                      ? question.optionA
                      : option === "B"
                      ? question.optionB
                      : option === "C"
                      ? question.optionC
                      : question.optionD}
                  </span>
                  
                  {isSelected && isCorrect && (
                    <CheckCircle2Icon className="h-5 w-5 text-green-500 ml-auto flex-shrink-0" />
                  )}
                  
                  {isSelected && !isCorrect && (
                    <XCircleIcon className="h-5 w-5 text-red-500 ml-auto flex-shrink-0" />
                  )}
                  
                  {!isSelected && isCorrect && showCorrectAnswer && (
                    <CheckCircle2Icon className="h-5 w-5 text-green-500 ml-auto flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Meta-Cognitive Questions */}
        <motion.div 
          className="mb-6 bg-muted rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="font-medium mb-3">Reflect on your answer:</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm mb-2">Did you know this from memory?</p>
              <div className="flex space-x-3">
                <Button
                  size="sm"
                  variant={metaData.knowledgeFlag ? "default" : "outline"}
                  onClick={() => handleMetaOptionSelect('knowledgeFlag', true)}
                >
                  Yes ✅
                </Button>
                <Button
                  size="sm"
                  variant={metaData.knowledgeFlag === false ? "destructive" : "outline"}
                  onClick={() => handleMetaOptionSelect('knowledgeFlag', false)}
                >
                  No ❌
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm mb-2">Did you use a technique/logic?</p>
              <div className="flex space-x-3">
                <Button
                  size="sm"
                  variant={metaData.techniqueFlag ? "default" : "outline"}
                  onClick={() => handleMetaOptionSelect('techniqueFlag', true)}
                >
                  Yes ✅
                </Button>
                <Button
                  size="sm"
                  variant={metaData.techniqueFlag === false ? "destructive" : "outline"}
                  onClick={() => handleMetaOptionSelect('techniqueFlag', false)}
                >
                  No ❌
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm mb-2">Was this a guess?</p>
              <div className="flex space-x-3">
                <Button
                  size="sm"
                  variant={metaData.guessworkFlag ? "destructive" : "outline"}
                  onClick={() => handleMetaOptionSelect('guessworkFlag', true)}
                >
                  Yes ✅
                </Button>
                <Button
                  size="sm"
                  variant={metaData.guessworkFlag === false ? "default" : "outline"}
                  onClick={() => handleMetaOptionSelect('guessworkFlag', false)}
                >
                  No ❌
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm mb-2">Your confidence level?</p>
              <div className="flex space-x-3">
                <Button
                  size="sm"
                  variant={metaData.confidenceLevel === 'high' ? "default" : "outline"}
                  onClick={() => handleConfidenceSelect('high')}
                >
                  High 🟢
                </Button>
                <Button
                  size="sm"
                  variant={metaData.confidenceLevel === 'mid' ? "warning" : "outline"}
                  onClick={() => handleConfidenceSelect('mid')}
                >
                  Mid 🟡
                </Button>
                <Button
                  size="sm"
                  variant={metaData.confidenceLevel === 'low' ? "destructive" : "outline"}
                  onClick={() => handleConfidenceSelect('low')}
                >
                  Low 🔴
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Correct Answer Reveal */}
        {showCorrectAnswer && (
          <motion.div
            className="mb-6 p-4 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
              Correct Answer: {question.correctAnswer}) {question.correctAnswerText}
            </h4>
          </motion.div>
        )}
        
        {/* Next Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleNextQuestion}
            disabled={
              metaData.knowledgeFlag === null ||
              metaData.techniqueFlag === null ||
              metaData.guessworkFlag === null ||
              metaData.confidenceLevel === null ||
              !showCorrectAnswer ||
              isUpdating
            }
          >
            Next Question
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
