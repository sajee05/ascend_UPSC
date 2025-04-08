import React, { useRef, useState, useEffect } from 'react';
import { SubjectStats } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Share2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart4,
  PieChart,
  Award,
  Lightbulb,
  Zap
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/use-settings';

interface InfographicGeneratorProps {
  testTitle?: string;
  testDate?: string;
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
  isOverall?: boolean;
}

export function InfographicGenerator({ 
  testTitle, 
  testDate, 
  overallStats, 
  subjectStats,
  isOverall = false
}: InfographicGeneratorProps) {
  const infographicRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { settings } = useSettings();
  const isDarkMode = settings.theme === 'dark';
  
  // Prepare data for overview pie chart
  const overviewData = [
    { name: "Correct", value: overallStats.correct, color: "#4ade80" },
    { name: "Incorrect", value: overallStats.incorrect, color: "#f87171" },
    { name: "Left", value: overallStats.left || 0, color: "#94a3b8" },
  ];

  // Prepare data for subject performance bar chart
  const subjectPerformanceData = subjectStats
    .slice(0, 6) // Limit to top 6 subjects for readability
    .sort((a, b) => b.accuracy - a.accuracy)
    .map(subject => ({
      name: typeof subject.subject === 'string' 
        ? (subject.subject.length > 10 ? `${subject.subject.slice(0, 10)}...` : subject.subject)
        : (subject.subject.name.length > 10 ? `${subject.subject.name.slice(0, 10)}...` : subject.subject.name),
      fullName: typeof subject.subject === 'string' ? subject.subject : subject.subject.name,
      percentage: subject.accuracy,
      correct: subject.correct,
      incorrect: subject.incorrect,
      left: subject.left || 0,
    }));

  // Calculate overall percentage
  const overallPercentage = Math.round(overallStats.correct / 
    (overallStats.correct + overallStats.incorrect + (overallStats.left || 0)) * 100) || 0;
  
  // Generate a timestamp for the filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Generate filename based on test title or overall analytics
  const getFileName = () => {
    if (isOverall) {
      return `Ascend-UPSC-Overall-Analytics-${timestamp}.png`;
    } else {
      const sanitizedTitle = (testTitle || 'Test').replace(/[^a-z0-9]/gi, '-');
      return `Ascend-UPSC-${sanitizedTitle}-${timestamp}.png`;
    }
  };

  // Handle the export of the infographic as an image
  const handleExport = async () => {
    if (!infographicRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(infographicRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', // Match the card background
      });
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }
        
        // Create download link
        const link = document.createElement('a');
        link.download = getFileName();
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        
        toast({
          title: 'Infographic Exported',
          description: 'Your analytics infographic has been downloaded.',
          duration: 3000,
        });
      });
    } catch (error) {
      console.error('Error generating infographic:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate the infographic. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle sharing the infographic
  const handleShare = async () => {
    if (!infographicRef.current || !navigator.share) {
      toast({
        title: 'Sharing not supported',
        description: 'Your browser does not support the Web Share API. Please use the export option instead.',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(infographicRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      });
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }
        
        // Create shareable file
        const file = new File([blob], getFileName(), { type: 'image/png' });
        
        // Share the file
        try {
          await navigator.share({
            title: isOverall ? 'UPSC Study Analytics' : `UPSC Test Results: ${testTitle}`,
            text: isOverall ? 'My overall UPSC study progress.' : `My results from ${testTitle} test.`,
            files: [file]
          });
          
          toast({
            title: 'Shared Successfully',
            description: 'Your analytics infographic has been shared.',
            duration: 3000,
          });
        } catch (shareError) {
          console.error('Error sharing:', shareError);
          toast({
            title: 'Sharing Failed',
            description: 'Failed to share the infographic. You might need to grant permission.',
            variant: 'destructive',
            duration: 5000,
          });
        }
      });
    } catch (error) {
      console.error('Error generating infographic for sharing:', error);
      toast({
        title: 'Sharing Failed',
        description: 'Failed to generate the infographic for sharing. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart4 className="h-5 w-5 text-primary" />
          {isOverall ? 'Overall Analytics Infographic' : 'Test Results Infographic'}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isGenerating}
            className="flex items-center gap-1"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            disabled={isGenerating}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Infographic Preview */}
      <Card className="p-6 overflow-hidden" ref={infographicRef}>
        {/* Header */}
        <div className="border-b pb-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">🇮🇳</span>
              <h1 className="text-2xl font-bold">Ascend UPSC</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </div>
          </div>
          <h2 className="text-xl font-semibold">
            {isOverall ? 'Overall Study Analytics' : `Test Performance: ${testTitle}`}
          </h2>
          {testDate && !isOverall && (
            <p className="text-sm text-muted-foreground">
              Test Date: {new Date(testDate).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </p>
          )}
        </div>
        
        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Correct Answers</p>
            <p className="text-2xl font-bold">{overallStats.correct}</p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-2">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">Incorrect Answers</p>
            <p className="text-2xl font-bold">{overallStats.incorrect}</p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 mb-2">
              <Award className="h-6 w-6 text-secondary" />
            </div>
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <p className="text-2xl font-bold">{overallPercentage}%</p>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Overview Pie Chart */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={overviewData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {overviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} questions`, '']} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Subject Performance Bar Chart */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectPerformanceData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Accuracy %', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }} 
                  />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      if (name === 'percentage') return [`${value}%`, 'Accuracy'];
                      return [value, name];
                    }}
                    labelFormatter={(label, items) => {
                      const item = items[0]?.payload;
                      return item?.fullName || label;
                    }}
                  />
                  <Bar dataKey="percentage" name="percentage" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Key Insights */}
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Key Insights
          </h3>
          <ul className="space-y-2">
            {subjectPerformanceData.length > 0 && (
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <strong>{subjectPerformanceData[0].fullName}</strong> is your strongest subject with {subjectPerformanceData[0].percentage}% accuracy.
                </span>
              </li>
            )}
            {subjectPerformanceData.length > 1 && (
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>
                  Focus more on <strong>{subjectPerformanceData[subjectPerformanceData.length - 1].fullName}</strong> which has the lowest accuracy at {subjectPerformanceData[subjectPerformanceData.length - 1].percentage}%.
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
              <span>
                Your overall performance is <strong>{overallPercentage}%</strong> with {overallStats.correct} correct answers out of {overallStats.correct + overallStats.incorrect + (overallStats.left || 0)} questions.
              </span>
            </li>
            {(overallStats.left || 0) > 0 && (
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>
                  You left <strong>{overallStats.left}</strong> questions unanswered ({Math.round((overallStats.left || 0) / (overallStats.correct + overallStats.incorrect + (overallStats.left || 0)) * 100)}%). Consider improving your time management.
                </span>
              </li>
            )}
          </ul>
        </div>
        
        {/* Footer */}
        <div className="text-xs text-center text-muted-foreground pt-4 border-t">
          <p>Generated with Ascend UPSC - Your AI-powered study companion</p>
        </div>
      </Card>
    </div>
  );
}