import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { FilterControls, AnalyticsFilter } from "@/components/analytics/filter-controls";
import { AIAnalytics } from "@/components/analytics/ai-analytics";
import { AdvancedCharts } from "@/components/analytics/advanced-charts";
import { AnalyticsExport } from "@/components/analytics/analytics-export";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Logo } from "@/components/ui/logo";
import { 
  Cog, Home, History, BarChart2, TrendingUp, 
  Calendar, BrainCircuit, ArrowLeft, Sparkles 
} from "lucide-react";
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

  // Extract available subjects for filtering
  const availableSubjects = useMemo(() => {
    if (!analytics) return [];
    
    return analytics.subjectStats.map(stat => {
      const subject = typeof stat.subject === 'string' ? stat.subject : stat.subject.name;
      return subject;
    });
  }, [analytics]);
  
  // Fetch all tags
  const { data: tagsData } = useQuery<string[]>({
    queryKey: ["/api/tags"],
    enabled: !isLoading, // Only fetch tags after analytics are loaded
  });
  
  // Process tags data for display
  const processedTags = useMemo(() => {
    if (!tagsData) return [];
    return tagsData;
  }, [tagsData]);

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
    
    // Apply tag filter - treat all tags as topics that can belong to any subject
    if (filters.tags.length > 0) {
      filtered = filtered.filter(stat => {
        const subjectName = typeof stat.subject === 'string' ? stat.subject : stat.subject.name;
        
        // Consider a match if any tag contains the subject or vice versa
        return filters.tags.some(tag => 
          subjectName.includes(tag) || 
          tag.includes(subjectName) ||
          // Also check if the tag is a known subject topic
          (subjectName === "Economics" && ["ECONOMICS BASICS", "NATIONAL INCOME", "INFLATION", "RBI", "BANKING"].includes(tag)) ||
          (subjectName === "Polity" && ["PREMBLE", "FR", "DPSP", "PARL+"].includes(tag)) ||
          (subjectName === "Modern History" && ["GANDHI", "INC"].includes(tag))
        );
      });
    }
    
    // Apply confidence level filter if selected
    if (filters.confidenceLevel) {
      filtered = filtered.filter(stat => {
        if (filters.confidenceLevel === "high" && stat.confidenceHigh > 0) return true;
        if (filters.confidenceLevel === "mid" && stat.confidenceMid > 0) return true;
        if (filters.confidenceLevel === "low" && stat.confidenceLow > 0) return true;
        return false;
      });
    }
    
    // Apply meta-cognitive flag filters
    if (filters.knowledgeFlag !== null) {
      filtered = filtered.filter(stat => 
        filters.knowledgeFlag ? stat.knowledgeYes > 0 : stat.knowledgeYes === 0
      );
    }
    
    if (filters.techniqueFlag !== null) {
      filtered = filtered.filter(stat => 
        filters.techniqueFlag ? stat.techniqueYes > 0 : stat.techniqueYes === 0
      );
    }
    
    if (filters.guessworkFlag !== null) {
      filtered = filtered.filter(stat => 
        filters.guessworkFlag ? stat.guessworkYes > 0 : stat.guessworkYes === 0
      );
    }
    
    // Apply date range filter - if selected
    
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
            availableTags={processedTags}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-4">Subject Performance</h3>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={filteredStats}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} unit="%" />
                            <YAxis 
                              dataKey={(entry) => typeof entry.subject === 'string' ? entry.subject : entry.subject.name} 
                              type="category" 
                              width={100} 
                            />
                            <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                            <Legend />
                            <Bar dataKey="accuracy" fill="#0A84FF" name="Accuracy %" barSize={20}>
                              {filteredStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-4">Subject Distribution</h3>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={filteredStats}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              fill="#8884d8"
                              paddingAngle={2}
                              dataKey="attempts"
                              nameKey={(entry) => typeof entry.subject === 'string' ? entry.subject : entry.subject.name}
                              label={(entry) => `${typeof entry.payload.subject === 'string' ? entry.payload.subject : entry.payload.subject.name}: ${entry.value} Qs`}
                            >
                              {filteredStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} questions`, ""]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="time-analysis">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="col-span-2">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-4">Date Performance</h3>
                      <div className="h-72 w-full">
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
                </div>
              </TabsContent>
              
              <TabsContent value="trend-view">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="md:col-span-2">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-4">Subject Trend Analysis</h3>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={filteredStats}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={(entry) => typeof entry.subject === 'string' ? entry.subject : entry.subject.name} />
                            <YAxis yAxisId="left" domain={[0, 100]} unit="%" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip 
                              formatter={(value, name) => {
                                if (name === "accuracy") return [`${value}%`, "Accuracy"];
                                if (name === "score") return [`${value}`, "Score"];
                                if (name === "avgTimeSeconds") return [`${value}s`, "Avg Time"];
                                return [value, name];
                              }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="accuracy" name="Accuracy %" fill="#30D158" />
                            <Bar yAxisId="left" dataKey="score" name="Score" fill="#0A84FF" />
                            <Bar yAxisId="right" dataKey="avgTimeSeconds" name="Avg Time (s)" fill="#FF453A" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Attempt Performance Distribution</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: '1st Attempt', value: overallStats.firstAttemptCorrect || 0 },
                          { name: '2nd Attempt', value: overallStats.secondAttemptCorrect || 0 },
                          { name: '3rd+ Attempt', value: overallStats.thirdPlusAttemptCorrect || 0 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} correct`, 'Count']} />
                        <Legend />
                        <Bar dataKey="value" fill="#0A84FF" name="Correct Answers" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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
                trendData={analytics.trendData} // Pass actual trend data
              />
            </div>
          )}
          
          {/* AI Insights */}
          {overallStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Insights
              </h2>
              <AIAnalytics 
                overallStats={overallStats} 
                subjectStats={filteredStats} 
              />
            </motion.div>
          )}
          
          {/* Analytics Export */}
          {overallStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 mb-8"
            >
              <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Share Your Progress
              </h2>
              <AnalyticsExport
                testTitle="Overall Performance"
                testDate={new Date().toISOString()}
                overallStats={overallStats}
                subjectStats={filteredStats}
              />
            </motion.div>
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
                            <TableCell>{stat.score ? stat.score.toFixed(1) : '0.0'}</TableCell>
                            <TableCell>{stat.avgTimeSeconds ? Math.round(stat.avgTimeSeconds) : 0}s</TableCell>
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
                          <TableCell>{overallStats.score ? overallStats.score.toFixed(1) : '0.0'}</TableCell>
                          <TableCell>{overallStats.avgTimeSeconds ? Math.round(overallStats.avgTimeSeconds) : 0}s</TableCell>
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
