import { useState } from "react";
import { SubjectStats } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart4, Percent, Clock, ChevronDown, ChevronUp, ArrowUpNarrowWide, ArrowDownNarrowWide } from "lucide-react";
import { motion } from "framer-motion";

interface PerformanceTableProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
  editable?: boolean;
}

export function EnhancedPerformanceTable({
  overallStats,
  subjectStats,
  editable = false,
}: PerformanceTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SubjectStats;
    direction: "asc" | "desc";
  }>({
    key: "accuracy",
    direction: "desc",
  });
  
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [metricFilter, setMetricFilter] = useState<string>("all");

  // Formatter functions
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatTime = (seconds: number) => `${seconds.toFixed(1)}s`;
  const formatScore = (score: number) => score.toFixed(1);

  // Sort handler
  const requestSort = (key: keyof SubjectStats) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  // Toggle row expansion
  const toggleRowExpansion = (subjectName: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [subjectName]: !prev[subjectName],
    }));
  };

  // Filter metrics based on selection
  const getFilteredMetrics = (stat: SubjectStats) => {
    switch (metricFilter) {
      case "accuracy":
        return [
          { name: "Accuracy", value: formatPercentage(stat.accuracy) },
          { name: "Personal Best", value: formatPercentage(stat.personalBest) },
        ];
      case "answers":
        return [
          { name: "Total Questions", value: stat.attempts },
          { name: "Correct", value: stat.correct },
          { name: "Incorrect", value: stat.incorrect },
          { name: "Left", value: stat.left },
        ];
      case "confidence":
        return [
          { name: "High Confidence", value: stat.confidenceHigh },
          { name: "Medium Confidence", value: stat.confidenceMid },
          { name: "Low Confidence", value: stat.confidenceLow },
        ];
      case "metacognitive":
        return [
          { name: "Knowledge", value: stat.knowledgeYes },
          { name: "Technique", value: stat.techniqueYes },
          { name: "Guesswork", value: stat.guessworkYes },
        ];
      case "time":
        return [
          { name: "Avg. Time", value: formatTime(stat.avgTimeSeconds) },
          { 
            name: "Time Efficiency", 
            value: `${(stat.accuracy / stat.avgTimeSeconds).toFixed(1)} %/s`
          },
        ];
      default:
        return [];
    }
  };

  // Sort and filter the data
  const sortedAndFilteredStats = [...subjectStats]
    .filter((stat) =>
      stat.subject.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortConfig.key] as number;
      const bValue = b[sortConfig.key] as number;

      if (sortConfig.direction === "asc") {
        return aValue - bValue;
      }
      return bValue - aValue;
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h3 className="text-lg font-semibold">Performance Details</h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search by subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto"
              />
              <Select
                value={metricFilter}
                onValueChange={setMetricFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metrics</SelectItem>
                  <SelectItem value="accuracy">Accuracy</SelectItem>
                  <SelectItem value="answers">Answers</SelectItem>
                  <SelectItem value="confidence">Confidence</SelectItem>
                  <SelectItem value="metacognitive">Meta-cognitive</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/50">
                  <TableHead className="w-[250px]">Subject</TableHead>
                  <TableHead className="text-right" onClick={() => requestSort("accuracy")}>
                    <div className="flex items-center justify-end cursor-pointer">
                      <span>Accuracy</span>
                      {sortConfig.key === "accuracy" && (
                        sortConfig.direction === "desc" ? 
                          <ArrowDownNarrowWide className="ml-1 h-4 w-4" /> : 
                          <ArrowUpNarrowWide className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right" onClick={() => requestSort("score")}>
                    <div className="flex items-center justify-end cursor-pointer">
                      <span>Score</span>
                      {sortConfig.key === "score" && (
                        sortConfig.direction === "desc" ? 
                          <ArrowDownNarrowWide className="ml-1 h-4 w-4" /> : 
                          <ArrowUpNarrowWide className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right" onClick={() => requestSort("correct")}>
                    <div className="flex items-center justify-end cursor-pointer">
                      <span>Correct</span>
                      {sortConfig.key === "correct" && (
                        sortConfig.direction === "desc" ? 
                          <ArrowDownNarrowWide className="ml-1 h-4 w-4" /> : 
                          <ArrowUpNarrowWide className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right" onClick={() => requestSort("avgTimeSeconds")}>
                    <div className="flex items-center justify-end cursor-pointer">
                      <span>Avg. Time</span>
                      {sortConfig.key === "avgTimeSeconds" && (
                        sortConfig.direction === "desc" ? 
                          <ArrowDownNarrowWide className="ml-1 h-4 w-4" /> : 
                          <ArrowUpNarrowWide className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Overall row (always shown) */}
                <TableRow className="font-medium bg-secondary/10">
                  <TableCell>OVERALL</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <Percent className="mr-1 h-4 w-4 text-blue-500" />
                      {formatPercentage(overallStats.accuracy)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <BarChart4 className="mr-1 h-4 w-4 text-green-500" />
                      {formatScore(overallStats.score)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {overallStats.correct}/{overallStats.attempts}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <Clock className="mr-1 h-4 w-4 text-amber-500" />
                      {formatTime(overallStats.avgTimeSeconds)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRowExpansion("OVERALL")}
                    >
                      {expandedRows["OVERALL"] ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Expanded overall details */}
                {expandedRows["OVERALL"] && (
                  <TableRow className="bg-secondary/5">
                    <TableCell colSpan={6} className="p-0">
                      <div className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2">Accuracy</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              <li className="flex justify-between">
                                <span>Accuracy:</span>
                                <span>{formatPercentage(overallStats.accuracy)}</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Personal Best:</span>
                                <span>{formatPercentage(overallStats.personalBest)}</span>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-2">Answers</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              <li className="flex justify-between">
                                <span>Total Questions:</span>
                                <span>{overallStats.attempts}</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Correct:</span>
                                <span className="text-green-500">{overallStats.correct}</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Incorrect:</span>
                                <span className="text-red-500">{overallStats.incorrect}</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Left:</span>
                                <span className="text-gray-500">{overallStats.left}</span>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-2">Confidence</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              <li className="flex justify-between">
                                <span>High Confidence:</span>
                                <span>{overallStats.confidenceHigh}</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Med Confidence:</span>
                                <span>{overallStats.confidenceMid}</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Low Confidence:</span>
                                <span>{overallStats.confidenceLow}</span>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-2">Meta-Cognitive</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              <li className="flex justify-between">
                                <span>Knowledge:</span>
                                <span>{overallStats.knowledgeYes}</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Technique:</span>
                                <span>{overallStats.techniqueYes}</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Guesswork:</span>
                                <span>{overallStats.guessworkYes}</span>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-2">Time Analysis</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              <li className="flex justify-between">
                                <span>Avg. Time:</span>
                                <span>{formatTime(overallStats.avgTimeSeconds)}</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Time Efficiency:</span>
                                <span>
                                  {(overallStats.accuracy / overallStats.avgTimeSeconds).toFixed(1)} %/s
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Subject rows */}
                {sortedAndFilteredStats.map((stat) => (
                  <>
                    <TableRow key={stat.subject} className="hover:bg-accent/10">
                      <TableCell className="font-medium">{stat.subject}</TableCell>
                      <TableCell className="text-right">
                        {formatPercentage(stat.accuracy)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatScore(stat.score)}
                      </TableCell>
                      <TableCell className="text-right">
                        {stat.correct}/{stat.attempts}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatTime(stat.avgTimeSeconds)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(stat.subject)}
                        >
                          {expandedRows[stat.subject] ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded details */}
                    {expandedRows[stat.subject] && (
                      <TableRow className="bg-accent/5">
                        <TableCell colSpan={6} className="p-0">
                          <div className="p-4">
                            {metricFilter === "all" ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Accuracy</h4>
                                  <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li className="flex justify-between">
                                      <span>Accuracy:</span>
                                      <span>{formatPercentage(stat.accuracy)}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Personal Best:</span>
                                      <span>{formatPercentage(stat.personalBest)}</span>
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Answers</h4>
                                  <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li className="flex justify-between">
                                      <span>Total Questions:</span>
                                      <span>{stat.attempts}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Correct:</span>
                                      <span className="text-green-500">{stat.correct}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Incorrect:</span>
                                      <span className="text-red-500">{stat.incorrect}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Left:</span>
                                      <span className="text-gray-500">{stat.left}</span>
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Confidence</h4>
                                  <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li className="flex justify-between">
                                      <span>High Confidence:</span>
                                      <span>{stat.confidenceHigh}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Med Confidence:</span>
                                      <span>{stat.confidenceMid}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Low Confidence:</span>
                                      <span>{stat.confidenceLow}</span>
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Meta-Cognitive</h4>
                                  <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li className="flex justify-between">
                                      <span>Knowledge:</span>
                                      <span>{stat.knowledgeYes}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Technique:</span>
                                      <span>{stat.techniqueYes}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Guesswork:</span>
                                      <span>{stat.guessworkYes}</span>
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Time Analysis</h4>
                                  <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li className="flex justify-between">
                                      <span>Avg. Time:</span>
                                      <span>{formatTime(stat.avgTimeSeconds)}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Time Efficiency:</span>
                                      <span>
                                        {(stat.accuracy / stat.avgTimeSeconds).toFixed(1)} %/s
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-4">
                                {getFilteredMetrics(stat).map((metric) => (
                                  <div key={metric.name} className="flex justify-between">
                                    <span className="font-medium">{metric.name}:</span>
                                    <span>{metric.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}

                {sortedAndFilteredStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No subjects match your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}