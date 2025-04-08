import { useState } from "react";
import { FileUploader } from "@/components/file-uploader";
import { TestList } from "@/components/test-list";
import { FormatInfo } from "@/components/format-info";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-semibold mb-2">Upload Your Mock Test</h2>
              <p className="text-muted-foreground mb-8">
                Upload a properly formatted .txt file with #QuestionStart and #AnswerStart tags.
              </p>
            </motion.div>
            
            {/* File Upload Area */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <FileUploader />
            </motion.div>
            
            {/* Recently Parsed Tests */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Tests</h3>
                <Link href="/questions">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    Browse All Questions
                  </Button>
                </Link>
              </div>
              <TestList />
            </motion.div>
            
            {/* Format Information */}
            <FormatInfo />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
