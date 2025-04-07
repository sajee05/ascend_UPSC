import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SubjectStats } from "@shared/schema";

interface AttemptTrackingProps {
  stats: SubjectStats;
}

const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336'];

// Helper function to prepare data for the charts
function prepareAttemptData(stats: SubjectStats) {
  // Prepare data for the read distribution chart (bar chart)
  const attemptDistributionData = Object.entries(stats.attemptDistribution || {}).map(([key, value]) => ({
    name: `Read ${key}`,
    count: value,
  }));

  // Prepare data for the correct answers by read number (pie chart)
  const correctByAttemptData = [
    { name: '1st Read', value: stats.firstAttemptCorrect },
    { name: '2nd Read', value: stats.secondAttemptCorrect },
    { name: '3rd+ Read', value: stats.thirdPlusAttemptCorrect },
  ];

  return {
    attemptDistributionData,
    correctByAttemptData,
  };
}

export function AttemptTrackingCharts({ stats }: AttemptTrackingProps) {
  const { attemptDistributionData, correctByAttemptData } = prepareAttemptData(stats);

  // Calculate totals for percentages
  const totalCorrect = stats.correct || 0;
  
  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalCorrect > 0 
        ? `${((data.value / totalCorrect) * 100).toFixed(1)}%` 
        : '0%';
      
      return (
        <div className="custom-tooltip bg-background p-2 border rounded-md shadow-md">
          <p className="font-medium">{`${data.name}: ${data.value}`}</p>
          <p>{`${percentage} of correct answers`}</p>
          <p className="text-xs text-muted-foreground">{data.name === '1st Read' ? 'Answered on first viewing' : 
             data.name === '2nd Read' ? 'Skipped once, answered on second viewing' : 
             'Required multiple skips before answering'}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reading Analysis</CardTitle>
        <CardDescription>
          Analysis of question readings and success rates based on read number
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie chart showing correct answers by read number */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium mb-2">Correct Answers by Read</h3>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={correctByAttemptData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => 
                    percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                  }
                >
                  {correctByAttemptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart showing read distribution */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium mb-2">Question Read Distribution</h3>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attemptDistributionData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2196f3" name="Number of Questions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Text summary of read data */}
        <div className="md:col-span-2 mt-4 p-3 bg-accent/30 rounded-md">
          <h3 className="text-sm font-medium mb-2">Reading Analysis Summary</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="font-medium">{stats.firstAttemptCorrect}</span> questions answered correctly on first read
              {totalCorrect > 0 && ` (${((stats.firstAttemptCorrect / totalCorrect) * 100).toFixed(1)}% of correct answers)`}
            </li>
            <li>
              <span className="font-medium">{stats.secondAttemptCorrect}</span> questions answered correctly on second read
              {totalCorrect > 0 && ` (${((stats.secondAttemptCorrect / totalCorrect) * 100).toFixed(1)}% of correct answers)`}
            </li>
            <li>
              <span className="font-medium">{stats.thirdPlusAttemptCorrect}</span> questions answered correctly on third or later reads
              {totalCorrect > 0 && ` (${((stats.thirdPlusAttemptCorrect / totalCorrect) * 100).toFixed(1)}% of correct answers)`}
            </li>
            {stats.attempts > 0 && (
              <li>
                Average number of reads before answering: <span className="font-medium">
                  {
                    (Object.entries(stats.attemptDistribution || {})
                      .reduce((sum, [key, value]) => sum + (parseInt(key) * value), 0) / 
                      stats.attempts
                    ).toFixed(1)
                  }
                </span>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}