import { Card, CardContent } from "@/components/ui/card";
import { SubjectStats } from "@shared/schema";
import { motion } from "framer-motion";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
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
  const metaCognitiveData = [
    { name: "Knowledge", yes: overallStats.knowledgeYes, no: overallStats.attempts - overallStats.knowledgeYes },
    { name: "Technique", yes: overallStats.techniqueYes, no: overallStats.attempts - overallStats.techniqueYes },
    { name: "Guesswork", yes: overallStats.guessworkYes, no: overallStats.attempts - overallStats.guessworkYes },
  ];

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
                <Tooltip />
                <Legend />
                <Bar dataKey="yes" name="Yes" stackId="a" fill="#30D158" />
                <Bar dataKey="no" name="No" stackId="a" fill="#FF453A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
