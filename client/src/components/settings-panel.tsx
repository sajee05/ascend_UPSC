import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed: import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useSettings } from "@/hooks/use-settings";
import { useUIState } from "@/hooks/use-ui-state";
import { X, Moon, Sun, Upload, BarChart3, Copy, Trash2, Download, Computer, CheckCircle, Database, Loader2, NotebookText } from "lucide-react"; // Added NotebookText
import { useLocation } from "wouter";
import {
  DEFAULT_ANALYTICS_PROMPT,
  DEFAULT_EXPLANATION_PROMPT,
  DEFAULT_SUBJECT_TAGGING_PROMPT,
  DEFAULT_STUDY_PLAN_PROMPT,
  DEFAULT_LEARNING_PATTERN_PROMPT,
  fetchAvailableModels
} from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const { uiState, updateUIState } = useUIState();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Local state for form values
  const [apiKey, setApiKey] = useState(settings.aiApiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [subjectTaggingPrompt, setSubjectTaggingPrompt] = useState(settings.subjectTaggingPrompt);
  const [analyticsPrompt, setAnalyticsPrompt] = useState(settings.analyticsPrompt);
  const [explanationPrompt, setExplanationPrompt] = useState(settings.explanationPrompt);
  const [studyPlanPrompt, setStudyPlanPrompt] = useState(settings.studyPlanPrompt);
  const [learningPatternPrompt, setLearningPatternPrompt] = useState(settings.learningPatternPrompt);
  const [parsingPromptTitle, setParsingPromptTitle] = useState(settings.parsingPromptTitle || "");
  const [subjectTaggingAiModel, setSubjectTaggingAiModel] = useState(settings.subjectTaggingAiModel || "gemini-1.5-flash");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  // Removed postgresConnectionString, showConnectionString, configuringDatabase, connectionStatus, savingDatabase states

  // Apply settings when panel closes
  useEffect(() => {
    if (uiState.settingsPanelOpen) {
      // Initialize local state when panel opens
      setApiKey(settings.aiApiKey || "");
      setSubjectTaggingPrompt(settings.subjectTaggingPrompt);
      setAnalyticsPrompt(settings.analyticsPrompt);
      setExplanationPrompt(settings.explanationPrompt);
      setStudyPlanPrompt(settings.studyPlanPrompt);
      setLearningPatternPrompt(settings.learningPatternPrompt);
      setParsingPromptTitle(settings.parsingPromptTitle || "Your Task:** You are an expert data formatter. Your goal is to convert all questions, answers, and explanatios fom the provided input text into a specific, structured format. Adhere strictly to the rules below.");
      setSubjectTaggingAiModel(settings.subjectTaggingAiModel || "gemini-1.5-flash");
    }
  }, [uiState.settingsPanelOpen, settings]);

  // Fetch available models when panel opens or API key changes
  useEffect(() => {
    const loadModels = async () => {
      if (uiState.settingsPanelOpen && settings.aiApiKey) {
        setModelsLoading(true);
        setModelsError(null);
        try {
          const models = await fetchAvailableModels(settings.aiApiKey);
          setAvailableModels(models);
          if (models.length === 0) {
            setModelsError("No models returned from API, or API key is invalid.");
            toast({
              title: "AI Model Fetching Issue",
              description: "No models found. Please check your API key or network connection.",
              variant: "destructive",
              duration: 5000,
            });
          }
        } catch (error) {
          console.error("Failed to fetch models:", error);
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          setModelsError(`Failed to fetch models: ${errorMessage}`);
          toast({
            title: "Error Fetching AI Models",
            description: `Could not retrieve model list: ${errorMessage}`,
            variant: "destructive",
            duration: 5000,
          });
          setAvailableModels([]); // Ensure availableModels is empty on error
        } finally {
          setModelsLoading(false);
        }
      } else if (uiState.settingsPanelOpen && !settings.aiApiKey) {
        setAvailableModels([]);
        setModelsError("API key is missing. Please add your Gemini API key.");
        setModelsLoading(false);
      } else {
        // Reset when panel is closed or API key is removed while panel is open
        setAvailableModels([]);
        setModelsLoading(false);
        setModelsError(null);
      }
    };

    loadModels();
  }, [uiState.settingsPanelOpen, settings.aiApiKey, toast]);

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    // First update DOM to prevent flash
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
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

    // Then update settings
    updateSettings({ theme });

    // Show toast confirmation
    toast({
      title: "Theme updated",
      description: `Theme changed to ${theme} mode`,
      duration: 2000,
    });
  };

  const handleColorChange = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "211 100% 50%",
      purple: "270 80% 50%",
      green: "142 70% 45%",
      amber: "45 97% 50%",
      red: "0 84% 60%"
    };

    // First update CSS variables for immediate visual feedback
    document.documentElement.style.setProperty('--primary', colorMap[color]);

    // Update settings after visual change
    updateSettings({ primaryColor: color });

    // Show toast confirmation
    toast({
      title: "Color updated",
      description: "Your accent color has been changed",
      duration: 2000,
    });
  };

  const handleSaveAISettings = () => {
    updateSettings({
      aiApiKey: apiKey,
      subjectTaggingAiModel,
      subjectTaggingPrompt,
      analyticsPrompt,
      explanationPrompt,
      studyPlanPrompt,
      learningPatternPrompt,
      parsingPromptTitle
    });

    toast({
      title: "Settings saved",
      description: "Your AI settings have been successfully saved",
      className: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      duration: 3000,
    });
  };

  const handleResetSubjectPrompt = () => {
    setSubjectTaggingPrompt(DEFAULT_SUBJECT_TAGGING_PROMPT);
  };

  const handleResetAnalyticsPrompt = () => {
    setAnalyticsPrompt(DEFAULT_ANALYTICS_PROMPT);
  };

  const handleResetExplanationPrompt = () => {
    setExplanationPrompt(DEFAULT_EXPLANATION_PROMPT);
  };

  const handleResetStudyPlanPrompt = () => {
    setStudyPlanPrompt(DEFAULT_STUDY_PLAN_PROMPT);
  };

  const handleResetLearningPatternPrompt = () => {
    setLearningPatternPrompt(DEFAULT_LEARNING_PATTERN_PROMPT);
  };

  const handleNavigate = (path: string) => {
    updateUIState({ settingsPanelOpen: false });
    navigate(path);
  };

  const handleExportData = () => {
    // This would be implemented to export all user data
    alert("Export functionality would save all your data to a JSON file");
  };

  const handleImportData = () => {
    // This would be implemented to import user data
    alert("Import functionality would allow uploading a previously exported JSON file");
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      // This would be implemented to clear all user data
      alert("All data would be cleared");
    }
  };

  return (
    <Sheet open={uiState.settingsPanelOpen} onOpenChange={(open) => updateUIState({ settingsPanelOpen: open })}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="flex items-center justify-between">
          <SheetTitle>Settings</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => updateUIState({ settingsPanelOpen: false })}
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <div className="py-4 space-y-8">
          {/* Appearance */}
          <div>
            <h3 className="font-medium text-lg mb-4">Appearance</h3>
            <div className="space-y-4">
              {/* Theme Selector */}
              <div>
                <Label className="block text-sm font-medium mb-2">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className={`aspect-square flex flex-col items-center justify-center space-y-1.5 ${
                      settings.theme === "light" ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleThemeChange("light")}
                  >
                    <Sun className="h-5 w-5" />
                    <span className="text-xs">Light</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={`aspect-square flex flex-col items-center justify-center space-y-1.5 ${
                      settings.theme === "dark" ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-xs">Dark</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={`aspect-square flex flex-col items-center justify-center space-y-1.5 ${
                      settings.theme === "system" ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleThemeChange("system")}
                  >
                    <Computer className="h-5 w-5" />
                    <span className="text-xs">System</span>
                  </Button>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <Label className="block text-sm font-medium mb-2">Accent Color</Label>
                <div className="flex space-x-3">
                  <button
                    className={`w-8 h-8 rounded-full bg-blue-500 transition-all ${
                      settings.primaryColor === "blue" ? "ring-2 ring-offset-2 ring-blue-500" : "hover:ring-2 hover:ring-offset-2 hover:ring-blue-500"
                    }`}
                    onClick={() => handleColorChange("blue")}
                  />
                  <button
                    className={`w-8 h-8 rounded-full bg-purple-500 transition-all ${
                      settings.primaryColor === "purple" ? "ring-2 ring-offset-2 ring-purple-500" : "hover:ring-2 hover:ring-offset-2 hover:ring-purple-500"
                    }`}
                    onClick={() => handleColorChange("purple")}
                  />
                  <button
                    className={`w-8 h-8 rounded-full bg-green-500 transition-all ${
                      settings.primaryColor === "green" ? "ring-2 ring-offset-2 ring-green-500" : "hover:ring-2 hover:ring-offset-2 hover:ring-green-500"
                    }`}
                    onClick={() => handleColorChange("green")}
                  />
                  <button
                    className={`w-8 h-8 rounded-full bg-amber-500 transition-all ${
                      settings.primaryColor === "amber" ? "ring-2 ring-offset-2 ring-amber-500" : "hover:ring-2 hover:ring-offset-2 hover:ring-amber-500"
                    }`}
                    onClick={() => handleColorChange("amber")}
                  />
                  <button
                    className={`w-8 h-8 rounded-full bg-red-500 transition-all ${
                      settings.primaryColor === "red" ? "ring-2 ring-offset-2 ring-red-500" : "hover:ring-2 hover:ring-offset-2 hover:ring-red-500"
                    }`}
                    onClick={() => handleColorChange("red")}
                  />
                </div>
              </div>

              {/* Animation Setting */}
              <div>
                <Label className="block text-sm font-medium mb-2">Animations</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="animations"
                    checked={settings.animations}
                    onCheckedChange={(checked) => updateSettings({ animations: checked })}
                  />
                  <Label htmlFor="animations">Enable animations</Label>
                </div>
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div>
            <h3 className="font-medium text-lg mb-4">AI Integration</h3>
            <div className="space-y-4">
              {/* Enable AI */}
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-ai" className="block text-sm font-medium">
                    Enable AI Features
                  </Label>
                  <Switch
                    id="enable-ai"
                    checked={settings.aiEnabled}
                    onCheckedChange={(checked) => updateSettings({ aiEnabled: checked })}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enables subject tagging and analytics recommendations.
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <Label className="block text-sm font-medium mb-2">Gemini Model</Label>
                <Select
                  value={settings.aiModel}
                  onValueChange={(value) => updateSettings({ aiModel: value })}
                  disabled={modelsLoading || !settings.aiApiKey || !!modelsError}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={modelsLoading ? "Loading models..." : (modelsError || "Select Gemini model")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.length > 0 ? (
                      availableModels.map((modelId) => (
                        <SelectItem key={modelId} value={modelId}>
                          {modelId}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="placeholder" disabled>
                        {modelsLoading ? "Loading..." : (modelsError || (settings.aiApiKey ? "No models found" : "Enter API Key"))}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {modelsLoading && (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Fetching models...
                  </div>
                )}
                {modelsError && !modelsLoading && (
                  <p className="text-xs text-red-500 mt-1">{modelsError}</p>
                )}
                {!modelsError && !modelsLoading && availableModels.length > 0 && (
                 <p className="text-xs text-muted-foreground mt-1">
                    Models fetched dynamically. Select your preferred model.
                  </p>
                )}
                 {!modelsError && !modelsLoading && availableModels.length === 0 && !settings.aiApiKey && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your API key to load available models.
                  </p>
                )}
              </div>

              {/* Subject Tagging Model Selection */}
              <div>
                <Label className="block text-sm font-medium mb-2">Subject Tagging Model (gemini)</Label>
                <Select
                  value={subjectTaggingAiModel}
                  onValueChange={(value) => setSubjectTaggingAiModel(value)}
                  disabled={modelsLoading || !settings.aiApiKey || !!modelsError}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={modelsLoading ? "Loading models..." : (modelsError || "Select Gemini model for tagging")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.length > 0 ? (
                      availableModels.map((modelId) => (
                        <SelectItem key={modelId} value={modelId}>
                          {modelId}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="placeholder" disabled>
                         {modelsLoading ? "Loading..." : (modelsError || (settings.aiApiKey ? "No models found" : "Enter API Key"))}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {/* Error message for this dropdown is covered by the one above, or can be added if specific errors are needed */}
                {!modelsError && !modelsLoading && availableModels.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a specific model for subject tagging. Lighter models are often faster.
                  </p>
                )}
              </div>

              {/* API Key */}
              <div>
                <Label className="block text-sm font-medium mb-2">API Key</Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 text-xs"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>

              {/* Prompt Templates */}
              <div>
                <Label className="block text-sm font-medium mb-2">Subject Tagging Prompt</Label>
                <Textarea
                  value={subjectTaggingPrompt}
                  onChange={(e) => setSubjectTaggingPrompt(e.target.value)}
                  className="text-sm h-24"
                />
                <div className="flex justify-end mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={handleResetSubjectPrompt}
                  >
                    Reset to Default
                  </Button>
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Analytics Prompt</Label>
                <Textarea
                  value={analyticsPrompt}
                  onChange={(e) => setAnalyticsPrompt(e.target.value)}
                  className="text-sm h-24"
                />
                <div className="flex justify-end mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={handleResetAnalyticsPrompt}
                  >
                    Reset to Default
                  </Button>
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Explanation Prompt</Label>
                <Textarea
                  value={explanationPrompt}
                  onChange={(e) => setExplanationPrompt(e.target.value)}
                  className="text-sm h-24"
                />
                <div className="flex justify-end mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={handleResetExplanationPrompt}
                  >
                    Reset to Default
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Customize how AI explains correct and incorrect answers after attempting a question.
                </p>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Study Plan Prompt</Label>
                <Textarea
                  value={studyPlanPrompt}
                  onChange={(e) => setStudyPlanPrompt(e.target.value)}
                  className="text-sm h-24"
                />
                <div className="flex justify-end mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={handleResetStudyPlanPrompt}
                  >
                    Reset to Default
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Customize how AI generates personalized study plans based on your performance analytics.
                </p>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Learning Pattern Prompt</Label>
                <Textarea
                  value={learningPatternPrompt}
                  onChange={(e) => setLearningPatternPrompt(e.target.value)}
                  className="text-sm h-24"
                />
                <div className="flex justify-end mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={handleResetLearningPatternPrompt}
                  >
                    Reset to Default
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Customize how AI analyzes your learning patterns and recommends optimization strategies.
                </p>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Parsing Prompt Title</Label>
                <Input
                  value={parsingPromptTitle}
                  onChange={(e) => setParsingPromptTitle(e.target.value)}
                  placeholder="Your Task:** You are an expert data formatter..."
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This title will be displayed above the parsing prompt for test format conversion.
                </p>
              </div>

              <Button onClick={handleSaveAISettings}>
                Save AI Settings
              </Button>
            </div>
          </div>

          {/* Database Configuration Section - REMOVED */}
          <div>
            <h3 className="font-medium text-lg mb-4">Database Configuration</h3>
             <p className="text-sm text-muted-foreground">
                The application is configured to use a local SQLite database (`ascend-upsc.db`). No configuration is required.
              </p>
          </div>

          {/* Data Management */}
          <div>
            <h3 className="font-medium text-lg mb-4">Data Management</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleImportData}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={handleClearData}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-medium text-lg mb-4">Quick Access</h3>
            <div className="space-y-2">
              {/* Add Notes Button Here */}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  updateUIState({ settingsPanelOpen: false, notesModalOpen: true }); // Close settings, open notes
                }}
              >
                <NotebookText className="h-4 w-4 mr-3" />
                View Notes
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigate("/")}
              >
                <Upload className="h-4 w-4 mr-3" />
                Upload Test
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigate("/overall-analytics")}
              >
                <BarChart3 className="h-4 w-4 mr-3" />
                View Analytics
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigate("/flashcards")}
              >
                <Copy className="h-4 w-4 mr-3" />
                Flashcards
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter>
          <div className="w-full text-center text-sm text-muted-foreground">
            Ascend UPSC v1.0.0
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
