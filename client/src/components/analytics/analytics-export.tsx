import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubjectStats } from "@shared/schema";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import html2canvas from "html2canvas";
import {
  Download,
  Share2,
  Image,
  FileImage,
  Share,
  Sparkles,
  Camera,
  FileDown,
  FileType,
  FileSpreadsheet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV, generateCSV, generateFileName } from "@/lib/utils";

interface AnalyticsExportProps {
  testTitle: string;
  testDate: string;
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
}

export function AnalyticsExport({ testTitle, testDate, overallStats, subjectStats }: AnalyticsExportProps) {
  const [exportType, setExportType] = useState<string>("infographic");
  const exportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Function to export performance data as CSV
  const handleExportCSV = () => {
    try {
      // Format the data for CSV export
      // First, prepare the overall statistics
      const overallData = {
        "Test Title": testTitle,
        "Test Date": new Date(testDate).toLocaleDateString(),
        "Overall Accuracy": `${overallStats.accuracy.toFixed(1)}%`,
        "Overall Score": overallStats.score,
        "Total Questions": overallStats.attempts,
        "Correct Answers": overallStats.correct,
        "Average Time": `${overallStats.avgTimeSeconds.toFixed(1)} sec`
      };
      
      // Create CSV header for overall data
      let csvData = "OVERALL PERFORMANCE\n";
      for (const [key, value] of Object.entries(overallData)) {
        csvData += `${key},${value}\n`;
      }
      csvData += "\n\n";
      
      // Add metacognitive data
      csvData += "METACOGNITIVE ANALYSIS\n";
      csvData += "Type,Percentage\n";
      
      const knowledgePct = Math.round((overallStats.knowledgeYes / Math.max(1, overallStats.attempts)) * 100);
      const techniquePct = Math.round((overallStats.techniqueYes / Math.max(1, overallStats.attempts)) * 100);
      const guessworkPct = Math.round((overallStats.guessworkYes / Math.max(1, overallStats.attempts)) * 100);
      
      csvData += `Knowledge-based,${knowledgePct}%\n`;
      csvData += `Technique-based,${techniquePct}%\n`;
      csvData += `Guesswork,${guessworkPct}%\n\n\n`;
      
      // Add subject-wise data
      csvData += "SUBJECT-WISE PERFORMANCE\n";
      csvData += "Subject,Accuracy,Score,Questions,Correct,Incorrect,Average Time (sec)\n";
      
      subjectStats.forEach(subject => {
        const subjectName = typeof subject.subject === 'string' 
          ? subject.subject 
          : subject.subject.name;
          
        csvData += `${subjectName},${subject.accuracy.toFixed(1)}%,${subject.score},${subject.attempts},${subject.correct},${subject.incorrect},${subject.avgTimeSeconds.toFixed(1)}\n`;
      });
      
      // Create and trigger download
      const fileName = `${testTitle.replace(/\s+/g, '-').toLowerCase()}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Export Successful",
        description: `Data exported to ${fileName}`,
      });
    } catch (error) {
      console.error("CSV export failed:", error);
      toast({
        title: "Export Failed",
        description: "Could not export data to CSV. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to generate and download the infographic
  const handleExportInfographic = async () => {
    if (!exportRef.current) return;
    
    toast({
      title: "Preparing export...",
      description: "Creating your infographic, please wait.",
    });
    
    try {
      const element = exportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#121212' : '#ffffff',
        logging: false, // Set to true for debugging
        allowTaint: true,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${testTitle.replace(/\s+/g, '-').toLowerCase()}-performance-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
      
      toast({
        title: "Export successful!",
        description: "Your infographic has been downloaded.",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "Could not generate the infographic. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to share the infographic (if supported)
  const handleShareInfographic = async () => {
    if (!exportRef.current) return;
    
    if (!navigator.share) {
      toast({
        title: "Sharing not supported",
        description: "Your browser doesn't support the Web Share API. Please export and share manually.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const element = exportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#121212' : '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const blob = await (await fetch(imgData)).blob();
      const file = new File([blob], `${testTitle}-performance.png`, { type: 'image/png' });
      
      await navigator.share({
        title: `${testTitle} Performance Report`,
        text: 'Check out my UPSC exam performance!',
        files: [file]
      });
      
      toast({
        title: "Shared successfully!",
        description: "Your infographic has been shared.",
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      
      // If error is AbortError, user canceled share
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: "Sharing canceled",
          description: "You canceled the share operation.",
        });
      } else {
        toast({
          title: "Sharing failed",
          description: "Could not share the infographic. Please try downloading instead.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileImage className="h-6 w-6 text-primary" />
          Shareable Analytics
        </h2>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Generate shareable infographics and reports to track your progress over time.
      </p>
      
      <Tabs defaultValue="infographic" value={exportType} onValueChange={setExportType} className="mb-4">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="infographic" className="flex items-center gap-1">
            <Image className="h-3 w-3" /> Infographic
          </TabsTrigger>
          <TabsTrigger value="snapshot" className="flex items-center gap-1">
            <FileImage className="h-3 w-3" /> Performance Snapshot
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1">
            <FileSpreadsheet className="h-3 w-3" /> Data Export
          </TabsTrigger>
        </TabsList>
        
        {/* INFOGRAPHIC EXPORT */}
        <TabsContent value="infographic" className="mt-4">
          <div className="grid grid-cols-1 gap-6">
            <div className="border p-4 rounded-lg">
              <div 
                ref={exportRef} 
                className="bg-white dark:bg-slate-900 p-6 rounded-lg overflow-hidden"
                style={{ maxWidth: "1000px", margin: "0 auto" }}
              >
                {/* Infographic Header */}
                <div className="text-center mb-8 border-b pb-6">
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    {testTitle} - Performance Report
                  </h2>
                  <p className="text-muted-foreground">
                    {new Date(testDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                {/* Overall Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-semibold">Accuracy</h3>
                    <div className="text-3xl font-bold mt-2">
                      {overallStats.accuracy.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-semibold">Score</h3>
                    <div className="text-3xl font-bold mt-2">
                      {overallStats.score}
                    </div>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-semibold">Time</h3>
                    <div className="text-3xl font-bold mt-2">
                      {Math.round(overallStats.avgTimeSeconds)} sec
                    </div>
                  </div>
                </div>
                
                {/* Subject Performance Bar Chart */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-center">Subject Performance</h3>
                  <div className="space-y-4">
                    {subjectStats
                      .sort((a, b) => b.accuracy - a.accuracy)
                      .slice(0, 5)
                      .map((subject, index) => {
                        const subjectName = typeof subject.subject === 'string' 
                          ? subject.subject 
                          : subject.subject.name;
                          
                        const barColors = [
                          'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 
                          'bg-amber-500', 'bg-red-500'
                        ];
                        
                        return (
                          <div key={index} className="rounded-lg overflow-hidden">
                            <div className="flex items-center mb-1">
                              <span className="font-medium truncate w-24 mr-2">{subjectName}</span>
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                                <div 
                                  className={`h-full ${barColors[index % barColors.length]}`}
                                  style={{ width: `${subject.accuracy}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 w-16 text-right">{subject.accuracy.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
                
                {/* Metacognitive Analysis */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-center">Metacognitive Analysis</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 text-center">
                      <h4 className="text-sm font-medium mb-2">Knowledge-based</h4>
                      <div className="text-2xl font-bold">
                        {Math.round((overallStats.knowledgeYes / Math.max(1, overallStats.attempts)) * 100)}%
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <h4 className="text-sm font-medium mb-2">Technique-based</h4>
                      <div className="text-2xl font-bold">
                        {Math.round((overallStats.techniqueYes / Math.max(1, overallStats.attempts)) * 100)}%
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <h4 className="text-sm font-medium mb-2">Guesswork</h4>
                      <div className="text-2xl font-bold">
                        {Math.round((overallStats.guessworkYes / Math.max(1, overallStats.attempts)) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Key Insights */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI-Generated Insights
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      {overallStats.accuracy > 70 
                        ? "Excellent accuracy! Focus on maintaining your knowledge while increasing speed."
                        : overallStats.accuracy > 50
                        ? "Good performance, but look for opportunities to improve accuracy further."
                        : "Focus on building fundamental knowledge in weaker subjects."
                      }
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      {overallStats.avgTimeSeconds < 60
                        ? "Your speed is excellent, keep maintaining this pace."
                        : overallStats.avgTimeSeconds < 90
                        ? "Good answering speed, but could be improved with more practice."
                        : "Work on improving your answer speed through regular timed practice."
                      }
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      {overallStats.confidenceHigh > (overallStats.attempts * 0.7)
                        ? "High confidence levels show good knowledge assessment."
                        : "Work on building confidence through targeted practice."
                      }
                    </li>
                  </ul>
                </div>
                
                {/* Footer */}
                <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
                  <p>Generated by Ascend UPSC • {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                onClick={handleExportInfographic}
                className="gap-2"
              >
                <Download className="h-4 w-4" /> Export as Image
              </Button>
              <Button 
                onClick={handleShareInfographic}
                className="gap-2"
                variant="outline"
              >
                <Share2 className="h-4 w-4" /> Share Infographic
              </Button>
            </div>
          </div>
        </TabsContent>
        
        {/* PERFORMANCE SNAPSHOT */}
        <TabsContent value="snapshot" className="mt-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Performance Snapshot</CardTitle>
                <CardDescription>Capture your current performance as an image</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 max-w-2xl mx-auto">
                  <Camera className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold">{testTitle}</h3>
                  <p className="text-muted-foreground mb-4">
                    {new Date(testDate).toLocaleDateString()}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="text-3xl font-bold">{overallStats.accuracy.toFixed(0)}%</div>
                      <div className="text-sm">Accuracy</div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="text-3xl font-bold">{overallStats.attempts}</div>
                      <div className="text-sm">Questions</div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="text-3xl font-bold">{Math.round(overallStats.avgTimeSeconds)}</div>
                      <div className="text-sm">Seconds/Q</div>
                    </div>
                  </div>
                  
                  <div className="text-left max-w-md mx-auto">
                    <h4 className="font-medium mb-2">Top subjects:</h4>
                    <ul className="space-y-1 mb-4">
                      {subjectStats
                        .sort((a, b) => b.accuracy - a.accuracy)
                        .slice(0, 3)
                        .map((subject, index) => {
                          const subjectName = typeof subject.subject === 'string' 
                            ? subject.subject 
                            : subject.subject.name;
                          
                          return (
                            <li key={index} className="flex justify-between">
                              <span>{subjectName}</span>
                              <span className="font-medium">{subject.accuracy.toFixed(0)}%</span>
                            </li>
                          );
                        })
                      }
                    </ul>
                    
                    <h4 className="font-medium mb-2">Focus areas:</h4>
                    <ul className="space-y-1">
                      {subjectStats
                        .sort((a, b) => a.accuracy - b.accuracy)
                        .slice(0, 2)
                        .map((subject, index) => {
                          const subjectName = typeof subject.subject === 'string' 
                            ? subject.subject 
                            : subject.subject.name;
                          
                          return (
                            <li key={index} className="flex justify-between">
                              <span>{subjectName}</span>
                              <span className="font-medium">{subject.accuracy.toFixed(0)}%</span>
                            </li>
                          );
                        })
                      }
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                <Button 
                  onClick={() => {
                    toast({
                      title: "Snapshot feature coming soon",
                      description: "This feature will be available in the next update.",
                    });
                  }}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" /> Take Snapshot
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => {
                    toast({
                      title: "Share feature coming soon",
                      description: "This feature will be available in the next update.",
                    });
                  }}
                >
                  <Share className="h-4 w-4" /> Share Results
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* DATA EXPORT */}
        <TabsContent value="data" className="mt-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Export Raw Performance Data</CardTitle>
                <CardDescription>Download your performance metrics as CSV for further analysis</CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <FileSpreadsheet className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-medium mb-2">CSV Data Export</h3>
                    <p className="text-muted-foreground mb-4">
                      Export your complete performance data in CSV format for analyzing in spreadsheet 
                      applications like Microsoft Excel or Google Sheets.
                    </p>
                    
                    <div className="border rounded-lg p-3 mb-4 text-left">
                      <h4 className="font-medium mb-2">Data included in export:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Overall performance metrics</li>
                        <li>Subject-wise detailed statistics</li>
                        <li>Metacognitive pattern analysis</li>
                        <li>Time performance data</li>
                        <li>Confidence-accuracy correlation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button 
                  onClick={handleExportCSV}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" /> Export as CSV
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}