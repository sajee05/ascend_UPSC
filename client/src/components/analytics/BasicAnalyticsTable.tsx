import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestAnalytics, AttemptQuestionStat } from "@shared/schema";
import { TagAnalytics, calculateTagAnalytics, formatAccuracy } from './analyticsHelpers'; // Import from helper

interface BasicAnalyticsTableProps {
  analytics: TestAnalytics;
}

// TagAnalytics and calculateTagAnalytics are now imported from ./analyticsHelpers

export const BasicAnalyticsTable: React.FC<BasicAnalyticsTableProps> = ({ analytics }) => {
  if (!analytics || !analytics.attemptQuestionStats || analytics.attemptQuestionStats.length === 0) {
    return (
      <Card className="mt-6 mb-6">
        <CardHeader>
          <CardTitle>Basic Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div>No detailed question data available for this attempt.</div>
        </CardContent>
      </Card>
    );
  }

  const tagAnalytics = calculateTagAnalytics(analytics.attemptQuestionStats);

  // Calculate Totals
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
    accuracy: 0, // Calculated separately
  });

  totals.accuracy = totals.attempted > 0 ? (totals.correct / totals.attempted) * 100 : 0;

  // formatAccuracy is now imported from ./analyticsHelpers

  return (
    <Card className="mt-6 mb-6">
      <CardHeader>
        <CardTitle>Basic Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Performance summary by question tag.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="align-bottom">Tags</TableHead>
              <TableHead rowSpan={2} className="align-bottom text-center">Attempted</TableHead>
              <TableHead rowSpan={2} className="align-bottom text-center">Correct</TableHead>
              <TableHead rowSpan={2} className="align-bottom text-center">Incorrect questions</TableHead>
              <TableHead rowSpan={2} className="align-bottom text-center">Left</TableHead>
              <TableHead colSpan={2} className="text-center border-l">Knowledge</TableHead>
              <TableHead colSpan={2} className="text-center border-l">Educated guesses</TableHead>
              <TableHead colSpan={2} className="text-center border-l">Tukkebaazi/Guess</TableHead>
              <TableHead colSpan={3} className="text-center border-l">Confidence Level?</TableHead>
              <TableHead rowSpan={2} className="align-bottom text-center border-l">Accuracy</TableHead>
            </TableRow>
            <TableRow>
              {/* Sub-headers */}
              <TableHead className="text-center border-l">Yes</TableHead>
              <TableHead className="text-center">NO</TableHead>
              <TableHead className="text-center border-l">Yes</TableHead>
              <TableHead className="text-center">NO</TableHead>
              <TableHead className="text-center border-l">Yes</TableHead>
              <TableHead className="text-center">NO</TableHead>
              <TableHead className="text-center border-l">High 🟢</TableHead>
              <TableHead className="text-center">Mid 🟡</TableHead>
              <TableHead className="text-center">Low 🔴</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tagAnalytics.map((stats) => (
              <TableRow key={stats.tag}>
                <TableCell className="font-medium">{stats.tag}</TableCell>
                <TableCell className="text-center">{stats.attempted}</TableCell>
                <TableCell className="text-center">{stats.correct}</TableCell>
                <TableCell className="text-center">{stats.incorrect}</TableCell>
                <TableCell className="text-center">{stats.left}</TableCell>
                {/* Knowledge */}
                <TableCell className="text-center border-l">{stats.knowledgeYes}</TableCell>
                <TableCell className="text-center">{stats.knowledgeNo}</TableCell>
                {/* Educated Guesses */}
                <TableCell className="text-center border-l">{stats.educatedGuessYes}</TableCell>
                <TableCell className="text-center">{stats.educatedGuessNo}</TableCell>
                {/* Guess */}
                <TableCell className="text-center border-l">{stats.guessYes}</TableCell>
                <TableCell className="text-center">{stats.guessNo}</TableCell>
                {/* Confidence */}
                <TableCell className="text-center border-l">{stats.confidenceHigh}</TableCell>
                <TableCell className="text-center">{stats.confidenceMid}</TableCell>
                <TableCell className="text-center">{stats.confidenceLow}</TableCell>
                {/* Accuracy */}
                <TableCell className="text-center border-l">{formatAccuracy(stats.accuracy)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
             <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-center">{totals.attempted}</TableCell>
                <TableCell className="text-center">{totals.correct}</TableCell>
                <TableCell className="text-center">{totals.incorrect}</TableCell>
                <TableCell className="text-center">{totals.left}</TableCell>
                 {/* Knowledge */}
                <TableCell className="text-center border-l">{totals.knowledgeYes}</TableCell>
                <TableCell className="text-center">{totals.knowledgeNo}</TableCell>
                {/* Educated Guesses */}
                <TableCell className="text-center border-l">{totals.educatedGuessYes}</TableCell>
                <TableCell className="text-center">{totals.educatedGuessNo}</TableCell>
                {/* Guess */}
                <TableCell className="text-center border-l">{totals.guessYes}</TableCell>
                <TableCell className="text-center">{totals.guessNo}</TableCell>
                {/* Confidence */}
                <TableCell className="text-center border-l">{totals.confidenceHigh}</TableCell>
                <TableCell className="text-center">{totals.confidenceMid}</TableCell>
                <TableCell className="text-center">{totals.confidenceLow}</TableCell>
                {/* Accuracy */}
                <TableCell className="text-center border-l">{formatAccuracy(totals.accuracy)}</TableCell>
              </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
};