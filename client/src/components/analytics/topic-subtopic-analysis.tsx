import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
  Cell,
} from "recharts";
import { SubjectStats } from "@shared/schema";
import { SelectTrigger, SelectValue, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface TopicSubtopicAnalysisProps {
  subjectStats: SubjectStats[];
}

interface TopicData {
  name: string;
  value: number;
  subject?: string;
  accuracy?: number;
  count?: number;
  children?: TopicData[];
}

// Color scale for the treemap based on accuracy values
const getColor = (accuracy: number) => {
  if (accuracy >= 80) return "#4ade80"; // Good
  if (accuracy >= 60) return "#facc15"; // Medium
  if (accuracy >= 40) return "#fb923c"; // Fair
  return "#f87171"; // Needs improvement
};

// Helper function to parse tags into nested structure (Subject > Topic)
function parseTagsIntoHierarchy(subjectStats: SubjectStats[]): TopicData[] {
  const subjectMap: Record<string, {
    name: string;
    value: number;
    accuracy: number;
    count: number;
    children: Record<string, {
      name: string;
      value: number;
      accuracy: number;
      count: number;
    }>
  }> = {};

  // First pass: create the hierarchy structure
  subjectStats.forEach(subject => {
    if (!subjectMap[subject.subject]) {
      subjectMap[subject.subject] = {
        name: subject.subject,
        value: 0, // Will be calculated as sum of all topics
        accuracy: 0, // Will be calculated as weighted average
        count: 0, // Total number of questions
        children: {}
      };
    }

    // Extract topics from tags
    // Assuming tags have been organized in the format "Subject:Topic"
    // If not, this logic would need to be adjusted
    subjectMap[subject.subject].accuracy = subject.accuracy;
    subjectMap[subject.subject].count = subject.attempts;
    subjectMap[subject.subject].value = subject.attempts;
  });

  // Convert the map to the required array structure for the treemap
  const result: TopicData[] = Object.values(subjectMap).map(subject => ({
    name: subject.name,
    value: subject.value,
    accuracy: subject.accuracy,
    count: subject.count,
    children: Object.values(subject.children).map(topic => ({
      name: topic.name,
      value: topic.value,
      accuracy: topic.accuracy,
      count: topic.count
    }))
  }));

  return result;
}

export function TopicSubtopicAnalysis({ subjectStats }: TopicSubtopicAnalysisProps) {
  const [selectedView, setSelectedView] = useState<"treemap" | "horizontal">("treemap");

  // Process data for visualization
  const hierarchicalData = useMemo(() => {
    return parseTagsIntoHierarchy(subjectStats);
  }, [subjectStats]);

  // Prepare data for horizontal bar chart
  const subjectPerformanceData = useMemo(() => {
    return subjectStats
      .map(subject => ({
        name: subject.subject,
        accuracy: subject.accuracy,
        score: subject.score * 100, // Scale to 0-100
        correct: subject.correct,
        incorrect: subject.incorrect,
        left: subject.left,
        attempts: subject.attempts
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
  }, [subjectStats]);

  // Custom tooltip for treemap
  const CustomTreemapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip bg-background p-2 border rounded-md shadow-md">
          <p className="font-medium">{data.name}</p>
          <p>Accuracy: {data.accuracy?.toFixed(1)}%</p>
          <p>Questions: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full mb-8"
    >
      <Card>
        <CardHeader>
          <CardTitle>Subject & Topic Analysis</CardTitle>
          <CardDescription>Visualize performance across subjects and topics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Tabs
              defaultValue="treemap"
              value={selectedView}
              onValueChange={(value) => setSelectedView(value as "treemap" | "horizontal")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="treemap">Hierarchical View</TabsTrigger>
                <TabsTrigger value="horizontal">Subject Breakdown</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {selectedView === "treemap" && (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={hierarchicalData}
                  dataKey="value"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  fill="#8884d8"
                >
                  {hierarchicalData.map((subject, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getColor(subject.accuracy || 0)}
                    />
                  ))}
                  <Tooltip content={<CustomTreemapTooltip />} />
                </Treemap>
              </ResponsiveContainer>
              <div className="flex justify-center mt-4 space-x-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#4ade80] mr-2"></div>
                  <span className="text-xs">Excellent (80%+)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#facc15] mr-2"></div>
                  <span className="text-xs">Good (60-80%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#fb923c] mr-2"></div>
                  <span className="text-xs">Fair (40-60%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#f87171] mr-2"></div>
                  <span className="text-xs">Needs Work (&lt;40%)</span>
                </div>
              </div>
            </div>
          )}

          {selectedView === "horizontal" && (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectPerformanceData}
                  layout="vertical"
                  margin={{ top: 20, right: 40, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 'dataMax']} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => {
                      if (name === "accuracy") return [`${parseFloat(String(value)).toFixed(1)}%`, "Accuracy"];
                      if (name === "correct") return [value, "Correct"];
                      if (name === "incorrect") return [value, "Incorrect"];
                      if (name === "left") return [value, "Left"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Subject: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="correct" stackId="a" fill="#4ade80" name="Correct" />
                  <Bar dataKey="incorrect" stackId="a" fill="#f87171" name="Incorrect" />
                  <Bar dataKey="left" stackId="a" fill="#93c5fd" name="Left" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium">Key Insights:</p>
            <ul className="list-disc list-inside mt-2">
              <li>
                {selectedView === "treemap" 
                  ? "The size of each block represents the number of questions in that subject." 
                  : "The length of each bar shows the total number of questions attempted per subject."}
              </li>
              <li>
                {selectedView === "treemap"
                  ? "Color indicates performance level - green for excellent, yellow for good, orange for fair, and red for areas needing improvement."
                  : "The stacked bars show your performance breakdown - green for correct answers, red for incorrect, and blue for unattempted questions."}
              </li>
              <li>
                Focus your studies on subjects with larger red portions or lower overall accuracy to maximize improvement.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}