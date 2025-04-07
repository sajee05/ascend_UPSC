import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2Icon, XCircleIcon, ArrowRightIcon, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { QuestionWithTags, UserAnswer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useSettings } from "@/hooks/use-settings";
import { getQuestionExplanation } from "@/lib/gemini";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

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
  const { settings } = useSettings();
  const [isUpdating, setIsUpdating] = useState(false);
  const [metaData, setMetaData] = useState({
    knowledgeFlag: userAnswer.knowledgeFlag || false,
    techniqueFlag: userAnswer.techniqueFlag || false,
    guessworkFlag: userAnswer.guessworkFlag || false,
    confidenceLevel: userAnswer.confidenceLevel || 'mid',
  });
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

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
  
  // Fetch explanation when correct answer is shown
  useEffect(() => {
    if (showCorrectAnswer && settings.aiEnabled && !explanation && !isLoadingExplanation) {
      fetchExplanation();
    }
  }, [showCorrectAnswer, settings.aiEnabled]);

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
  
  const fetchExplanation = async () => {
    if (!settings.aiEnabled || !settings.aiApiKey || isLoadingExplanation) return;
    
    try {
      setIsLoadingExplanation(true);
      
      const explanationText = await getQuestionExplanation(
        question,
        userAnswer,
        settings.aiApiKey,
        settings.aiModel || 'gemini-1.0-pro',
        settings.explanationPrompt || ''
      );
      
      setExplanation(explanationText);
    } catch (error) {
      console.error("Error fetching AI explanation:", error);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  // Process question text to render markdown tables properly
  const processQuestionText = () => {
    const lines = question.questionText.split('\n');
    const result = [];
    let inTable = false;
    let tableRows = [];
    let tableIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isTableRow = line.includes('|');
      
      // Start or continue collecting table rows
      if (isTableRow) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(line);
      } 
      // End of table detected
      else if (inTable) {
        // Render the collected table
        result.push(
          <div key={`table-${tableIndex}`} className="my-3 overflow-x-auto">
            <table className="border-collapse w-full">
              <tbody>
                {tableRows.map((tableRow, rowIdx) => {
                  const cells = tableRow.split('|').filter(cell => cell.trim() !== '');
                  
                  // Check if this is a header or separator row
                  const isHeaderRow = rowIdx === 0;
                  const isSeparatorRow = tableRow.includes('---') || tableRow.includes('===');
                  
                  if (isSeparatorRow) return null;
                  
                  return (
                    <tr key={`row-${rowIdx}`}>
                      {cells.map((cell, cellIdx) => {
                        const CellTag = isHeaderRow ? 'th' : 'td';
                        return (
                          <CellTag 
                            key={`cell-${cellIdx}`}
                            className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
                          >
                            {cell.trim()}
                          </CellTag>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        
        inTable = false;
        tableIndex++;
      } 
      // Regular text line
      else {
        // Handle regular text or other formatting
        const isTableLike = 
          line.includes('\t') || 
          line.match(/\s{2,}/) || 
          line.match(/\+[-+]+\+/) || // Detect ascii-style tables with + and - separators
          line.match(/^\s*[\-\+]{3,}/) || // Horizontal table separators
          line.match(/^\s*[a-z0-9]+\s{2,}/) || // Lines starting with text followed by multiple spaces
          line.match(/^\s*\d+[\.\)]\s+\S+\s{2,}\S+/); // Numbered lists with multiple spaces between items
        
        let className = isTableLike ? 
          "font-mono whitespace-pre text-xs md:text-sm overflow-x-auto max-w-full pb-1" : "";
        
        result.push(
          <div key={`line-${i}`} className={className}>
            {line}
          </div>
        );
      }
    }
    
    // Handle any remaining table at the end
    if (inTable && tableRows.length > 0) {
      result.push(
        <div key={`table-${tableIndex}`} className="my-3 overflow-x-auto">
          <table className="border-collapse w-full">
            <tbody>
              {tableRows.map((tableRow, rowIdx) => {
                const cells = tableRow.split('|').filter(cell => cell.trim() !== '');
                const isHeaderRow = rowIdx === 0;
                const isSeparatorRow = tableRow.includes('---') || tableRow.includes('===');
                
                if (isSeparatorRow) return null;
                
                return (
                  <tr key={`row-${rowIdx}`}>
                    {cells.map((cell, cellIdx) => {
                      const CellTag = isHeaderRow ? 'th' : 'td';
                      return (
                        <CellTag 
                          key={`cell-${cellIdx}`}
                          className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
                        >
                          {cell.trim()}
                        </CellTag>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    
    return result;
  };
  
  const formattedQuestionText = processQuestionText();

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
                  <span className="font-medium mr-2 flex-shrink-0">{option})</span>
                  <span className="break-words">
                    {(() => {
                      // Get option text
                      const optionText = option === "A"
                        ? question.optionA
                        : option === "B"
                        ? question.optionB
                        : option === "C"
                        ? question.optionC
                        : question.optionD;
                        
                      // Check if option text contains a table structure
                      if (optionText.includes('\t') || 
                          optionText.match(/\s{2,}/) || 
                          optionText.match(/\|\s*[^|]+\s*\|/) ||
                          optionText.match(/\+[-+]+\+/) ||
                          optionText.match(/^\s*[\-\+]{3,}/) ||
                          optionText.match(/^\s*[a-z0-9]+\s{2,}/) ||
                          optionText.match(/^\s*\d+[\.\)]\s+\S+\s{2,}\S+/)) {
                        // Return as pre-formatted text for tables
                        return (
                          <div className="font-mono whitespace-pre text-xs md:text-sm overflow-x-auto">
                            {optionText}
                          </div>
                        );
                      }
                      
                      // Return as normal text
                      return optionText;
                    })()}
                  </span>
                  
                  <div className="ml-auto flex-shrink-0">
                    {isSelected && isCorrect && (
                      <CheckCircle2Icon className="h-5 w-5 text-green-500" />
                    )}
                    
                    {isSelected && !isCorrect && (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                    
                    {!isSelected && isCorrect && showCorrectAnswer && (
                      <CheckCircle2Icon className="h-5 w-5 text-green-500" />
                    )}
                  </div>
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
                  className={metaData.knowledgeFlag ? "bg-green-500 hover:bg-green-600 text-white" : ""}
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
                  className={metaData.techniqueFlag ? "bg-green-500 hover:bg-green-600 text-white" : ""}
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
                  className={metaData.guessworkFlag ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : ""}
                  onClick={() => handleMetaOptionSelect('guessworkFlag', true)}
                >
                  Yes ✅
                </Button>
                <Button
                  size="sm"
                  variant={metaData.guessworkFlag === false ? "default" : "outline"}
                  className={metaData.guessworkFlag === false ? "bg-green-500 hover:bg-green-600 text-white" : ""}
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
                  variant="outline"
                  className={metaData.confidenceLevel === 'high' ? "border-green-500 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" : ""}
                  onClick={() => handleConfidenceSelect('high')}
                >
                  High 🟢
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={metaData.confidenceLevel === 'mid' ? "border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800" : ""}
                  onClick={() => handleConfidenceSelect('mid')}
                >
                  Mid 🟡
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={metaData.confidenceLevel === 'low' ? "border-red-500 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" : ""}
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
        
        {/* AI Explanation */}
        {showCorrectAnswer && settings.aiEnabled && (
          <motion.div
            className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium text-blue-700 dark:text-blue-300">
                AI Explanation
              </h4>
            </div>
            
            {isLoadingExplanation ? (
              <div className="flex justify-center py-4">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-2 bg-blue-200 dark:bg-blue-700 rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-blue-200 dark:bg-blue-700 rounded w-5/6 mb-2"></div>
                  <div className="h-2 bg-blue-200 dark:bg-blue-700 rounded w-2/3 mb-2"></div>
                  <div className="h-2 bg-blue-200 dark:bg-blue-700 rounded w-4/5"></div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Generating explanation...
                  </p>
                </div>
              </div>
            ) : explanation ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                  {explanation}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <p className="text-sm text-muted-foreground">
                  {!settings.aiApiKey ? (
                    "No API key provided. Add your API key in settings to enable AI explanations."
                  ) : (
                    "Failed to generate explanation. Try again by refreshing the page."
                  )}
                </p>
                <Button 
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={fetchExplanation}
                  disabled={!settings.aiApiKey || isLoadingExplanation}
                >
                  Try Again
                </Button>
              </div>
            )}
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
