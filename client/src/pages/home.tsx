import { useState } from "react";
import { FileUploader } from "@/components/file-uploader";
import { TestList } from "@/components/test-list";
import { FormatInfo } from "@/components/format-info";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Cog, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useSettings } from "@/hooks/use-settings";
import { useUIState } from "@/hooks/use-ui-state";

export default function Home() {
  const { settings, updateSettings } = useSettings();
  const { updateUIState } = useUIState();
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    updateSettings({ theme: newTheme as "light" | "dark" });
  };

  // Open settings panel
  const openSettings = () => {
    updateUIState({ settingsPanelOpen: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-30 backdrop-blur bg-opacity-90 dark:bg-opacity-90">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          {/* Logo and Title */}
          <Logo />
          
          {/* Navigation and Controls */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleDarkMode}
            >
              {settings.theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
            
            {/* Settings Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={openSettings}
            >
              <Cog className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>
      
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
              <h3 className="text-lg font-semibold mb-4">Recent Tests</h3>
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
