import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BasicAnalyticsTable } from "@/components/analytics/BasicAnalyticsTable";
import { TestAnalytics } from "@shared/schema";
import { useUIState } from "@/hooks/use-ui-state";
import { apiRequest } from "@/lib/queryClient";
import { downloadCSV, generateFileName } from "@/lib/utils"; // Import utils
import { Download, Filter, Maximize2, Minimize2 } from 'lucide-react'; // Added expand/collapse icons
import { format } from 'date-fns';
import { TagAnalytics, calculateTagAnalytics } from '../analytics/analyticsHelpers'; // Corrected import path

// Define the structure of the history data expected from the API
// Assuming the API returns full TestAnalytics for each historical attempt
type HistoryData = TestAnalytics[];

// Helper function to escape values for CSV
const escapeCsvValue = (value: any): string => {
  const stringValue = String(value ?? ''); // Ensure value is a string, handle null/undefined
  // If value contains comma, newline, or double quote, wrap in double quotes
  if (/[",\n]/.test(stringValue)) {
    // Escape existing double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};


// Function to generate and download the history CSV
const generateHistoryCSV = (data: TestAnalytics[], filter: string) => {
  if (!data || data.length === 0) {
    alert("No data to export.");
    return;
  }

  const csvRows: string[] = [];

  // Define headers
  const testInfoHeaders = ["Test Name", "Date Completed", "Time Taken (s)"];
  const analyticsHeaders = [
    "Tag", "Attempted", "Correct", "Incorrect", "Left",
    "Knowledge - Yes", "Knowledge - No",
    "Educated Guess - Yes", "Educated Guess - No",
    "Guess - Yes", "Guess - No",
    "Confidence - High", "Confidence - Mid", "Confidence - Low",
    "Accuracy (%)"
  ];

  data
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Ensure order
    .forEach((attempt, index) => {
      if (index > 0) {
        csvRows.push(""); // Add separator row between tests
      }

      // --- Test Info ---
      csvRows.push(testInfoHeaders.map(escapeCsvValue).join(','));
      const testInfoRow = [
        attempt.title,
        format(new Date(attempt.date), 'yyyy-MM-dd HH:mm:ss'), // Consistent date format
        attempt.totalTimeSeconds ?? 'N/A'
      ];
      csvRows.push(testInfoRow.map(escapeCsvValue).join(','));
      csvRows.push(""); // Separator

      // --- Basic Analytics Table ---
      if (attempt.attemptQuestionStats && attempt.attemptQuestionStats.length > 0) {
         csvRows.push(analyticsHeaders.map(escapeCsvValue).join(','));

         // Recalculate analytics for this attempt (or use pre-calculated if available)
         // NOTE: This assumes calculateTagAnalytics is available and works correctly
         // It might be better if TestAnalytics included the calculated TagAnalytics directly
         const tagAnalytics = calculateTagAnalytics(attempt.attemptQuestionStats);
         const totals = tagAnalytics.reduce((acc, curr) => {
             acc.attempted += curr.attempted;
             acc.correct += curr.correct;
             acc.incorrect += curr.incorrect;
             acc.left += curr.left;
             acc.knowledgeYes += curr.knowledgeYes;
             acc.knowledgeNo += curr.knowledgeNo;
             acc.educatedGuessYes += curr.educatedGuessYes;
             acc.educatedGuessNo += curr.educatedGuessNo;
             acc.guessYes += curr.guessYes;
             acc.guessNo += curr.guessNo;
             acc.confidenceHigh += curr.confidenceHigh;
             acc.confidenceMid += curr.confidenceMid;
             acc.confidenceLow += curr.confidenceLow;
             return acc;
           }, {
             tag: 'Total', attempted: 0, correct: 0, incorrect: 0, left: 0,
             knowledgeYes: 0, knowledgeNo: 0, educatedGuessYes: 0, educatedGuessNo: 0,
             guessYes: 0, guessNo: 0, confidenceHigh: 0, confidenceMid: 0, confidenceLow: 0,
             accuracy: 0,
           });
         totals.accuracy = totals.attempted > 0 ? (totals.correct / totals.attempted) * 100 : 0;


         // Add tag rows
         tagAnalytics.forEach(stats => {
           const row = [
             stats.tag, stats.attempted, stats.correct, stats.incorrect, stats.left,
             stats.knowledgeYes, stats.knowledgeNo,
             stats.educatedGuessYes, stats.educatedGuessNo,
             stats.guessYes, stats.guessNo,
             stats.confidenceHigh, stats.confidenceMid, stats.confidenceLow,
             stats.accuracy.toFixed(1) // Format accuracy
           ];
           csvRows.push(row.map(escapeCsvValue).join(','));
         });

         // Add total row
         const totalRow = [
           totals.tag, totals.attempted, totals.correct, totals.incorrect, totals.left,
           totals.knowledgeYes, totals.knowledgeNo,
           totals.educatedGuessYes, totals.educatedGuessNo,
           totals.guessYes, totals.guessNo,
           totals.confidenceHigh, totals.confidenceMid, totals.confidenceLow,
           totals.accuracy.toFixed(1) // Format accuracy
         ];
         csvRows.push(totalRow.map(escapeCsvValue).join(','));

      } else {
        csvRows.push("Basic analytics data not available for this attempt.");
      }
  });

  const csvString = csvRows.join('\n');
  const filename = generateFileName(`ascend_upsc_history_${filter.replace(/\s+/g, '_')}`, 'csv');
  downloadCSV(csvString, filename);
};

export function HistoryModal() {
  const { uiState, updateUIState } = useUIState();
  const [activeFilter, setActiveFilter] = useState<string>("all time"); // Default filter
  const [isExpanded, setIsExpanded] = useState(false); // State for modal expansion

  // Fetch history data
  const { data: historyData, isLoading, error } = useQuery<HistoryData>({
    queryKey: ['/api/history', activeFilter], // Re-fetch when filter changes
    queryFn: async () => {
      // TODO: Adjust API endpoint to accept filter parameter if needed
      const response = await apiRequest("GET", `/api/history?filter=${activeFilter}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: uiState.historyModalOpen, // Only fetch when modal is open
  });

  const handleClose = () => {
    updateUIState({ historyModalOpen: false });
  };

  // Filter options
  const filterOptions = ["2 days", "3 days", "Week", "Month", "3 months", "all time"];

  // TODO: Implement actual filtering logic based on dates if API doesn't handle it
  const filteredData = historyData || []; // Use fetched data directly for now

  return (
    <Dialog open={uiState.historyModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={`
        ${isExpanded
          ? "w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh]"
          : "max-w-4xl h-[80vh]"}
        flex flex-col transition-all duration-300 ease-in-out
      `}>
        <DialogHeader>
          <DialogTitle>History</DialogTitle>
          <DialogDescription>
            Review analytics from your past test attempts. Filter by date range.
          </DialogDescription>
        </DialogHeader>

        {/* Filter and Export Controls */}
        <div className="flex justify-between items-center mb-4 px-6 pt-4 border-t">
          <div className="flex items-center gap-2 flex-wrap"> {/* Added flex-wrap for smaller screens */}
             <Filter className="h-4 w-4 text-muted-foreground" />
             <span className="text-sm font-medium mr-2">Filter:</span>
             {filterOptions.map(option => (
               <Button
                 key={option}
                 variant={activeFilter === option ? "default" : "outline"}
                 size="sm"
                 onClick={() => setActiveFilter(option)}
               >
                 {option}
               </Button>
             ))}
          </div>
          <div className="flex items-center gap-2"> {/* Group for export and expand buttons */}
            <Button
              variant="outline"
              size="sm"
            onClick={() => generateHistoryCSV(filteredData, activeFilter)} // Use the new function
            disabled={!filteredData || filteredData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-9 w-9"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'}</span>
          </Button>
          </div>
        </div>

        {/* History Content Area */}
        <ScrollArea className={`flex-grow px-6 pb-6 ${isExpanded ? 'h-[calc(95vh-230px)]' : 'h-[calc(80vh-230px)]'}`}> {/* Adjusted height */}
          {isLoading && <p className="text-center text-muted-foreground">Loading history...</p>}
          {error && <p className="text-center text-red-500">Error loading history: {(error as Error).message}</p>}
          {!isLoading && !error && filteredData.length === 0 && (
            <p className="text-center text-muted-foreground">No test history found for the selected filter.</p>
          )}
          {!isLoading && !error && filteredData.length > 0 && (
            <div className="space-y-4">
              {filteredData
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Ensure reverse chronological order
                .map((attempt) => (
                <Card key={attempt.attemptId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{attempt.title}</CardTitle>
                    <CardDescription>
                      Completed: {format(new Date(attempt.date), 'PPP p')} {/* Format date */}
                      {attempt.totalTimeSeconds && ` | Time Taken: ${Math.floor(attempt.totalTimeSeconds / 60)}m ${attempt.totalTimeSeconds % 60}s`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Embed the Basic Analytics Table */}
                    {attempt.attemptQuestionStats && attempt.attemptQuestionStats.length > 0 ? (
                       <BasicAnalyticsTable analytics={attempt} />
                    ) : (
                      <p className="text-sm text-muted-foreground">Basic analytics data not available for this attempt.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
         <DialogFooter className="px-6 pb-4 border-t pt-4">
           <Button variant="outline" onClick={handleClose}>Close</Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}