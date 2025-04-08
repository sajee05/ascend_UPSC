import { useState, useRef, DragEvent, ChangeEvent, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseTestFile, convertParsedQuestions } from "@/lib/parser";
import { InsertQuestion, InsertTest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { CloudUploadIcon, FileIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  }, []);

  const handleFileSelection = (file: File) => {
    if (file.type !== "text/plain") {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt file",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
  };

  const handleBrowseClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [fileInputRef]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Read file content
      const fileContent = await selectedFile.text();
      
      console.log("File content length:", fileContent.length);
      console.log("First 100 chars:", fileContent.substring(0, 100));
      
      // Parse the file
      const parseResult = parseTestFile(fileContent);
      
      if (!parseResult.success) {
        toast({
          title: "Parsing Error",
          description: parseResult.errorMessage || "Failed to parse the file",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }
      
      console.log("Successfully parsed questions:", parseResult.questions.length);
      
      // Create test in database
      const testData: InsertTest = {
        filename: selectedFile.name,
        title: selectedFile.name.replace(".txt", ""),
        questionCount: parseResult.questions.length,
      };
      
      // Upload test data
      try {
        const testResponse = await apiRequest("POST", "/api/tests", testData);
        
        if (!testResponse.ok) {
          const errorData = await testResponse.json();
          throw new Error(`API error: ${errorData.message || testResponse.statusText}`);
        }
        
        const test = await testResponse.json();
        
        // Convert parsed questions to the format expected by the database
        // For large question sets, split into batches of 50 questions
        const BATCH_SIZE = 50;
        const allQuestions = convertParsedQuestions(test.id, parseResult.questions);
        let uploadedCount = 0;
        
        // Process in batches to avoid payload size issues
        for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
          const batch = allQuestions.slice(i, i + BATCH_SIZE);
          console.log(`Uploading batch ${i/BATCH_SIZE + 1} of ${Math.ceil(allQuestions.length/BATCH_SIZE)}, containing ${batch.length} questions`);
          
          // Upload questions
          const questionsResponse = await apiRequest("POST", "/api/questions", batch);
          
          if (!questionsResponse.ok) {
            const errorData = await questionsResponse.json();
            throw new Error(`API error while saving questions in batch ${i/BATCH_SIZE + 1}: ${errorData.message || questionsResponse.statusText}`);
          }
          
          uploadedCount += batch.length;
          
          // Update toast to show progress
          if (i + BATCH_SIZE < allQuestions.length) {
            toast({
              title: "Upload Progress",
              description: `Processed ${uploadedCount} of ${allQuestions.length} questions...`,
            });
          }
        }
        
        // Show success notification
        toast({
          title: "Upload Successful",
          description: `${parseResult.questions.length} questions parsed from ${selectedFile.name}`,
        });
        
        // Reset state and refresh tests list
        setSelectedFile(null);
        queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      } catch (apiError: any) {
        console.error("API error:", apiError);
        toast({
          title: "API Error",
          description: apiError.message || "Failed to save test data to the server",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload and process the file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, toast, queryClient]);

  return (
    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 transition-colors">
      <CardContent className="p-8 text-center">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center space-y-4 transition-all ${
            isDragging ? "scale-105 border-primary" : ""
          }`}
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {selectedFile ? (
              <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center">
                <FileIcon className="h-7 w-7 text-primary" />
              </div>
            ) : (
              <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center">
                <CloudUploadIcon className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
          </motion.div>
          
          <div>
            {selectedFile ? (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </motion.div>
            ) : (
              <>
                <p className="font-medium">Drag and drop your file here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              </>
            )}
          </div>
          
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {selectedFile ? (
              <Button 
                className="mt-2" 
                onClick={handleUpload} 
                disabled={isUploading}
              >
                {isUploading ? "Processing..." : "Upload and Parse"}
              </Button>
            ) : (
              <Button 
                className="mt-2" 
                variant="secondary" 
                onClick={handleBrowseClick}
              >
                Browse Files
              </Button>
            )}
          </motion.div>
          
          <p className="text-xs text-muted-foreground">
            Accepts .txt files with the specified tag format
          </p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept=".txt"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </CardContent>
    </Card>
  );
}
