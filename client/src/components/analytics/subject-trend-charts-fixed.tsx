import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
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
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import { SubjectStats } from "@shared/schema";
import { SelectTrigger, SelectValue, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";

interface SubjectTrendChartsProps {
  trendData: { date: string; accuracy: number; score: number }[];
  subjectStats: SubjectStats[];
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#FF6384', '#36A2EB', '#4BC0C0', '#9966FF', '#FF9F40'
];

export function SubjectTrendCharts({ trendData, subjectStats }: SubjectTrendChartsProps) {
  const [selectedView, setSelectedView] = useState<"subject" | "topic" | "date">("subject");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Get unique subjects from subject stats
  const subjects = useMemo(() => {
    const uniqueSubjects: string[] = [];
    subjectStats.forEach(stat => {
      if (!uniqueSubjects.includes(stat.subject)) {
        uniqueSubjects.push(stat.subject);
      }
    });
    return uniqueSubjects;
  }, [subjectStats]);

  // Get unique topics from the subject stats
  const topics = useMemo(() => {
    const allTopics: string[] = [];
    
    subjectStats.forEach((subject) => {
      // Extract topics from tags (assuming they are in the format "Subject:Topic")
      Object.keys(subject.attemptDistribution || {}).forEach((key) => {
        if (key.includes(':')) {
          const topic = key.split(':')[1].trim();
          if (!allTopics.includes(topic)) {
            allTopics.push(topic);
          }
        }
      });
    });
    
    return allTopics;
  }, [subjectStats]);

  // Prepare subject-wise trend data
  const subjectTrendData = useMemo(() => {
    // Organize data by subject
    const subjectData: Record<string, {
      name: string;
      accuracy: number;
      score: number;
      attempts: number;
    }> = {};

    subjectStats.forEach((subject) => {
      if (selectedSubject === "all" || subject.subject === selectedSubject) {
        subjectData[subject.subject] = {
          name: subject.subject,
          accuracy: subject.accuracy,
          score: subject.score * 100, // Scale score to 0-100 for visualization
          attempts: subject.attempts,
        };
      }
    });

    return Object.values(subjectData).sort((a, b) => b.accuracy - a.accuracy);
  }, [subjectStats, selectedSubject]);

  // Prepare topic-wise trend data
  const topicTrendData = useMemo(() => {
    // Filter by selected subject if not "all"
    const filteredStats = selectedSubject === "all" 
      ? subjectStats 
      : subjectStats.filter(s => s.subject === selectedSubject);
    
    // Create a map of topics to their performance metrics
    const topicData: Record<string, {
      name: string;
      accuracy: number;
      score: number;
      attempts: number;
    }> = {};
    
    // Aggregate data for each topic
    filteredStats.forEach(subject => {
      // Logic to extract and aggregate topic data
      // This would depend on your data structure
      // For now, using a simplistic approach
      const topicPrefix = selectedSubject === "all" ? `${subject.subject}: ` : "";
      topicData[subject.subject] = {
        name: `${topicPrefix}${subject.subject}`,
        accuracy: subject.accuracy,
        score: subject.score * 100,
        attempts: subject.attempts
      };
    });
    
    return Object.values(topicData).sort((a, b) => b.accuracy - a.accuracy);
  }, [subjectStats, selectedSubject]);

  // Prepare date-wise trend data with subject filter
  const filteredTrendData = useMemo(() => {
    if (selectedSubject === "all") {
      return trendData;
    }

    // Here you would need to filter trendData by subject
    // This assumes trendData already contains subject information
    // If it doesn't, you'd need to modify your backend to provide this
    
    // For now, returning all trend data as a placeholder
    return trendData;
  }, [trendData, selectedSubject]);

  // Function to render the appropriate chart based on the selected view
  const renderChart = () => {
    switch (selectedView) {
      case "subject":
        return (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={subjectTrendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis yAxisId="left" label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Score', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value: any, name: any) => {
                  if (name === "accuracy") return [`${parseFloat(String(value)).toFixed(1)}%`, "Accuracy"];
                  if (name === "score") return [`${parseFloat(String(value)).toFixed(1)}`, "Score"];
                  if (name === "attempts") return [`${value}`, "Attempts"];
                  return [value, name];
                }} />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="accuracy" 
                  name="Accuracy (%)" 
                  fill="#0088FE" 
                  barSize={30} 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="score" 
                  name="Score" 
                  stroke="#FF8042" 
                  strokeWidth={2} 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="attempts" 
                  name="Attempts" 
                  stroke="#00C49F" 
                  strokeWidth={2} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      case "topic":
        return (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topicTrendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left" 
                  label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  label={{ value: 'Score', angle: 90, position: 'insideRight' }} 
                />
                <Tooltip formatter={(value: any, name: any) => {
                  if (name === "accuracy") return [`${parseFloat(String(value)).toFixed(1)}%`, "Accuracy"];
                  if (name === "score") return [`${parseFloat(String(value)).toFixed(1)}`, "Score"];
                  if (name === "attempts") return [`${value}`, "Attempts"];
                  return [value, name];
                }} />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="accuracy" 
                  name="Accuracy (%)" 
                  fill="#0088FE" 
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="score" 
                  name="Score" 
                  fill="#00C49F" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case "date":
        return (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredTrendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis 
                  yAxisId="left" 
                  label={{ value: 'Score', angle: -90, position: 'insideLeft' }} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[0, 100]} 
                  label={{ value: 'Accuracy (%)', angle: 90, position: 'insideRight' }} 
                />
                <Tooltip 
                  formatter={(value: any, name: any): [string, string] => {
                    if (name === "accuracy") return [`${parseFloat(String(value)).toFixed(1)}%`, "Accuracy"];
                    return [parseFloat(String(value)).toFixed(1), "Score"];
                  }}
                  labelFormatter={(value: any) => formatDate(value)}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="score" 
                  name="Score" 
                  fill="#0088FE" 
                  stroke="#0088FE"
                  fillOpacity={0.3}
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="accuracy" 
                  name="Accuracy (%)" 
                  fill="#00C49F" 
                  stroke="#00C49F"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return null;
    }
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
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Analyze your performance across different dimensions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="view-selector">View Dimension</Label>
              <Select
                value={selectedView}
                onValueChange={(value) => setSelectedView(value as "subject" | "topic" | "date")}
              >
                <SelectTrigger id="view-selector">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subject">Subject View</SelectItem>
                  <SelectItem value="topic">Topic View</SelectItem>
                  <SelectItem value="date">Date View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject-filter">Filter by Subject</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger id="subject-filter">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {renderChart()}
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium">Insights:</p>
            <ul className="list-disc list-inside mt-2">
              <li>
                {selectedView === "subject" && (
                  "Compare performance across different subjects to identify strengths and areas for improvement."
                )}
                {selectedView === "topic" && (
                  "Analyze specific topics within subjects to pinpoint knowledge gaps."
                )}
                {selectedView === "date" && (
                  "Track your progress over time to see improvement patterns and learning curves."
                )}
              </li>
              <li>
                {selectedSubject === "all" 
                  ? "Currently showing data for all subjects. Filter by a specific subject for more focused analysis."
                  : `Filtered to show performance data for ${selectedSubject}. Clear the filter to compare with other subjects.`}
              </li>
              <li>
                {selectedView === "subject" && "Higher bars indicate better performance in those subjects."}
                {selectedView === "topic" && "Focus your study on topics with lower scores for maximum improvement."}
                {selectedView === "date" && "Upward trends indicate positive learning progress."}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}