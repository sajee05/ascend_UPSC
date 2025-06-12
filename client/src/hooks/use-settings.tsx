import { createContext, useContext, useState, useEffect, useCallback } from "react";
// Assuming an apiRequest utility exists, similar to other parts of the app.
// If not, we'll use fetch directly. For now, let's assume it exists.
// import { apiRequest } from "@/lib/api"; // Placeholder, adjust if needed
import {
  DEFAULT_ANALYTICS_PROMPT,
  DEFAULT_EXPLANATION_PROMPT,
  DEFAULT_SUBJECT_TAGGING_PROMPT,
  DEFAULT_STUDY_PLAN_PROMPT,
  DEFAULT_LEARNING_PATTERN_PROMPT,
  DEFAULT_PARSING_PROMPT_TITLE
} from "@/lib/gemini";

interface Settings {
  theme: "light" | "dark" | "system";
  primaryColor: string;
  animations: boolean;
  aiEnabled: boolean;
  aiApiKey: string;
  aiModel: string;
  subjectTaggingAiModel: string;
  subjectTaggingPrompt: string;
  analyticsPrompt: string;
  explanationPrompt: string;
  studyPlanPrompt: string;
  learningPatternPrompt: string;
  parsingPromptTitle: string;
  // Removed databaseType and postgresConnectionString as SQLite is now the only option
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  theme: "light",
  primaryColor: "blue",
  animations: true,
  aiEnabled: true,
  aiApiKey: "",
  aiModel: "gemini-2.0-flash",
  subjectTaggingAiModel: "gemini-1.5-flash",
  subjectTaggingPrompt: DEFAULT_SUBJECT_TAGGING_PROMPT,
  analyticsPrompt: DEFAULT_ANALYTICS_PROMPT,
  explanationPrompt: DEFAULT_EXPLANATION_PROMPT,
  studyPlanPrompt: DEFAULT_STUDY_PLAN_PROMPT,
  learningPatternPrompt: DEFAULT_LEARNING_PATTERN_PROMPT,
  parsingPromptTitle: DEFAULT_PARSING_PROMPT_TITLE,
  // Removed databaseType and postgresConnectionString defaults
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings from API on initial load
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Using fetch directly as apiRequest is a placeholder
        const response = await fetch("/api/settings");
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.statusText}`);
        }
        const fetchedSettings = await response.json();
        setSettings(prevSettings => ({ ...prevSettings, ...fetchedSettings }));
      } catch (err) {
        console.error("Failed to fetch settings from API:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        // Keep default settings if fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);
  
  // This useEffect sets up color theme management
  useEffect(() => {
    // Define HSL colors for each primary color
    const colorMap: Record<string, string> = {
      "blue": "211 100% 50%",
      "purple": "270 80% 50%",
      "green": "142 70% 45%",
      "amber": "45 97% 50%",
      "red": "0 84% 60%"
    };
    
    // Set the CSS variable for the primary color based on settings
    if (settings.primaryColor && colorMap[settings.primaryColor]) {
      document.documentElement.style.setProperty('--primary', colorMap[settings.primaryColor]);
    }
    
    // Initialize system theme listener if the theme is set to system
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      };
      
      // Add event listener
      mediaQuery.addEventListener("change", handleChange);
      
      // Clean up
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }
  }, [settings.primaryColor, settings.theme]);

  useEffect(() => {
    // Apply theme when settings change or on initial load
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (settings.theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
 
    // Removed localStorage.setItem("ascend-upsc-settings", JSON.stringify(settings));
  }, [settings.theme]); // Only re-run if theme changes, primaryColor is handled in its own useEffect

  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    // Optimistically update local state
    setSettings(prev => ({ ...prev, ...newSettings }));

    try {
      // Using fetch directly
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update settings: ${response.statusText}`);
      }
      // Optionally, re-fetch or update local state with response from server
      // const savedSettings = await response.json();
      // setSettings(prev => ({ ...prev, ...savedSettings }));
      // For now, optimistic update is fine.
    } catch (err) {
      console.error("Failed to save settings to API:", err);
      // Optionally, revert optimistic update or show a toast
      // For simplicity, we'll keep the optimistic update for now.
      // setError(err instanceof Error ? err.message : "Failed to save settings");
    }
  }, []);
 
  // isLoading and error states are not directly exposed via context in this example,
  // but could be if UI needs to react to them.
  // For now, the provider handles loading and uses defaults on error.
  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
