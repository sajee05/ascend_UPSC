import { useSettings } from "@/hooks/use-settings";
import { useUIState } from "@/hooks/use-ui-state";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Cog, Moon, Sun, BookOpen, LineChart, History, ClipboardX } from "lucide-react"; // Added ClipboardX

export function Header() {
  const { settings, updateSettings } = useSettings();
  const { uiState, updateUIState } = useUIState(); // Get uiState to potentially close modal
  const [location, navigate] = useLocation();
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    updateSettings({ theme: newTheme as "light" | "dark" });
  };

  // Open settings panel
  const openSettings = () => {
    updateUIState({ settingsPanelOpen: true });
  };
  
  // Open history modal
  const openHistoryModal = () => {
    updateUIState({ historyModalOpen: true });
  };

  // Open wrongs modal (placeholder)
  const openWrongsModal = () => {
    // TODO: Update UI state to open the wrongs modal
    console.log("Open Wrongs Modal clicked"); // Placeholder action
    updateUIState({ wrongsModalOpen: true }); // Add wrongsModalOpen state later
  };

  return (
    <header className="bg-card border-b sticky top-0 z-30 backdrop-blur bg-opacity-90 dark:bg-opacity-90">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Logo and Title - Clickable to go home */}
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <Logo />
          </div>
        </Link>
        
        {/* Navigation and Controls */}
        <div className="flex items-center space-x-3">
          {/* Wrongs Button */}
          <Button
            variant="ghost"
            className="flex items-center gap-1"
            onClick={openWrongsModal}
          >
            <ClipboardX className="h-4 w-4" />
            <span className="hidden sm:inline">Wrongs</span>
          </Button>

          {/* History Button */}
          <Button
            variant="ghost"
            className="flex items-center gap-1"
            onClick={openHistoryModal}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
          
          {/* Navigation Links - Only show if not on the respective page */}
          {location !== "/questions" && (
            <Link href="/questions">
              <Button variant="ghost" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Questions</span>
              </Button>
            </Link>
          )}
          
          {location !== "/overall-analytics" && (
            <Link href="/overall-analytics">
              <Button variant="ghost" className="flex items-center gap-1">
                <LineChart className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            </Link>
          )}
          
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
  );
}