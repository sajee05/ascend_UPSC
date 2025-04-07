import React, { useState } from "react";
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import { formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface DateAnalysisChartProps {
  trendData: { date: string; accuracy: number; score: number }[];
}

export function DateAnalysisChart({ trendData }: DateAnalysisChartProps) {
  const [timeRange, setTimeRange] = useState<"all" | "month" | "week">("all");
  const [viewType, setViewType] = useState<"line" | "area" | "combined">("area");
  
  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    if (timeRange === "all") return trendData;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeRange === "month") {
      cutoffDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === "week") {
      cutoffDate.setDate(now.getDate() - 7);
    }
    
    return trendData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  }, [trendData, timeRange]);

  // Calculate moving averages for smoother trend lines
  const dataWithAverages = React.useMemo(() => {
    if (filteredData.length < 3) return filteredData;
    
    const windowSize = 3; // 3-day moving average
    
    return filteredData.map((item, index) => {
      let accuracySum = 0;
      let scoreSum = 0;
      let count = 0;
      
      // Calculate average of windowSize items centered on current item
      for (let i = Math.max(0, index - Math.floor(windowSize/2)); 
           i <= Math.min(filteredData.length - 1, index + Math.floor(windowSize/2)); 
           i++) {
        accuracySum += filteredData[i].accuracy;
        scoreSum += filteredData[i].score;
        count++;
      }
      
      return {
        ...item,
        avgAccuracy: count > 0 ? accuracySum / count : item.accuracy,
        avgScore: count > 0 ? scoreSum / count : item.score
      };
    });
  }, [filteredData]);

  // Render the selected chart type
  const renderChart = () => {
    switch (viewType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dataWithAverages}
              margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => formatDate(value)}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                yAxisId="left" 
                domain={[0, 'dataMax']}
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
                  if (name === "accuracy" || name === "avgAccuracy") 
                    return [`${parseFloat(String(value)).toFixed(1)}%`, name === "avgAccuracy" ? "Avg Accuracy" : "Accuracy"];
                  return [parseFloat(String(value)).toFixed(1), name === "avgScore" ? "Avg Score" : "Score"];
                }}
                labelFormatter={(value: any) => formatDate(value)}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="score" 
                stroke="#8884d8" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
                name="Score"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="avgScore" 
                stroke="#8884d8" 
                strokeDasharray="5 5"
                strokeWidth={2}
                name="Avg Score"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="accuracy" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Accuracy"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgAccuracy" 
                stroke="#82ca9d"
                strokeDasharray="5 5" 
                strokeWidth={2}
                name="Avg Accuracy"
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dataWithAverages}
              margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
            >
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => formatDate(value)}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                yAxisId="left" 
                domain={[0, 'dataMax']}
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
                  if (name === "accuracy" || name === "avgAccuracy") 
                    return [`${parseFloat(String(value)).toFixed(1)}%`, name === "avgAccuracy" ? "Avg Accuracy" : "Accuracy"];
                  return [parseFloat(String(value)).toFixed(1), name === "avgScore" ? "Avg Score" : "Score"];
                }}
                labelFormatter={(value: any) => formatDate(value)}
              />
              <Legend />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="score" 
                stroke="#8884d8" 
                fillOpacity={1}
                fill="url(#colorScore)"
                name="Score"
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="accuracy" 
                stroke="#82ca9d" 
                fillOpacity={1}
                fill="url(#colorAccuracy)"
                name="Accuracy"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case "combined":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dataWithAverages}
              margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => formatDate(value)}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                yAxisId="left" 
                domain={[0, 'dataMax']}
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
                  if (name === "score") return [parseFloat(String(value)).toFixed(1), "Score"];
                  return [value, name];
                }}
                labelFormatter={(value: any) => formatDate(value)}
              />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="score" 
                barSize={20} 
                fill="#8884d8" 
                name="Score" 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="accuracy" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Accuracy"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgAccuracy" 
                stroke="#82ca9d"
                strokeDasharray="5 5" 
                strokeWidth={2}
                name="Avg Accuracy"
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
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
          <CardTitle>Time-based Performance Analysis</CardTitle>
          <CardDescription>Track your performance trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="time-range">Time Range</Label>
              <Select
                value={timeRange}
                onValueChange={(value) => setTimeRange(value as "all" | "month" | "week")}
              >
                <SelectTrigger id="time-range">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="view-type">Chart Type</Label>
              <Select
                value={viewType}
                onValueChange={(value) => setViewType(value as "line" | "area" | "combined")}
              >
                <SelectTrigger id="view-type">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="combined">Combined Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="h-80 w-full">
            {renderChart()}
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium">Insights:</p>
            <ul className="list-disc list-inside mt-2">
              <li>
                {timeRange === "all" 
                  ? "Viewing your entire performance history to identify long-term trends." 
                  : timeRange === "month" 
                    ? "Focused on your last month of activity to see recent progress."
                    : "Analyzing your most recent week to track immediate improvements."}
              </li>
              <li>
                {viewType === "line" 
                  ? "Line chart shows clear trends with moving averages (dotted lines) to smooth out day-to-day variations." 
                  : viewType === "area" 
                    ? "Area visualization highlights the magnitude of your performance metrics over time."
                    : "Combined view contrasts your raw scores (bars) with accuracy trends (lines)."}
              </li>
              <li>
                Look for upward trends in both accuracy and score to confirm consistent improvement in your test performance.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}