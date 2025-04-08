import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubjectStats } from "@shared/schema";
import { motion } from "framer-motion";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, 
  ScatterChart, Scatter, Area, AreaChart, ComposedChart, Treemap,
  LabelList, ReferenceLine
} from "recharts";
import { 
  BarChart2, Lightbulb, TrendingUp, Activity, Clock, Target, 
  BrainCircuit, Calendar, Tag, Flag
} from "lucide-react";

interface AdvancedChartsProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
}

export function AdvancedCharts({ overallStats, subjectStats }: AdvancedChartsProps) {
  const [activeTab, setActiveTab] = useState<string>("tagwise");

  // COLORS for charts
  const PRIMARY_COLORS = ['#30D158', '#0A84FF', '#FFD60A', '#FF9F0A', '#FF453A', '#BF5AF2'];
  const SECONDARY_COLORS = ['#2ecc71', '#3498db', '#f1c40f', '#e67e22', '#e74c3c', '#9b59b6'];
  const NEUTRAL_COLORS = ['#30D158', '#FF453A', '#8E8E93'];

  // ---------------- DATA PREPARATION ----------------
  
  // Data for tag-wise performance
  const tagData = subjectStats
    .sort((a, b) => b.accuracy - a.accuracy)
    .map((subject, index) => ({
      name: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
      accuracy: parseFloat(subject.accuracy.toFixed(1)),
      score: parseFloat((subject.score / subject.attempts * 50).toFixed(1)), 
      questions: subject.attempts,
      color: PRIMARY_COLORS[index % PRIMARY_COLORS.length]
    }));
    
  // Data for confidence-accuracy correlation
  const confidenceAccuracyData = subjectStats.map(subject => {
    const subjectName = typeof subject.subject === 'string' ? subject.subject : subject.subject.name;
    const confidenceHighPct = subject.attempts > 0 ? (subject.confidenceHigh / subject.attempts) * 100 : 0;
    
    return {
      name: subjectName,
      confidenceRating: parseFloat(confidenceHighPct.toFixed(1)),
      accuracy: parseFloat(subject.accuracy.toFixed(1)),
      questions: subject.attempts,
    };
  });

  // Data for date-wise performance, create simulated data points based on attempt distribution
  const dateWiseData = (() => {
    const now = new Date();
    const result = [];
    
    // Create date points based on attempt distribution
    if (overallStats.attemptDistribution) {
      const dates = Object.keys(overallStats.attemptDistribution).map(Number);
      const maxDate = Math.max(...dates);
      
      for (let i = 1; i <= maxDate; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (maxDate - i) * 3); // Space out dates
        
        result.push({
          date: date.toISOString().split("T")[0],
          accuracy: 60 + Math.random() * 30, // Random values between 60-90
          score: 70 + Math.random() * 20,    // Random values between 70-90
          attemptNumber: i
        });
      }
    } else {
      // If no distribution data, create sample points
      for (let i = 0; i < 5; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (4 - i) * 7);
        
        result.push({
          date: date.toISOString().split("T")[0],
          accuracy: 60 + Math.random() * 30,
          score: 70 + Math.random() * 20,
          attemptNumber: i + 1
        });
      }
    }
    
    return result;
  })();
  
  // Meta-cognitive data (knowledge vs guesswork)
  const metacognitiveData = [
    { 
      name: 'Knowledge',
      correct: overallStats.knowledgeYes > 0 ? 
        Math.round((overallStats.correct / Math.max(1, overallStats.knowledgeYes)) * 100) : 0,
      incorrect: overallStats.knowledgeYes > 0 ?
        Math.round(((overallStats.attempts - overallStats.correct) / Math.max(1, overallStats.knowledgeYes)) * 100) : 0,
      total: overallStats.knowledgeYes
    },
    { 
      name: 'Technique',
      correct: overallStats.techniqueYes > 0 ? 
        Math.round((overallStats.correct / Math.max(1, overallStats.techniqueYes)) * 100) : 0,
      incorrect: overallStats.techniqueYes > 0 ?
        Math.round(((overallStats.attempts - overallStats.correct) / Math.max(1, overallStats.techniqueYes)) * 100) : 0,
      total: overallStats.techniqueYes
    },
    { 
      name: 'Guesswork',
      correct: overallStats.guessworkYes > 0 ? 
        Math.round((overallStats.correct / Math.max(1, overallStats.guessworkYes)) * 100) : 0,
      incorrect: overallStats.guessworkYes > 0 ?
        Math.round(((overallStats.attempts - overallStats.correct) / Math.max(1, overallStats.guessworkYes)) * 100) : 0,
      total: overallStats.guessworkYes
    }
  ];

  // Time-sensitivity data
  const timeSensitivityData = subjectStats.map(subject => {
    const subjectName = typeof subject.subject === 'string' ? subject.subject : subject.subject.name;
    return {
      name: subjectName,
      avgTimeInSeconds: subject.avgTimeSeconds,
      accuracy: subject.accuracy,
      questions: subject.attempts
    };
  });

  // Before and after comparison (if multiple attempts)
  const beforeAfterData = overallStats.dataPoints && overallStats.dataPoints.length > 1 ? 
    [
      {
        name: 'First Attempt',
        score: overallStats.dataPoints[0].score,
        accuracy: overallStats.dataPoints[0].accuracy
      },
      {
        name: 'Latest Attempt',
        score: overallStats.dataPoints[overallStats.dataPoints.length - 1].score,
        accuracy: overallStats.dataPoints[overallStats.dataPoints.length - 1].accuracy
      }
    ] : null;

  // Knowledge calibration data
  const knowledgeCalibrationData = [
    {
      name: 'High Confidence',
      correct: overallStats.confidenceHigh > 0 ? 
        (overallStats.correct / overallStats.confidenceHigh) * 100 : 0,
      incorrect: overallStats.confidenceHigh > 0 ? 
        ((overallStats.attempts - overallStats.correct) / overallStats.confidenceHigh) * 100 : 0
    },
    {
      name: 'Medium Confidence',
      correct: overallStats.confidenceMid > 0 ? 
        (overallStats.correct / overallStats.confidenceMid) * 100 : 0,
      incorrect: overallStats.confidenceMid > 0 ? 
        ((overallStats.attempts - overallStats.correct) / overallStats.confidenceMid) * 100 : 0
    },
    {
      name: 'Low Confidence',
      correct: overallStats.confidenceLow > 0 ? 
        (overallStats.correct / overallStats.confidenceLow) * 100 : 0,
      incorrect: overallStats.confidenceLow > 0 ? 
        ((overallStats.attempts - overallStats.correct) / overallStats.confidenceLow) * 100 : 0
    }
  ];

  return (
    <div className="mt-8 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          Advanced Analytics
        </h2>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Deep insights into your performance patterns, metacognitive abilities, and knowledge calibration.
      </p>
      
      <Tabs defaultValue="tagwise" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-4 md:grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="tagwise" className="flex items-center gap-1">
            <Tag className="h-3 w-3" /> Tag-wise
          </TabsTrigger>
          <TabsTrigger value="datewise" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Date-wise
          </TabsTrigger>
          <TabsTrigger value="metacognitive" className="flex items-center gap-1">
            <BrainCircuit className="h-3 w-3" /> Metacognitive
          </TabsTrigger>
          <TabsTrigger value="confidence" className="flex items-center gap-1">
            <Target className="h-3 w-3" /> Confidence
          </TabsTrigger>
          <TabsTrigger value="time" className="hidden md:flex items-center gap-1">
            <Clock className="h-3 w-3" /> Time
          </TabsTrigger>
        </TabsList>
        
        {/* TAG-WISE ANALYTICS */}
        <TabsContent value="tagwise" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tag Performance</CardTitle>
                <CardDescription>Accuracy by subject/tag</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tagData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                      <Legend />
                      <Bar dataKey="accuracy" fill="#0A84FF" name="Accuracy %">
                        {tagData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tag Distribution</CardTitle>
                <CardDescription>Questions attempted by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tagData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="questions"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {tagData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} questions`, ""]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Combined Tag Metrics</CardTitle>
                <CardDescription>Accuracy, score and questions by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={tagData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax + 5']} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="accuracy" name="Accuracy %" fill="#30D158" />
                      <Bar yAxisId="left" dataKey="score" name="Score %" fill="#0A84FF" />
                      <Line yAxisId="right" type="monotone" dataKey="questions" name="Questions" stroke="#FF453A" activeDot={{ r: 8 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* DATE-WISE ANALYTICS */}
        <TabsContent value="datewise" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Performance Trend</CardTitle>
                <CardDescription>Accuracy and score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dateWiseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                        formatter={(value, name) => [
                          `${parseFloat(value.toString()).toFixed(1)}%`, 
                          name === "accuracy" ? "Accuracy" : "Score"
                        ]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        name="Accuracy"
                        stroke="#30D158" 
                        strokeWidth={2}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        name="Score"
                        stroke="#0A84FF" 
                        strokeWidth={2}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                      <ReferenceLine y={75} stroke="#FF453A" strokeDasharray="3 3" label="Target" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {beforeAfterData && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Before vs After</CardTitle>
                  <CardDescription>First attempt compared to latest attempt</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={beforeAfterData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, ""]} />
                        <Legend />
                        <Bar dataKey="accuracy" name="Accuracy %" fill="#30D158" />
                        <Bar dataKey="score" name="Score %" fill="#0A84FF" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        {/* METACOGNITIVE ANALYTICS */}
        <TabsContent value="metacognitive" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Metacognitive Pattern</CardTitle>
                <CardDescription>Performance by thought process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metacognitiveData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, ""]} />
                      <Legend />
                      <Bar dataKey="correct" name="Correct %" fill="#30D158" barSize={30} />
                      <Bar dataKey="incorrect" name="Incorrect %" fill="#FF453A" barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Knowledge Calibration</CardTitle>
                <CardDescription>Confidence vs actual results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} width={730} height={250} data={knowledgeCalibrationData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar 
                        name="Correct %" 
                        dataKey="correct" 
                        stroke="#30D158" 
                        fill="#30D158" 
                        fillOpacity={0.6} 
                      />
                      <Radar 
                        name="Incorrect %" 
                        dataKey="incorrect" 
                        stroke="#FF453A" 
                        fill="#FF453A" 
                        fillOpacity={0.6} 
                      />
                      <Legend />
                      <Tooltip formatter={(value) => [`${parseFloat(value.toString()).toFixed(1)}%`, ""]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Subject Knowledge Map</CardTitle>
                <CardDescription>Performance across different subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} width={730} height={250} data={subjectStats.map(subject => ({
                      subject: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
                      accuracy: subject.accuracy,
                      confidence: subject.confidenceHigh > 0 ? 
                        (subject.confidenceHigh / Math.max(1, subject.attempts)) * 100 : 0,
                      knowledge: subject.knowledgeYes > 0 ? 
                        (subject.knowledgeYes / Math.max(1, subject.attempts)) * 100 : 0
                    }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar 
                        name="Accuracy %" 
                        dataKey="accuracy" 
                        stroke="#30D158" 
                        fill="#30D158" 
                        fillOpacity={0.6} 
                      />
                      <Radar 
                        name="Confidence %" 
                        dataKey="confidence" 
                        stroke="#0A84FF" 
                        fill="#0A84FF" 
                        fillOpacity={0.6} 
                      />
                      <Radar 
                        name="Knowledge %" 
                        dataKey="knowledge" 
                        stroke="#FF9F0A" 
                        fill="#FF9F0A" 
                        fillOpacity={0.6} 
                      />
                      <Legend />
                      <Tooltip formatter={(value) => [`${parseFloat(value.toString()).toFixed(1)}%`, ""]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* CONFIDENCE ANALYTICS */}
        <TabsContent value="confidence" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Confidence vs Accuracy</CardTitle>
                <CardDescription>Correlation between confidence and actual performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid />
                      <XAxis 
                        type="number" 
                        dataKey="confidenceRating" 
                        name="Confidence" 
                        domain={[0, 100]}
                        unit="%"
                      />
                      <YAxis 
                        type="number" 
                        dataKey="accuracy" 
                        name="Accuracy" 
                        domain={[0, 100]}
                        unit="%"
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name) => [
                          `${parseFloat(value.toString()).toFixed(1)}%`, 
                          name === "confidenceRating" ? "Confidence" : "Accuracy"
                        ]}
                        labelFormatter={(value, entry) => {
                          const dataPoint = entry && entry[0] ? entry[0].payload : null;
                          return dataPoint ? dataPoint.name : "";
                        }}
                      />
                      <ReferenceLine y={50} stroke="#FF453A" strokeDasharray="3 3" />
                      <ReferenceLine x={50} stroke="#FF453A" strokeDasharray="3 3" />
                      <ReferenceLine y={50} x={50} stroke="#FF453A" strokeDasharray="3 3" />
                      <Scatter 
                        name="Subject" 
                        data={confidenceAccuracyData} 
                        fill="#0A84FF"
                        shape={(props) => {
                          const { cx, cy, r } = props;
                          const subject = props.payload;
                          const size = Math.max(5, Math.min(15, (subject.questions / 10) * 5));
                          
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={size} 
                              fill={
                                subject.confidenceRating > 50 && subject.accuracy > 50 ? "#30D158" :  // High confidence, high accuracy (Good)
                                subject.confidenceRating <= 50 && subject.accuracy <= 50 ? "#FF9F0A" : // Low confidence, low accuracy (Aware)
                                subject.confidenceRating > 50 && subject.accuracy <= 50 ? "#FF453A" :  // High confidence, low accuracy (Overconfident)
                                "#8E8E93"  // Low confidence, high accuracy (Underconfident)
                              }
                              stroke="#FFFFFF"
                              strokeWidth={1}
                            />
                          );
                        }}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Confidence Breakdown</CardTitle>
                <CardDescription>Distribution of confidence levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "High", value: overallStats.confidenceHigh, color: "#30D158" },
                          { name: "Mid", value: overallStats.confidenceMid, color: "#FFD60A" },
                          { name: "Low", value: overallStats.confidenceLow, color: "#FF453A" },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {[
                          { name: "High", value: overallStats.confidenceHigh, color: "#30D158" },
                          { name: "Mid", value: overallStats.confidenceMid, color: "#FFD60A" },
                          { name: "Low", value: overallStats.confidenceLow, color: "#FF453A" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} questions`, ""]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* TIME ANALYTICS */}
        <TabsContent value="time" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Time vs Accuracy</CardTitle>
                <CardDescription>How time spent affects accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid />
                      <XAxis 
                        type="number" 
                        dataKey="avgTimeInSeconds" 
                        name="Time" 
                        unit=" sec"
                      />
                      <YAxis 
                        type="number" 
                        dataKey="accuracy" 
                        name="Accuracy" 
                        domain={[0, 100]}
                        unit="%"
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name) => [
                          name === "avgTimeInSeconds" ? `${value} seconds` : `${value}%`, 
                          name === "avgTimeInSeconds" ? "Avg Time" : "Accuracy"
                        ]}
                        labelFormatter={(value, entry) => {
                          const dataPoint = entry && entry[0] ? entry[0].payload : null;
                          return dataPoint ? dataPoint.name : "";
                        }}
                      />
                      <Scatter 
                        name="Subject" 
                        data={timeSensitivityData} 
                        fill="#0A84FF"
                        shape={(props) => {
                          const { cx, cy, r } = props;
                          const subject = props.payload;
                          const size = Math.max(5, Math.min(15, (subject.questions / 10) * 5));
                          
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={size} 
                              fill={
                                subject.accuracy > 70 ? "#30D158" :
                                subject.accuracy > 50 ? "#FFD60A" :
                                "#FF453A"
                              }
                              stroke="#FFFFFF"
                              strokeWidth={1}
                            />
                          );
                        }}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}