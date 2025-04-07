import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Flashcard } from "@/components/flashcard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/ui/logo";
import { Cog, Moon, Sun, Shuffle, Home, ArrowLeft, ArrowRight } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { useUIState } from "@/hooks/use-ui-state";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Flashcard as FlashcardType, QuestionWithTags } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

export default function FlashcardsPage() {
  const [, navigate] = useLocation();
  const { settings, updateSettings } = useSettings();
  const { updateUIState } = useUIState();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Flashcard state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filteredFlashcards, setFilteredFlashcards] = useState<(FlashcardType & { question: QuestionWithTags })[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Fetch flashcards
  const { data: flashcards, isLoading } = useQuery<(FlashcardType & { question: QuestionWithTags })[]>({
    queryKey: ["/api/flashcards"],
    onSuccess: (data) => {
      // Extract all unique subjects from question tags
      const subjects = new Set<string>();
      data.forEach(flashcard => {
        flashcard.question.tags.forEach(tag => {
          if (!tag.isAIGenerated) {
            subjects.add(tag.tagName);
          }
        });
      });
      setAvailableSubjects(Array.from(subjects));
      
      // Filter flashcards
      filterFlashcards(data, selectedSubject);
    }
  });

  // Filter flashcards by subject
  const filterFlashcards = (cards: (FlashcardType & { question: QuestionWithTags })[] | undefined, subject: string) => {
    if (!cards) return;
    
    if (subject === "all") {
      setFilteredFlashcards(cards);
    } else {
      const filtered = cards.filter(card => 
        card.question.tags.some(tag => tag.tagName === subject)
      );
      setFilteredFlashcards(filtered);
    }
    
    // Reset current index
    setCurrentIndex(0);
  };

  // Handle subject change
  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    filterFlashcards(flashcards, subject);
  };

  // Handle shuffle
  const handleShuffle = () => {
    if (!filteredFlashcards.length) return;
    
    const shuffled = [...filteredFlashcards].sort(() => Math.random() - 0.5);
    setFilteredFlashcards(shuffled);
    setCurrentIndex(0);
  };

  // Handle flashcard rating
  const handleRate = async (id: number, difficulty: "again" | "hard" | "good" | "easy") => {
    try {
      // Calculate new values based on the SM-2 spaced repetition algorithm
      const flashcard = flashcards?.find(f => f.id === id);
      if (!flashcard) return;
      
      let newEaseFactor = flashcard.easeFactor;
      let newInterval = flashcard.interval;
      
      switch(difficulty) {
        case "again":
          newInterval = 1; // Reset to 1 day
          newEaseFactor = Math.max(1.3, flashcard.easeFactor - 0.2);
          break;
        case "hard":
          newInterval = Math.ceil(flashcard.interval * flashcard.easeFactor * 0.8);
          newEaseFactor = Math.max(1.3, flashcard.easeFactor - 0.15);
          break;
        case "good":
          newInterval = Math.ceil(flashcard.interval * flashcard.easeFactor);
          break;
        case "easy":
          newInterval = Math.ceil(flashcard.interval * flashcard.easeFactor * 1.3);
          newEaseFactor = flashcard.easeFactor + 0.1;
          break;
      }
      
      const now = new Date();
      const nextReviewDate = new Date();
      nextReviewDate.setDate(now.getDate() + newInterval);
      
      // Update flashcard
      await apiRequest("PATCH", `/api/flashcards/${id}`, {
        lastReviewedAt: now.toISOString(),
        nextReviewAt: nextReviewDate.toISOString(),
        easeFactor: newEaseFactor,
        interval: newInterval,
        reviewCount: flashcard.reviewCount + 1,
      });
      
      // Move to next card
      handleNext();
      
      // Refresh flashcards data
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
    } catch (error) {
      console.error("Error rating flashcard:", error);
      toast({
        title: "Error",
        description: "Failed to update flashcard. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle next/previous navigation
  const handleNext = () => {
    if (!filteredFlashcards.length) return;
    
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= filteredFlashcards.length) {
        toast({
          title: "End of deck",
          description: "You've reached the end of your flashcards. Shuffling deck.",
        });
        setTimeout(handleShuffle, 500);
        return 0;
      }
      return nextIndex;
    });
  };

  const handlePrevious = () => {
    if (!filteredFlashcards.length) return;
    
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex - 1;
      if (nextIndex < 0) {
        return filteredFlashcards.length - 1;
      }
      return nextIndex;
    });
  };

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
          {/* Logo */}
          <Logo />
          
          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Home Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
            >
              <Home className="h-5 w-5" />
            </Button>
            
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
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-2">Flashcards</h2>
          <p className="text-muted-foreground mb-6">
            Review cards from previously incorrect answers using spaced repetition.
          </p>
          
          {/* Flashcard Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">
                      {filteredFlashcards.length} cards{filteredFlashcards.length > 0 ? ` • ${currentIndex + 1}/${filteredFlashcards.length}` : ''}
                    </span>
                    <Select 
                      value={selectedSubject} 
                      onValueChange={handleSubjectChange}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {availableSubjects.map(subject => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevious}
                      disabled={filteredFlashcards.length === 0}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNext}
                      disabled={filteredFlashcards.length === 0}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleShuffle}
                      disabled={filteredFlashcards.length === 0}
                    >
                      <Shuffle className="h-4 w-4 mr-2" /> Shuffle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Flashcard */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-muted-foreground">Loading flashcards...</p>
              </div>
            ) : filteredFlashcards.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    {flashcards && flashcards.length > 0 
                      ? "No flashcards found for the selected subject. Try selecting a different subject."
                      : "No flashcards available. Answer some questions incorrectly to create flashcards."}
                  </p>
                  <Button className="mt-4" onClick={() => navigate("/")}>
                    Upload a Test
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                key={`flashcard-${filteredFlashcards[currentIndex].id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Flashcard 
                  flashcard={filteredFlashcards[currentIndex]} 
                  onRate={handleRate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
