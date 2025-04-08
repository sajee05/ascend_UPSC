import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FilterControls, AnalyticsFilter } from "@/components/analytics/filter-controls";
import { EnhancedAIInsights } from "@/components/analytics/enhanced-ai-insights";
import { AttemptTrackingCharts } from "@/components/analytics/attempt-tracking-chart";
import { SubjectTrendCharts } from "@/components/analytics/subject-trend-charts-fixed";
import { TopicSubtopicAnalysis } from "@/components/analytics/topic-subtopic-analysis";
import { DateAnalysisChart } from "@/components/analytics/date-analysis-chart";
import { RecommendationCards } from "@/components/analytics/recommendation-cards";
import { KnowledgeCalibrationCard } from "@/components/analytics/knowledge-calibration-card";
import { AdvancedCharts } from "@/components/analytics/advanced-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Logo } from "@/components/ui/logo";
import { Cog, Moon, Sun, Home, History, BarChart2, TrendingUp, Calendar } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { useUIState } from "@/hooks/use-ui-state";
import { useQuery } from "@tanstack/react-query";
import { SubjectStats, UserAnswer } from "@shared/schema";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { formatDate, formatPercentage, getConfidenceEmoji, getYesNoEmoji } from "@/lib/utils";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OverallAnalyticsData {
  testCount: number;
  attemptCount: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalLeft: number;
  subjectStats: SubjectStats[];
  trendData: { date: string; accuracy: number; score: number }[];
}

export default function OverallAnalyticsPage() {
  const [, navigate] = useLocation();
  const { settings, updateSettings } = useSettings();
  const { updateUIState } = useUIState();
  
  // Filter state
  const [filters, setFilters] = useState<AnalyticsFilter>({
    dateRange: "all",
    subjects: [],
    tags: [],
    confidenceLevel: null,
    knowledgeFlag: null,
    techniqueFlag: null,
    guessworkFlag: null,
  });
  
  // Filtered data
  const [filteredStats, setFilteredStats] = useState<SubjectStats[]>([]);
  const [overallStats, setOverallStats] = useState<SubjectStats | null>(null);

  // Fetch overall analytics data
  const { data: analytics, isLoading } = useQuery<OverallAnalyticsData>({
    queryKey: ["/api/analytics/overall"],
  });

  // Extract available subjects
  const availableSubjects = analytics?.subjectStats.map(stat => stat.subject) || [];
  
  // Fetch all tags
  const { data: tagsData } = useQuery<string[]>({
    queryKey: ["/api/tags"],
    enabled: !isLoading, // Only fetch tags after analytics are loaded
  });

  // Apply filters when analytics data changes or filters change
  useEffect(() => {
    if (!analytics) return;
    
    let filtered = [...analytics.subjectStats];
    
    // Apply subject filter
    if (filters.subjects.length > 0) {
      filtered = filtered.filter(stat => {
        const subjectName = typeof stat.subject === 'string' ? stat.subject : stat.subject.name;
        return filters.subjects.includes(subjectName);
      });
    }
    
    // Apply date range filter (would be applied in a real implementation)
    
    // Calculate overall stats for filtered data
    if (filtered.length > 0) {
      const overall: SubjectStats = {
        subject: "OVERALL",
        attempts: filtered.reduce((sum, stat) => sum + stat.attempts, 0),
        correct: filtered.reduce((sum, stat) => sum + stat.correct, 0),
        incorrect: filtered.reduce((sum, stat) => sum + stat.incorrect, 0),
        left: filtered.reduce((sum, stat) => sum + stat.left, 0),
        score: filtered.reduce((sum, stat) => sum + stat.score, 0),
        accuracy: 0,
        personalBest: 0,
        avgTimeSeconds: filtered.reduce((sum, stat) => sum + stat.avgTimeSeconds, 0) / filtered.length,
        confidenceHigh: filtered.reduce((sum, stat) => sum + stat.confidenceHigh, 0),
        confidenceMid: filtered.reduce((sum, stat) => sum + stat.confidenceMid, 0),
        confidenceLow: filtered.reduce((sum, stat) => sum + stat.confidenceLow, 0),
        knowledgeYes: filtered.reduce((sum, stat) => sum + stat.knowledgeYes, 0),
        techniqueYes: filtered.reduce((sum, stat) => sum + stat.techniqueYes, 0),
        guessworkYes: filtered.reduce((sum, stat) => sum + stat.guessworkYes, 0),
        // Aggregate attempt tracking data
        firstAttemptCorrect: filtered.reduce((sum, stat) => sum + (stat.firstAttemptCorrect || 0), 0),
        secondAttemptCorrect: filtered.reduce((sum, stat) => sum + (stat.secondAttemptCorrect || 0), 0),
        thirdPlusAttemptCorrect: filtered.reduce((sum, stat) => sum + (stat.thirdPlusAttemptCorrect || 0), 0),
        attemptDistribution: filtered.reduce((result, stat) => {
          // Combine attempt distributions across all subjects
          if (stat.attemptDistribution) {
            Object.entries(stat.attemptDistribution).forEach(([attempt, count]) => {
              const attemptNum = parseInt(attempt);
              result[attemptNum] = (result[attemptNum] || 0) + count;
            });
          }
          return result;
        }, {} as {[key: number]: number}),
      };
      
      // Calculate accuracy
      overall.accuracy = 
        overall.correct + overall.incorrect > 0
          ? (overall.correct / (overall.correct + overall.incorrect)) * 100
          : 0;
      
      // Calculate personal best
      overall.personalBest = overall.accuracy;
      
      setOverallStats(overall);
    } else {
      setOverallStats(null);
    }
    
    setFilteredStats(filtered);
  }, [analytics, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: AnalyticsFilter) => {
    setFilters(newFilters);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    updateSettings({ theme: newTheme as "light" | "dark" });
  };

  // Open settings panel
  const openSettings = () => {
    updateUIState({ settingsPanelOpen: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Logo />
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Logo />
          <div className="text-red-500">No analytics data available</div>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-2">Overall Analytics</h2>
          <p className="text-muted-foreground mb-6">
            Comprehensive analysis across all your tests and attempts.
          </p>
          
          {/* Filter Controls */}
          <FilterControls 
            availableSubjects={availableSubjects} 
            availableTags={tagsData || []}
            onFilterChange={handleFilterChange}
          />
          
          {/* Basic Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center h-24">
                <p className="text-muted-foreground text-sm">Total Tests</p>
                <p className="text-3xl font-semibold">{analytics.testCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center h-24">
                <p className="text-muted-foreground text-sm">Total Attempts</p>
                <p className="text-3xl font-semibold">{analytics.attemptCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center h-24">
                <p className="text-muted-foreground text-sm">Questions Answered</p>
                <p className="text-3xl font-semibold">
                  {analytics.totalCorrect + analytics.totalIncorrect + analytics.totalLeft}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center h-24">
                <p className="text-muted-foreground text-sm">Overall Accuracy</p>
                <p className="text-3xl font-semibold">
                  {formatPercentage(
                    (analytics.totalCorrect / (analytics.totalCorrect + analytics.totalIncorrect)) * 100
                  )}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Enhanced Analytics Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Performance Analytics
            </h2>
            <p className="text-muted-foreground mb-4">
              Analyze your performance across different dimensions and identify trends.
            </p>
            <Tabs defaultValue="multi-dimension" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="multi-dimension" className="flex items-center gap-1">
                  <BarChart2 className="h-4 w-4" />
                  <span>Subject & Topic</span>
                </TabsTrigger>
                <TabsTrigger value="time-analysis" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Time Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="trend-view" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Trend View</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="multi-dimension">
                <TopicSubtopicAnalysis subjectStats={filteredStats} />
              </TabsContent>
              
              <TabsContent value="time-analysis">
                <DateAnalysisChart trendData={analytics.trendData} />
              </TabsContent>
              
              <TabsContent value="trend-view">
                <SubjectTrendCharts 
                  trendData={analytics.trendData} 
                  subjectStats={filteredStats}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
          
          {/* Original Trend Charts (Basic View) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            {/* Score Trend Chart */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Score Trend</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analytics.trendData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
                      <Tooltip 
                        formatter={(value: any, name: any): [string, string] => {
                          if (name === "accuracy") return [`${parseFloat(value).toFixed(1)}%`, "Accuracy"];
                          return [parseFloat(value).toFixed(1), "Score"];
                        }}
                        labelFormatter={(value: any) => formatDate(value)}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="score" 
                        stroke="#0A84FF" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#30D158" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Subject Comparison */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Subject Comparison</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredStats}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey={(entry: any) => typeof entry.subject === 'string' ? entry.subject : entry.subject.name}
                        name="Subject" 
                      />
                      <YAxis domain={[0, 100]} unit="%" />
                      <Tooltip 
                        formatter={(value: any): [string, string] => [`${value}%`, "Accuracy"]}
                      />
                      <Bar dataKey="accuracy" fill="#0A84FF" name="Accuracy" radius={[4, 4, 0, 0]}>
                        {filteredStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Attempt Tracking Charts */}
          {overallStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-8"
            >
              <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Attempt Tracking Analytics
              </h2>
              <p className="text-muted-foreground mb-4">
                Analyze how your performance varies across multiple attempt numbers and identify areas for improvement.
              </p>
              <AttemptTrackingCharts stats={overallStats} />
            </motion.div>
          )}
          
          {/* Knowledge Calibration Card */}
          {overallStats && (
            <KnowledgeCalibrationCard 
              overallStats={overallStats} 
              subjectStats={filteredStats} 
            />
          )}
          
          {/* Recommendation Cards */}
          {overallStats && (
            <RecommendationCards 
              overallStats={overallStats} 
              subjectStats={filteredStats} 
            />
          )}
          
          {/* Advanced Charts */}
          {overallStats && (
            <div className="mb-8">
              <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Meta-Cognitive Analytics
              </h2>
              <p className="text-muted-foreground mb-4">
                Advanced analysis of your learning patterns, knowledge calibration, and cognitive processes.
              </p>
              <AdvancedCharts 
                overallStats={overallStats} 
                subjectStats={filteredStats} 
              />
            </div>
          )}
          
          {/* AI Insights */}
          {overallStats && (
            <EnhancedAIInsights 
              overallStats={overallStats} 
              subjectStats={filteredStats} 
            />
          )}
          
          {/* Error Log Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Performance by Subject</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Accuracy</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Avg Time</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Knowledge</TableHead>
                        <TableHead>Technique</TableHead>
                        <TableHead>Guesswork</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStats.map((stat) => {
                        const subjectName = typeof stat.subject === 'string' ? stat.subject : stat.subject.name;
                        const subjectId = typeof stat.subject === 'string' ? stat.subject : stat.subject.id.toString();
                        
                        return (
                          <TableRow key={subjectId}>
                            <TableCell className="font-medium">{subjectName}</TableCell>
                            <TableCell>{stat.attempts}</TableCell>
                            <TableCell>{formatPercentage(stat.accuracy)}</TableCell>
                            <TableCell>{stat.score.toFixed(1)}</TableCell>
                            <TableCell>{Math.round(stat.avgTimeSeconds)}s</TableCell>
                            <TableCell>
                              {getConfidenceEmoji('high')}{Math.round((stat.confidenceHigh / stat.attempts) * 100)}%{' '}
                              {getConfidenceEmoji('mid')}{Math.round((stat.confidenceMid / stat.attempts) * 100)}%{' '}
                              {getConfidenceEmoji('low')}{Math.round((stat.confidenceLow / stat.attempts) * 100)}%
                            </TableCell>
                            <TableCell>
                              {getYesNoEmoji(true)}{Math.round((stat.knowledgeYes / stat.attempts) * 100)}%
                            </TableCell>
                            <TableCell>
                              {getYesNoEmoji(true)}{Math.round((stat.techniqueYes / stat.attempts) * 100)}%
                            </TableCell>
                            <TableCell>
                              {getYesNoEmoji(true)}{Math.round((stat.guessworkYes / stat.attempts) * 100)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {overallStats && (
                        <TableRow className="font-semibold bg-muted/50">
                          <TableCell>{typeof overallStats.subject === 'string' ? overallStats.subject : overallStats.subject.name}</TableCell>
                          <TableCell>{overallStats.attempts}</TableCell>
                          <TableCell>{formatPercentage(overallStats.accuracy)}</TableCell>
                          <TableCell>{overallStats.score.toFixed(1)}</TableCell>
                          <TableCell>{Math.round(overallStats.avgTimeSeconds)}s</TableCell>
                          <TableCell>
                            {getConfidenceEmoji('high')}{Math.round((overallStats.confidenceHigh / overallStats.attempts) * 100)}%{' '}
                            {getConfidenceEmoji('mid')}{Math.round((overallStats.confidenceMid / overallStats.attempts) * 100)}%{' '}
                            {getConfidenceEmoji('low')}{Math.round((overallStats.confidenceLow / overallStats.attempts) * 100)}%
                          </TableCell>
                          <TableCell>
                            {getYesNoEmoji(true)}{Math.round((overallStats.knowledgeYes / overallStats.attempts) * 100)}%
                          </TableCell>
                          <TableCell>
                            {getYesNoEmoji(true)}{Math.round((overallStats.techniqueYes / overallStats.attempts) * 100)}%
                          </TableCell>
                          <TableCell>
                            {getYesNoEmoji(true)}{Math.round((overallStats.guessworkYes / overallStats.attempts) * 100)}%
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
