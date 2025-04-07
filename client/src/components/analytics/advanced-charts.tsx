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
  Treemap,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface AdvancedChartsProps {
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
}

export function AdvancedCharts({ overallStats, subjectStats }: AdvancedChartsProps) {
  // Enhanced color palette
  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", 
    "#8884D8", "#FF6384", "#36A2EB", "#FFCE56",
    "#4BC0C0", "#9966FF", "#FF9F40", "#FF6384"
  ];
  
  // Prepare data for knowledge vs. results chart
  const knowledgeResultsData = [
    { 
      name: "Known & Correct", 
      value: subjectStats.reduce((sum, subject) => {
        // For each subject, add the number of questions where knowledge was claimed and answer was correct
        const knowledgeCorrect = Math.min(subject.knowledgeYes, subject.correct);
        return sum + knowledgeCorrect;
      }, 0),
      color: "#10B981"
    },
    { 
      name: "Known & Incorrect", 
      value: subjectStats.reduce((sum, subject) => {
        // Estimate of questions where knowledge was claimed but answer was incorrect
        const knowledgeIncorrect = Math.min(subject.knowledgeYes, subject.incorrect);
        return sum + knowledgeIncorrect;
      }, 0),
      color: "#F97316" 
    },
    { 
      name: "Unknown & Correct", 
      value: subjectStats.reduce((sum, subject) => {
        // Estimate of questions answered correctly without knowledge claim
        const unknownCorrect = Math.max(0, subject.correct - Math.min(subject.knowledgeYes, subject.correct));
        return sum + unknownCorrect;
      }, 0),
      color: "#60A5FA" 
    },
    { 
      name: "Unknown & Incorrect", 
      value: subjectStats.reduce((sum, subject) => {
        // Estimate of questions answered incorrectly without knowledge claim
        const unknownIncorrect = Math.max(0, subject.incorrect - Math.min(subject.knowledgeYes, subject.incorrect));
        return sum + unknownIncorrect;
      }, 0),
      color: "#F43F5E" 
    }
  ];
  
  // Prepare data for confidence vs. accuracy chart
  const confidenceAccuracyData = [
    {
      name: "High Confidence",
      correct: overallStats.confidenceHigh > 0 ? Math.round((overallStats.correct / Math.max(1, overallStats.confidenceHigh)) * 100) : 0,
      incorrect: overallStats.confidenceHigh > 0 ? 100 - Math.round((overallStats.correct / Math.max(1, overallStats.confidenceHigh)) * 100) : 0,
      total: overallStats.confidenceHigh
    },
    {
      name: "Medium Confidence",
      correct: overallStats.confidenceMid > 0 ? Math.round((overallStats.correct / Math.max(1, overallStats.confidenceMid)) * 100) : 0,
      incorrect: overallStats.confidenceMid > 0 ? 100 - Math.round((overallStats.correct / Math.max(1, overallStats.confidenceMid)) * 100) : 0,
      total: overallStats.confidenceMid
    },
    {
      name: "Low Confidence",
      correct: overallStats.confidenceLow > 0 ? Math.round((overallStats.correct / Math.max(1, overallStats.confidenceLow)) * 100) : 0,
      incorrect: overallStats.confidenceLow > 0 ? 100 - Math.round((overallStats.correct / Math.max(1, overallStats.confidenceLow)) * 100) : 0,
      total: overallStats.confidenceLow
    }
  ];
  
  // Prepare data for metacognitive radar chart
  const metaCognitiveData = [
    { 
      metric: "High Confidence Accuracy", 
      value: confidenceAccuracyData[0].correct, 
      fullMark: 100 
    },
    { 
      metric: "Knowledge & Correct", 
      value: overallStats.knowledgeYes > 0 ? 
        Math.round((Math.min(overallStats.knowledgeYes, overallStats.correct) / overallStats.knowledgeYes) * 100) : 0, 
      fullMark: 100 
    },
    { 
      metric: "Time Efficiency", 
      value: overallStats.avgTimeSeconds < 60 ? 
        Math.round(100 - (overallStats.avgTimeSeconds / 60) * 100) : 20, 
      fullMark: 100 
    },
    { 
      metric: "Technique Usage", 
      value: overallStats.attempts > 0 ? 
        Math.round((overallStats.techniqueYes / overallStats.attempts) * 100) : 0, 
      fullMark: 100 
    },
    { 
      metric: "Low Guesswork", 
      value: overallStats.attempts > 0 ? 
        Math.round(100 - (overallStats.guessworkYes / overallStats.attempts) * 100) : 0, 
      fullMark: 100 
    }
  ];
  
  // Prepare data for time vs accuracy scatter plot with all subjects
  const timeAccuracyData = subjectStats.map(subject => ({
    name: subject.subject,
    time: subject.avgTimeSeconds,
    accuracy: subject.accuracy,
    attempts: subject.attempts,
    size: Math.max(10, subject.attempts * 3) // Size based on number of attempts
  }));
  
  // Prepare presence of mind effectiveness data (a measure of not making careless mistakes)
  const presenceOfMindData = subjectStats.map(subject => {
    // Calculate a "presence of mind" score:
    // High if person has high confidence, claims knowledge, but doesn't get it right
    // (this suggests carelessness rather than lack of knowledge)
    const carelessnessScore = subject.confidenceHigh > 0 && subject.knowledgeYes > 0 ?
      100 - Math.min(100, Math.round(
        (Math.max(0, subject.confidenceHigh - subject.correct) / Math.max(1, subject.confidenceHigh)) * 100
      )) : 100;
      
    const subjectName = typeof subject.subject === 'string' 
      ? subject.subject 
      : subject.subject.name;
    
    return {
      name: subjectName.length > 10 ? `${subjectName.slice(0, 10)}...` : subjectName,
      fullName: subjectName,
      score: carelessnessScore,
      value: subject.attempts
    };
  }).sort((a, b) => a.score - b.score);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
    >
      {/* Knowledge vs. Results Chart */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Knowledge vs. Results</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={knowledgeResultsData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {knowledgeResultsData.map((entry, index) => (
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
      
      {/* Confidence vs. Accuracy */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Confidence vs. Accuracy</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={confidenceAccuracyData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `${value}%`, 
                    name === "correct" ? "Accuracy" : "Error Rate"
                  ]}
                  labelFormatter={(label) => `${label} (${confidenceAccuracyData.find(item => item.name === label)?.total || 0} questions)`}
                />
                <Legend />
                <Bar dataKey="correct" fill="#10B981" name="Accuracy" stackId="a" />
                <Bar dataKey="incorrect" fill="#F87171" name="Error Rate" stackId="a" />
              </BarChart>
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
              <RadarChart cx="50%" cy="50%" outerRadius={80} data={metaCognitiveData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--foreground)', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--foreground)' }} />
                <Radar
                  name="Meta-Cognitive Score"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, "Score"]}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Time vs. Accuracy */}
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
                  dataKey="time" 
                  name="Time (sec)" 
                  label={{ value: 'Avg. Time (sec)', position: 'bottom', offset: 5 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="accuracy" 
                  name="Accuracy (%)" 
                  domain={[0, 100]}
                  label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                />
                <ZAxis 
                  type="number"
                  range={[60, 400]}
                  dataKey="size"
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: any, name: any) => {
                    if (name === 'time') return [`${parseFloat(value).toFixed(1)} sec`, 'Avg. Time'];
                    if (name === 'accuracy') return [`${parseFloat(value).toFixed(1)}%`, 'Accuracy'];
                    return [value, name];
                  }}
                  labelFormatter={(value) => {
                    const data = timeAccuracyData.find(item => item.name === value);
                    return `${data?.name} (${data?.attempts} questions)`;
                  }}
                />
                <Scatter 
                  data={timeAccuracyData} 
                  fill="#8884d8" 
                  name="Subjects"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Presence of Mind Effectiveness */}
      <Card className="lg:col-span-2">
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Presence of Mind Effectiveness</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={presenceOfMindData}
                dataKey="value"
                nameKey="name"
                animationDuration={1000}
                aspectRatio={4 / 3}
                fill="#0A84FF"
              >
                <Tooltip 
                  content={({ payload }: any) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-md">
                          <p className="font-medium">{data.fullName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Presence of Mind: {data.score}%
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {data.value} questions attempted
                          </p>
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
    </motion.div>
  );
}