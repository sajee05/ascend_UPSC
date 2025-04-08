import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubjectStats } from "@shared/schema";
import { motion } from "framer-motion";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, 
  ScatterChart, Scatter, Area, AreaChart, ComposedChart, Treemap,
  LabelList
} from "recharts";
import { useState } from "react";
import { BarChart2, Lightbulb, MapPin, LineChart as LineChartIcon } from "lucide-react";

interface ChartsProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
}

export function Charts({ overallStats, subjectStats }: ChartsProps) {
  const [chartView, setChartView] = useState<'basic' | 'advanced'>('basic');

  // Calculate score percentages for score breakdown chart
  const scorePossible = overallStats.attempts * 2; // Assuming +2 per question
  const scorePercentage = (overallStats.score / scorePossible) * 100;
  const missedScorePercentage = 100 - scorePercentage;

  // Data for overall results pie chart
  const overallData = [
    { name: "Correct", value: overallStats.correct, color: "#30D158" },
    { name: "Incorrect", value: overallStats.incorrect, color: "#FF453A" },
    { name: "Left", value: overallStats.left, color: "#8E8E93" },
  ];

  // Data for subject accuracy bar chart
  const subjectAccuracyData = [...subjectStats]
    .sort((a, b) => b.accuracy - a.accuracy) // Sort by accuracy descending
    .map(subject => ({
      name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
      fullName: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
      accuracy: parseFloat(subject.accuracy.toFixed(1)),
      score: parseFloat((subject.score / subject.attempts * 50).toFixed(1)), // Normalize score
      color: "#0A84FF",
      // Calculate efficiency (score per time spent)
      efficiency: parseFloat((subject.score / (subject.avgTimeSeconds || 1) * 10).toFixed(1)),
    }));

  // Data for confidence pie chart
  const confidenceData = [
    { name: "High", value: overallStats.confidenceHigh, color: "#30D158" },
    { name: "Mid", value: overallStats.confidenceMid, color: "#FFD60A" },
    { name: "Low", value: overallStats.confidenceLow, color: "#FF453A" },
  ];

  // Data for meta-cognitive bar chart
  const total = Math.max(1, overallStats.attempts); // Avoid division by zero
  const metaCognitiveData = [
    { 
      name: "Knowledge", 
      yes: overallStats.knowledgeYes, 
      no: overallStats.attempts - overallStats.knowledgeYes,
      percentage: Math.round((overallStats.knowledgeYes / total) * 100)
    },
    { 
      name: "Technique", 
      yes: overallStats.techniqueYes, 
      no: overallStats.attempts - overallStats.techniqueYes,
      percentage: Math.round((overallStats.techniqueYes / total) * 100)
    },
    { 
      name: "Guesswork", 
      yes: overallStats.guessworkYes, 
      no: overallStats.attempts - overallStats.guessworkYes,
      percentage: Math.round((overallStats.guessworkYes / total) * 100)
    },
  ];
  
  // Data for subject performance radar chart
  const radarData = [...subjectStats]
    .map(subject => {
      const data = {
        subject: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
        accuracy: parseFloat(subject.accuracy.toFixed(1)),
        score: parseFloat((subject.score / subject.attempts * 50).toFixed(1)), // Normalize score
        speed: 100 - Math.min(100, parseFloat((subject.avgTimeSeconds / 2).toFixed(1))),
        confidence: parseFloat(((subject.confidenceHigh / Math.max(1, subject.attempts)) * 100).toFixed(1)),
        knowledge: parseFloat(((subject.knowledgeYes / Math.max(1, subject.attempts)) * 100).toFixed(1)),
      };
      return data;
    });
  
  // Data for subject comparison chart
  const subjectComparisonData = [...subjectStats]
    .sort((a, b) => {
      // Sort by score descending
      return b.score - a.score;
    })
    .map(subject => ({
      name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
      accuracy: parseFloat(subject.accuracy.toFixed(1)),
      score: parseFloat((subject.score / subject.attempts * 50).toFixed(1)), // Normalize score
      avgTime: parseFloat(subject.avgTimeSeconds.toFixed(0)),
      questions: subject.attempts,
    }));
  
  // Data for time-speed analysis
  const timeSpeedData = [...subjectStats]
    .map(subject => ({
      name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
      avgTime: subject.avgTimeSeconds,
      accuracy: subject.accuracy,
      size: subject.attempts * 5, // Circle size proportional to number of questions
    }));

  // Generate Treemap data for subject distribution
  const treemapData = {
    name: "Subjects",
    children: subjectStats.map(subject => ({
      name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
      size: subject.attempts,
      // Color based on accuracy
      color: subject.accuracy > 70 ? "#38A169" : subject.accuracy > 50 ? "#DD6B20" : "#E53E3E",
      accuracy: subject.accuracy
    }))
  };

  // Define typed insight interfaces
  type AccuracyInsight = {
    name: string;
    accuracy: number;
  };
  
  type TimeInsight = {
    name: string;
    avgTime: number;
  };
  
  // Define insight types with their appropriate subject type
  type InsightWithAccuracySubjects = {
    title: string;
    subjects: AccuracyInsight[];
  };
  
  type InsightWithTimeSubjects = {
    title: string;
    subjects: TimeInsight[];
  };
  
  // Performance insights based on actual data
  const topPerformingSubjects: InsightWithAccuracySubjects = {
    title: "Top Performing Subjects",
    subjects: [...subjectStats]
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 2)
      .map(subject => ({
        name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
        accuracy: subject.accuracy
      }))
  };
  
  const subjectsNeedingImprovement: InsightWithAccuracySubjects = {
    title: "Subjects Needing Improvement",
    subjects: [...subjectStats]
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 2)
      .map(subject => ({
        name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
        accuracy: subject.accuracy
      }))
  };
  
  const timeEfficiency: InsightWithTimeSubjects = {
    title: "Time-Efficiency",
    subjects: [...subjectStats]
      .sort((a, b) => {
        // Sort by score/time efficiency
        const aEfficiency = a.score / (a.avgTimeSeconds || 1);
        const bEfficiency = b.score / (b.avgTimeSeconds || 1);
        return bEfficiency - aEfficiency;
      })
      .slice(0, 2)
      .map(subject => ({
        name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
        avgTime: subject.avgTimeSeconds
      }))
  };
  
  // Combined array of insights
  const performanceInsights = [
    topPerformingSubjects,
    subjectsNeedingImprovement,
    timeEfficiency
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          Performance Analytics
        </h2>
        <Tabs value={chartView} onValueChange={(value) => setChartView(value as 'basic' | 'advanced')}>
          <TabsList>
            <TabsTrigger value="basic">Basic View</TabsTrigger>
            <TabsTrigger value="advanced">Advanced View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {chartView === 'basic' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Pie Chart: Overall Results */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-center mb-3">Overall Results</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overallData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {overallData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} questions`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center mt-2 text-sm">
                <div className="flex items-center mr-4">
                  <span className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full mr-1"></span>
                  <span>Correct: {overallStats.correct}</span>
                </div>
                <div className="flex items-center mr-4">
                  <span className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full mr-1"></span>
                  <span>Incorrect: {overallStats.incorrect}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full mr-1"></span>
                  <span>Left: {overallStats.left}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart: Subject Accuracy */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-center mb-3">Subject Accuracy</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectAccuracyData.slice(0, 5)} // Show top 5 subjects
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                    <Bar 
                      dataKey="accuracy" 
                      fill="#0A84FF" 
                      radius={[0, 4, 4, 0]}
                    >
                      {/* Adding color based on value */}
                      {subjectAccuracyData.slice(0, 5).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.accuracy > 70 ? "#38A169" : entry.accuracy > 50 ? "#DD6B20" : "#E53E3E"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Meta-Cognitive Pie Chart */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-center mb-3">Confidence Levels</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={confidenceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {confidenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} questions`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center mt-2 text-sm">
                <div className="flex items-center mr-4">
                  <span className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full mr-1"></span>
                  <span>High: {Math.round((overallStats.confidenceHigh / Math.max(1, overallStats.attempts)) * 100)}%</span>
                </div>
                <div className="flex items-center mr-4">
                  <span className="w-3 h-3 bg-amber-500 dark:bg-amber-400 rounded-full mr-1"></span>
                  <span>Mid: {Math.round((overallStats.confidenceMid / Math.max(1, overallStats.attempts)) * 100)}%</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full mr-1"></span>
                  <span>Low: {Math.round((overallStats.confidenceLow / Math.max(1, overallStats.attempts)) * 100)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Meta-cognitive Bar Chart */}
          <Card className="md:col-span-3">
            <CardContent className="p-4">
              <h3 className="font-medium text-center mb-3">Meta-cognitive Analysis</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metaCognitiveData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip 
                      formatter={(value, name) => [
                        value, 
                        name === "yes" ? "Yes" : name === "no" ? "No" : name
                      ]} 
                      labelFormatter={(label) => `${label} (${metaCognitiveData.find(d => d.name === label)?.percentage || 0}% Yes)`}
                    />
                    <Legend />
                    <Bar dataKey="yes" name="Yes" stackId="a" fill="#30D158" barSize={30}>
                      <LabelList dataKey="percentage" position="insideRight" formatter={(value: number) => `${value}%`} />
                    </Bar>
                    <Bar dataKey="no" name="No" stackId="a" fill="#FF453A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Advanced View
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Performance Insights Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" /> 
                Performance Insights
              </CardTitle>
              <CardDescription>Key observations from your test data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceInsights.map((insight, idx) => (
                  <div key={idx} className="border-b pb-3 last:border-0">
                    <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                    {insight.title === "Top Performing Subjects" ? (
                      <div className="space-y-2">
                        {(insight.subjects as AccuracyInsight[]).map((subject, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Badge variant="outline" className="bg-green-100 dark:bg-green-900 mr-2">
                                {i + 1}
                              </Badge>
                              <span className="text-sm truncate max-w-[150px]">{subject.name}</span>
                            </div>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {subject.accuracy.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : insight.title === "Subjects Needing Improvement" ? (
                      <div className="space-y-2">
                        {(insight.subjects as AccuracyInsight[]).map((subject, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Badge variant="outline" className="bg-red-100 dark:bg-red-900 mr-2">
                                {i + 1}
                              </Badge>
                              <span className="text-sm truncate max-w-[150px]">{subject.name}</span>
                            </div>
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              {subject.accuracy.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(insight.subjects as TimeInsight[]).map((subject, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 mr-2">
                                {i + 1}
                              </Badge>
                              <span className="text-sm truncate max-w-[150px]">{subject.name}</span>
                            </div>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {subject.avgTime.toFixed(1)}s
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Score Summary */}
                <div className="pt-2">
                  <h4 className="font-medium text-sm mb-1">Score Summary</h4>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{width: `${scorePercentage}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Score: {overallStats.score.toFixed(1)}/{scorePossible.toFixed(1)}</span>
                    <span>{scorePercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Radar Chart: Subject Performance Analysis */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>Multi-dimensional subject performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--foreground)' }} />
                    <Radar 
                      name="Accuracy" 
                      dataKey="accuracy" 
                      stroke="#0A84FF" 
                      fill="#0A84FF" 
                      fillOpacity={0.6}
                    />
                    <Radar 
                      name="Score" 
                      dataKey="score" 
                      stroke="#30D158" 
                      fill="#30D158" 
                      fillOpacity={0.6}
                    />
                    <Radar 
                      name="Speed" 
                      dataKey="speed" 
                      stroke="#FF9F0A" 
                      fill="#FF9F0A" 
                      fillOpacity={0.6}
                    />
                    <Radar 
                      name="Confidence" 
                      dataKey="confidence" 
                      stroke="#BF5AF2" 
                      fill="#BF5AF2" 
                      fillOpacity={0.6}
                    />
                    <Legend />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, ""]} 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '6px',
                        color: 'var(--foreground)'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Treemap: Subject Distribution */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Subject Distribution
              </CardTitle>
              <CardDescription>Area represents number of questions, color indicates accuracy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapData.children}
                    dataKey="size"
                    aspectRatio={4/3}
                    stroke="#fff"
                    fill="#8884d8"
                  >
                    {
                      treemapData.children.map((item, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={item.color}
                        />
                      ))
                    }
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded p-2 shadow-md">
                              <p>{`${payload[0].name}`}</p>
                              <p className="text-primary">{`Questions: ${payload[0].value}`}</p>
                              <p className="text-primary">{`Accuracy: ${payload[0].payload.accuracy.toFixed(1)}%`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Scatter Plot: Time vs Accuracy */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Time vs Accuracy</CardTitle>
              <CardDescription>Correlation analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="avgTime" 
                      name="Time (sec)" 
                      unit="s" 
                      label={{ value: 'Average Time', position: 'bottom', dy: 10 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="accuracy" 
                      name="Accuracy" 
                      unit="%" 
                      domain={[0, 100]} 
                      label={{ value: 'Accuracy', angle: -90, position: 'left', dx: -10 }}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value: number, name: string) => {
                        if (name === 'avgTime') return [`${value}s`, 'Avg Time'];
                        if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                        return [value, name];
                      }}
                    />
                    <Scatter 
                      name="Subjects" 
                      data={timeSpeedData} 
                      fill="#0A84FF"
                    >
                      {timeSpeedData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.accuracy > 70 ? "#30D158" : entry.accuracy > 40 ? "#FF9F0A" : "#FF453A"} 
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Area Chart: Subject Comparisons */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-primary" />
                Subject Comparison
              </CardTitle>
              <CardDescription>Comprehensive view of all performance metrics by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    data={subjectComparisonData} 
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#0A84FF" />
                    <YAxis yAxisId="right" orientation="right" stroke="#FF9F0A" />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'Accuracy (%)') return [`${value}%`, name];
                        if (name === 'Score (out of 100)') return [`${value}`, name];
                        if (name === 'Avg Time (sec)') return [`${value}s`, name];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="accuracy" name="Accuracy (%)" fill="#0A84FF">
                      {subjectComparisonData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.accuracy > 70 ? "#38A169" : entry.accuracy > 50 ? "#DD6B20" : "#E53E3E"}
                        />
                      ))}
                    </Bar>
                    <Bar yAxisId="left" dataKey="score" name="Score (out of 100)" fill="#30D158" />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="avgTime" 
                      name="Avg Time (sec)" 
                      stroke="#FF9F0A"
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
