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
  aiModel: "gemini-1.5-flash",
  subjectTaggingPrompt: DEFAULT_SUBJECT_TAGGING_PROMPT,
  analyticsPrompt: DEFAULT_ANALYTICS_PROMPT,
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
