import { createContext, useContext, useState, useEffect } from "react";
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
  const [settings, setSettings] = useState<Settings>(() => {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem("ascend-upsc-settings");
    if (savedSettings) {
      try {
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error("Failed to parse settings from localStorage:", error);
      }
    }
    return defaultSettings;
  });
  
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

    // Save settings to localStorage
    localStorage.setItem("ascend-upsc-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
