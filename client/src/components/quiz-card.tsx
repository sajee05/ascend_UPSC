import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, SkipForwardIcon, XCircleIcon, ArrowRightIcon, TagIcon, Chrome } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionWithTags, InsertTag } from "@shared/schema";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getSubjectTags } from "@/lib/gemini";
import { useSettings } from "@/hooks/use-settings";

interface QuizCardProps {
  question: QuestionWithTags;
  onAnswerSelected: (option: string) => void;
  onSkip: () => void;
  onLeave: () => void;
  timer: number;
  questionNumber: number;
  totalQuestions: number;
}

export function QuizCard({
  question,
  onAnswerSelected,
  onSkip,
  onLeave,
  timer,
  questionNumber,
  totalQuestions,
}: QuizCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isAiTagging, setIsAiTagging] = useState(false);
  const queryClient = useQueryClient();
  const { settings } = useSettings();

  // Get AI tags when the question is loaded
  useEffect(() => {
    const fetchAiTags = async () => {
      if (!settings.aiEnabled || !settings.aiApiKey) return;
      
      // Check if question already has AI tags
      const hasAiTags = question.tags.some(tag => tag.isAIGenerated);
      if (hasAiTags) return;
      
      try {
        setIsAiTagging(true);
        const options = [question.optionA, question.optionB, question.optionC, question.optionD];
        const aiTags = await getSubjectTags(
          question.questionText,
          options,
          settings.aiApiKey,
          settings.aiModel,
          settings.subjectTaggingPrompt
        );
        
        if (aiTags.length > 0) {
          const tagsData: InsertTag[] = aiTags.map(tagName => ({
            questionId: question.id,
            tagName,
            isAIGenerated: true,
          }));
          
          await apiRequest("POST", "/api/tags", tagsData);
          
          // Refresh question data
          queryClient.invalidateQueries({ queryKey: [`/api/tests/${question.testId}/questions`] });
        }
      } catch (error) {
        console.error("Error getting AI tags:", error);
      } finally {
        setIsAiTagging(false);
      }
    };
    
    fetchAiTags();
  }, [question, settings, queryClient]);

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return; // Prevent multiple selections
    setSelectedOption(option);
    onAnswerSelected(option);
  };

  const handleTagAdd = async () => {
    if (!newTag.trim()) return;
    
    try {
      const tagData: InsertTag = {
        questionId: question.id,
        tagName: newTag.trim(),
        isAIGenerated: false,
      };
      
      await apiRequest("POST", "/api/tags", [tagData]);
      
      // Refresh question data
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${question.testId}/questions`] });
      
      setNewTag("");
      setTagDialogOpen(false);
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const handleTagDelete = async (tagId: number) => {
    try {
      await apiRequest("DELETE", `/api/tags/${tagId}`, undefined);
      
      // Refresh question data
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${question.testId}/questions`] });
    } catch (error) {
      console.error("Error deleting tag:", error);
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
    <>
      <Card className="mb-6 shadow-lg">
        <CardContent className="p-6">
          {/* Question Text */}
          <div className="mb-6">
            <div className="font-semibold text-sm text-muted-foreground mb-2">
              Q{questionNumber})
            </div>
            <div className="text-lg space-y-2">
              {formattedQuestionText}
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap mt-4 gap-2">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => handleTagDelete(tag.id)}
                  >
                    <XCircleIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              
              {isAiTagging && (
                <Badge variant="outline" className="animate-pulse">
                  <Chrome className="h-3 w-3 mr-1" />
                  Analyzing...
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => setTagDialogOpen(true)}
              >
                <PencilIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Options */}
          <div className="space-y-3 mb-6">
            <AnimatePresence>
              {["A", "B", "C", "D"].map((option, index) => (
                <motion.div
                  key={option}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left h-auto py-3 px-4 overflow-hidden",
                      selectedOption === option && "border-primary-500 ring-2 ring-primary/50"
                    )}
                    onClick={() => handleOptionSelect(option)}
                    disabled={!!selectedOption}
                  >
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
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={onSkip}>
                <SkipForwardIcon className="h-4 w-4 mr-2" />
                Skip
              </Button>
              <Button variant="outline" size="sm" onClick={onLeave}>
                <XCircleIcon className="h-4 w-4 mr-2" />
                Leave
              </Button>
            </div>
            
            <AnimatePresence>
              {selectedOption && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button size="sm">
                    Next Question
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
      
      {/* Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter tag name"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTagAdd()}
              />
              <Button onClick={handleTagAdd}>Add</Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => handleTagDelete(tag.id)}
                  >
                    <XCircleIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
