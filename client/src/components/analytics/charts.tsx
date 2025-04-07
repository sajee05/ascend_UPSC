import { Card, CardContent } from "@/components/ui/card";
import { SubjectStats } from "@shared/schema";
import { motion } from "framer-motion";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, 
  ScatterChart, Scatter, Area, AreaChart, ComposedChart
} from "recharts";

interface ChartsProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
}

export function Charts({ overallStats, subjectStats }: ChartsProps) {
  // Data for overall results pie chart
  const overallData = [
    { name: "Correct", value: overallStats.correct, color: "#30D158" },
    { name: "Incorrect", value: overallStats.incorrect, color: "#FF453A" },
    { name: "Left", value: overallStats.left, color: "#8E8E93" },
  ];

  // Data for subject accuracy bar chart
  const subjectAccuracyData = subjectStats.map(subject => ({
    name: subject.subject,
    accuracy: parseFloat(subject.accuracy.toFixed(1)),
    color: "#0A84FF",
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
  const radarData = subjectStats.map(subject => {
    const data = {
      subject: subject.subject,
      accuracy: parseFloat(subject.accuracy.toFixed(1)),
      score: parseFloat((subject.score * 10).toFixed(1)),
      speed: 100 - Math.min(100, parseFloat((subject.avgTimeSeconds / 2).toFixed(1))),
      confidence: parseFloat(((subject.confidenceHigh / Math.max(1, subject.attempts)) * 100).toFixed(1)),
      knowledge: parseFloat(((subject.knowledgeYes / Math.max(1, subject.attempts)) * 100).toFixed(1)),
    };
    return data;
  });
  
  // Data for subject comparison chart
  const subjectComparisonData = subjectStats.map(subject => ({
    name: subject.subject,
    accuracy: parseFloat(subject.accuracy.toFixed(1)),
    score: parseFloat((subject.score * 10).toFixed(1)),
    avgTime: parseFloat(subject.avgTimeSeconds.toFixed(0)),
    questions: subject.attempts,
  }));
  
  // Data for time-speed analysis
  const timeSpeedData = subjectStats.map(subject => ({
    name: subject.subject,
    avgTime: subject.avgTimeSeconds,
    accuracy: subject.accuracy,
    size: subject.attempts * 5, // Circle size proportional to number of questions
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
    >
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
                <Tooltip />
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
                data={subjectAccuracyData}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                <Bar dataKey="accuracy" fill="#0A84FF" radius={[0, 4, 4, 0]} />
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-2 text-sm">
            <div className="flex items-center mr-4">
              <span className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full mr-1"></span>
              <span>High: {Math.round((overallStats.confidenceHigh / overallStats.attempts) * 100)}%</span>
            </div>
            <div className="flex items-center mr-4">
              <span className="w-3 h-3 bg-amber-500 dark:bg-amber-400 rounded-full mr-1"></span>
              <span>Mid: {Math.round((overallStats.confidenceMid / overallStats.attempts) * 100)}%</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full mr-1"></span>
              <span>Low: {Math.round((overallStats.confidenceLow / overallStats.attempts) * 100)}%</span>
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
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value, 
                    name === "yes" ? "Yes" : name === "no" ? "No" : name === "percentage" ? "Percentage" : name
                  ]} 
                  labelFormatter={(label) => `${label} (${metaCognitiveData.find(d => d.name === label)?.percentage || 0}%)`}
                />
                <Legend />
                <Bar dataKey="yes" name="Yes" stackId="a" fill="#30D158" />
                <Bar dataKey="no" name="No" stackId="a" fill="#FF453A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Radar Chart: Subject Performance Analysis */}
      <Card className="md:col-span-2">
        <CardContent className="p-4">
          <h3 className="font-medium text-center mb-3">Subject Performance Analysis</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--foreground)' }} />
                <Radar name="Accuracy" dataKey="accuracy" stroke="#0A84FF" fill="#0A84FF" fillOpacity={0.6} />
                <Radar name="Score" dataKey="score" stroke="#30D158" fill="#30D158" fillOpacity={0.6} />
                <Radar name="Speed" dataKey="speed" stroke="#FF9F0A" fill="#FF9F0A" fillOpacity={0.6} />
                <Radar name="Confidence" dataKey="confidence" stroke="#BF5AF2" fill="#BF5AF2" fillOpacity={0.6} />
                <Radar name="Knowledge" dataKey="knowledge" stroke="#FF2D55" fill="#FF2D55" fillOpacity={0.6} />
                <Legend />
                <Tooltip 
                  formatter={(value) => [`${value}%`, ""]} 
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
      
      {/* Scatter Plot: Time vs Accuracy */}
      <Card className="md:col-span-1">
        <CardContent className="p-4">
          <h3 className="font-medium text-center mb-3">Time vs Accuracy</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="avgTime" name="Time (sec)" unit="s" />
                <YAxis type="number" dataKey="accuracy" name="Accuracy" unit="%" domain={[0, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Subjects" data={timeSpeedData} fill="#0A84FF">
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
        <CardContent className="p-4">
          <h3 className="font-medium text-center mb-3">Subject Comparison</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={subjectComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#0A84FF" />
                <YAxis yAxisId="right" orientation="right" stroke="#FF9F0A" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="accuracy" name="Accuracy (%)" fill="#0A84FF" />
                <Bar yAxisId="left" dataKey="score" name="Score (out of 100)" fill="#30D158" />
                <Line yAxisId="right" type="monotone" dataKey="avgTime" name="Avg Time (sec)" stroke="#FF9F0A" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
