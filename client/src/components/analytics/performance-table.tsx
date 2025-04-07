import { useState } from "react";
import { SubjectStats } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { formatPercentage, formatTime, getConfidenceEmoji, getYesNoEmoji } from "@/lib/utils";

interface PerformanceTableProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
  editable?: boolean;
  onStatsChange?: (stats: SubjectStats[]) => void;
}

export function PerformanceTable({ 
  overallStats, 
  subjectStats, 
  editable = false,
  onStatsChange 
}: PerformanceTableProps) {
  const [editedStats, setEditedStats] = useState<SubjectStats[]>(subjectStats);
  const [isEditing, setIsEditing] = useState(false);

  const handleStatChange = (subjectIndex: number, field: keyof SubjectStats, value: number) => {
    if (!editable || !onStatsChange) return;

    const newStats = [...editedStats];
    const subjectToUpdate = { ...newStats[subjectIndex] };

    // Update the requested field
    subjectToUpdate[field] = value;

    // Recalculate dependent fields
    if (['correct', 'incorrect', 'left'].includes(field)) {
      // Update attempts
      subjectToUpdate.attempts = subjectToUpdate.correct + subjectToUpdate.incorrect + subjectToUpdate.left;
      
      // Update accuracy
      const total = subjectToUpdate.correct + subjectToUpdate.incorrect;
      subjectToUpdate.accuracy = total > 0 ? (subjectToUpdate.correct / total) * 100 : 0;
      
      // Update score (2 points per correct, -0.66 per incorrect)
      subjectToUpdate.score = subjectToUpdate.correct * 2 - subjectToUpdate.incorrect * 0.66;
    }

    newStats[subjectIndex] = subjectToUpdate;
    setEditedStats(newStats);
    setIsEditing(true);
  };

  const handleSaveEdits = () => {
    if (onStatsChange) {
      onStatsChange(editedStats);
    }
    setIsEditing(false);
  };

  const handleCancelEdits = () => {
    setEditedStats(subjectStats);
    setIsEditing(false);
  };

  // Combine subject stats with overall stats
  const allStats = [...editedStats, overallStats];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-card rounded-xl shadow-card dark:shadow-none p-4 mb-8 overflow-x-auto"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Detailed Performance</h3>
        {editable && (
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={handleCancelEdits}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdits}>
                  Save Edits
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" className="text-xs">
                <RotateCcwIcon className="h-3 w-3 mr-1" /> Edit Counts
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Correct</TableHead>
              <TableHead>Incorrect</TableHead>
              <TableHead>Left</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Accuracy</TableHead>
              <TableHead>Avg Time</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Knowledge</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStats.map((stat, index) => {
              const isOverall = index === allStats.length - 1;
              
              return (
                <TableRow 
                  key={stat.subject} 
                  className={isOverall ? "font-medium" : undefined}
                >
                  <TableCell>{stat.subject}</TableCell>
                  <TableCell>{stat.attempts}</TableCell>
                  <TableCell className="text-green-600 dark:text-green-400">
                    {editable && !isOverall ? (
                      <Input 
                        type="number" 
                        value={stat.correct} 
                        onChange={(e) => handleStatChange(index, 'correct', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center"
                      />
                    ) : (
                      stat.correct
                    )}
                  </TableCell>
                  <TableCell className="text-red-600 dark:text-red-400">
                    {editable && !isOverall ? (
                      <Input 
                        type="number" 
                        value={stat.incorrect} 
                        onChange={(e) => handleStatChange(index, 'incorrect', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center"
                      />
                    ) : (
                      stat.incorrect
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {editable && !isOverall ? (
                      <Input 
                        type="number" 
                        value={stat.left} 
                        onChange={(e) => handleStatChange(index, 'left', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center"
                      />
                    ) : (
                      stat.left
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{stat.score.toFixed(2)}</TableCell>
                  <TableCell>
                    {formatPercentage(stat.accuracy)}
                    {stat.personalBest > stat.accuracy && !isOverall && (
                      <span className="ml-1 text-xs text-amber-500 dark:text-amber-400">
                        (Best: {formatPercentage(stat.personalBest)})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatTime(stat.avgTimeSeconds)}</TableCell>
                  <TableCell>
                    {getConfidenceEmoji('high')}{Math.round((stat.confidenceHigh / stat.attempts) * 100)}%{' '}
                    {getConfidenceEmoji('mid')}{Math.round((stat.confidenceMid / stat.attempts) * 100)}%{' '}
                    {getConfidenceEmoji('low')}{Math.round((stat.confidenceLow / stat.attempts) * 100)}%
                  </TableCell>
                  <TableCell>
                    {getYesNoEmoji(true)}{Math.round((stat.knowledgeYes / stat.attempts) * 100)}%{' '}
                    {getYesNoEmoji(true)}{Math.round((stat.techniqueYes / stat.attempts) * 100)}%{' '}
                    {getYesNoEmoji(true)}{Math.round((stat.guessworkYes / stat.attempts) * 100)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
