import { SubjectStats } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Scatter,
  ScatterChart,
  ZAxis,
  ComposedChart,
  Line,
  Area,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ChartsProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
}

export function EnhancedCharts({ overallStats, subjectStats }: ChartsProps) {
  // Chart colors
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6384", "#36A2EB", "#FFCE56"];
  
  // Prepare data for subject accuracy chart - Sort to show highest accuracy first
  const subjectAccuracyData = [...subjectStats]
    .sort((a, b) => b.accuracy - a.accuracy)
    .map((subject) => ({
      name: subject.subject.length > 15 ? `${subject.subject.slice(0, 15)}...` : subject.subject,
      fullName: subject.subject,
      accuracy: Number(subject.accuracy.toFixed(2)),
      score: Number(subject.score.toFixed(2)),
      correct: subject.correct,
      incorrect: subject.incorrect,
      left: subject.left,
    }));
  
  // Prepare data for question completion pie chart
  const questionStatusData = [
    { name: "Correct", value: overallStats.correct, color: "#10B981" },
    { name: "Incorrect", value: overallStats.incorrect, color: "#EF4444" },
    { name: "Left", value: overallStats.left, color: "#6B7280" },
  ];
  
  // Prepare data for time analysis by subject (scatter plot)
  const timeAnalysisData = subjectStats.map((subject) => ({
    name: subject.subject,
    avgTime: subject.avgTimeSeconds,
    accuracy: subject.accuracy,
    efficiency: subject.avgTimeSeconds > 0 ? subject.accuracy / subject.avgTimeSeconds : 0,
    total: subject.attempts,
    correct: subject.correct,
  }));
  
  // Prepare data for meta-cognitive radar chart
  const metaCognitiveData = [
    {
      subject: "Overall",
      knowledge: overallStats.knowledgeYes,
      technique: overallStats.techniqueYes,
      guesswork: overallStats.guessworkYes,
      highConfidence: overallStats.confidenceHigh,
      midConfidence: overallStats.confidenceMid,
      lowConfidence: overallStats.confidenceLow,
    },
  ];
  
  // Normalize meta-cognitive data for radar chart
  const total = overallStats.attempts;
  const metaCognitiveRadarData = [
    { key: "Knowledge", value: Math.round((overallStats.knowledgeYes / total) * 100) },
    { key: "Technique", value: Math.round((overallStats.techniqueYes / total) * 100) },
    { key: "Guesswork", value: Math.round((overallStats.guessworkYes / total) * 100) },
    { key: "High Confidence", value: Math.round((overallStats.confidenceHigh / total) * 100) },
    { key: "Mid Confidence", value: Math.round((overallStats.confidenceMid / total) * 100) },
    { key: "Low Confidence", value: Math.round((overallStats.confidenceLow / total) * 100) },
  ];
  
  // Calculate efficency index per subject (correct answers per unit time)
  const efficiencyData = subjectStats
    .filter(subject => subject.avgTimeSeconds > 0)
    .map(subject => ({
      name: subject.subject.length > 12 ? `${subject.subject.slice(0, 12)}...` : subject.subject,
      fullName: subject.subject,
      efficiency: Number(((subject.correct / subject.attempts) / subject.avgTimeSeconds * 100).toFixed(2)),
      accuracy: Number(subject.accuracy.toFixed(2)),
    }))
    .sort((a, b) => b.efficiency - a.efficiency);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
    >
      {/* Subject Performance Chart */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Subject Performance</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectAccuracyData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}${name === "accuracy" ? "%" : ""}`, 
                    name === "accuracy" ? "Accuracy" : "Score"
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.fullName;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar dataKey="accuracy" fill="#0088FE" name="Accuracy %" radius={[0, 4, 4, 0]} />
                <Bar dataKey="score" fill="#00C49F" name="Score" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Question Completion Status */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Question Completion Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={questionStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {questionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} questions`, ""]}
                  itemStyle={{ color: "#000" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Meta-Cognitive Analysis */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Meta-Cognitive Analysis</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} data={metaCognitiveRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="key" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Percentage"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip formatter={(value) => [`${value}%`, "Occurrence"]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Time vs. Accuracy Analysis */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Time vs. Accuracy Analysis</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey="avgTime" 
                  name="Avg. Time (sec)" 
                  domain={['dataMin', 'dataMax']}
                  label={{ value: 'Avg. Time (sec)', position: 'bottom' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="accuracy" 
                  name="Accuracy (%)" 
                  domain={[0, 100]}
                  label={{ value: 'Accuracy (%)', angle: -90, position: 'left' }}
                />
                <ZAxis dataKey="total" range={[40, 120]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [
                    name === "avgTime" 
                      ? `${value.toFixed(1)} sec` 
                      : `${value.toFixed(1)}%`,
                    name === "avgTime" ? "Avg. Time" : "Accuracy"
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.name;
                    }
                    return "";
                  }}
                />
                <Scatter 
                  name="Subjects" 
                  data={timeAnalysisData} 
                  fill="#8884d8"
                  shape="circle"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Learning Efficiency Index */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Learning Efficiency Index</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={efficiencyData}
                layout="vertical"
                margin={{ top: 20, right: 20, bottom: 20, left: 50 }}
              >
                <CartesianGrid stroke="#f5f5f5" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}${name === "accuracy" ? "%" : ""}`,
                    name === "accuracy" ? "Accuracy" : "Efficiency Index"
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.fullName;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar dataKey="efficiency" barSize={20} fill="#413ea0" />
                <Line type="monotone" dataKey="accuracy" stroke="#ff7300" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Confidence Distribution */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Confidence Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "High",
                    correct: overallStats.confidenceHigh > 0 ? 
                      Math.round((overallStats.knowledgeYes / overallStats.confidenceHigh) * 100) : 0,
                    incorrect: overallStats.confidenceHigh > 0 ? 
                      100 - Math.round((overallStats.knowledgeYes / overallStats.confidenceHigh) * 100) : 0,
                    total: overallStats.confidenceHigh,
                  },
                  {
                    name: "Medium",
                    correct: overallStats.confidenceMid > 0 ? 
                      Math.round((overallStats.techniqueYes / overallStats.confidenceMid) * 100) : 0,
                    incorrect: overallStats.confidenceMid > 0 ? 
                      100 - Math.round((overallStats.techniqueYes / overallStats.confidenceMid) * 100) : 0,
                    total: overallStats.confidenceMid,
                  },
                  {
                    name: "Low",
                    correct: overallStats.confidenceLow > 0 ? 
                      Math.round((overallStats.guessworkYes / overallStats.confidenceLow) * 100) : 0,
                    incorrect: overallStats.confidenceLow > 0 ? 
                      100 - Math.round((overallStats.guessworkYes / overallStats.confidenceLow) * 100) : 0,
                    total: overallStats.confidenceLow,
                  }
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value}%`, 
                    name === "correct" ? "Correct" : "Incorrect"
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `${label} Confidence (${payload[0].payload.total} answers)`;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar dataKey="correct" stackId="a" fill="#4ade80" name="Correct" />
                <Bar dataKey="incorrect" stackId="a" fill="#f87171" name="Incorrect" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}