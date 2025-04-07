import { createContext, useContext, useState, useEffect } from "react";
import { DEFAULT_ANALYTICS_PROMPT, DEFAULT_SUBJECT_TAGGING_PROMPT } from "@/lib/gemini";

interface Settings {
  theme: "light" | "dark" | "system";
  primaryColor: string;
  animations: boolean;
  aiEnabled: boolean;
  aiApiKey: string;
  aiModel: string;
  subjectTaggingPrompt: string;
  analyticsPrompt: string;
  parsingPromptTitle: string;
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
  parsingPromptTitle: "Parse the following test into JSON format",
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
  
  // Load theme from theme.json on initial load
  useEffect(() => {
    const getThemeColor = async () => {
      try {
        // This fetch will be intercepted by the Vite dev server and will read from the file
        const response = await fetch('/theme.json');
        if (response.ok) {
          const themeData = await response.json();
          
          // Map HSL values to color names
          const colorMap: Record<string, string> = {
            "hsl(211, 100%, 50%)": "blue",
            "hsl(270, 80%, 50%)": "purple",
            "hsl(142, 70%, 45%)": "green",
            "hsl(45, 97%, 50%)": "amber",
            "hsl(0, 84%, 60%)": "red"
          };
          
          // Find closest match or default to blue
          const primaryColor = themeData.primary ? (colorMap[themeData.primary] || "blue") : "blue";
          
          // Update settings with color from theme.json
          setSettings(prev => ({
            ...prev,
            primaryColor
          }));
          
          // Set CSS variable for immediate application
          document.documentElement.style.setProperty('--primary', themeData.primary);
        }
      } catch (error) {
        console.error("Failed to load theme.json:", error);
      }
    };
    
    getThemeColor();
  }, []);

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
