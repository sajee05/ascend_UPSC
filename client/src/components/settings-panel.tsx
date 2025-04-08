import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useSettings } from "@/hooks/use-settings";
import { useUIState } from "@/hooks/use-ui-state";
import { X, Moon, Sun, Upload, BarChart3, Copy, Trash2, Download, Computer, CheckCircle, Database, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { 
  DEFAULT_ANALYTICS_PROMPT, 
  DEFAULT_EXPLANATION_PROMPT, 
  DEFAULT_SUBJECT_TAGGING_PROMPT,
  DEFAULT_STUDY_PLAN_PROMPT,
  DEFAULT_LEARNING_PATTERN_PROMPT
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
  const [postgresConnectionString, setPostgresConnectionString] = useState(settings.postgresConnectionString || "");
  const [showConnectionString, setShowConnectionString] = useState(false);
  const [configuringDatabase, setConfiguringDatabase] = useState(false);

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
    }
  }, [uiState.settingsPanelOpen, settings]);

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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gemini model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.0-flash">gemini-2.0-flash (Recommended)</SelectItem>
                    <SelectItem value="gemini-1.5-flash">gemini-1.5-flash</SelectItem>
                    <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                    <SelectItem value="gemini-1.0-pro">gemini-1.0-pro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Model options are updated automatically to reflect the latest available models.
                </p>
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
          
          {/* Database Configuration */}
          <div>
            <h3 className="font-medium text-lg mb-4">Database Configuration</h3>
            <div className="space-y-4">
              {/* Database Type */}
              <div>
                <Label className="block text-sm font-medium mb-2">Database Type</Label>
                <RadioGroup 
                  value={settings.databaseType || "postgresql"} 
                  onValueChange={(value: "sqlite" | "postgresql") => updateSettings({ databaseType: value })}
                  className="space-y-2"
                >
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="sqlite" id="sqlite" />
                    <div className="grid gap-1.5">
                      <Label htmlFor="sqlite" className="font-medium">SQLite</Label>
                      <p className="text-xs text-muted-foreground">
                        Portable, local database. Best for personal use or portable mode.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="postgresql" id="postgresql" />
                    <div className="grid gap-1.5">
                      <Label htmlFor="postgresql" className="font-medium">PostgreSQL</Label>
                      <p className="text-xs text-muted-foreground">
                        Production database for web mode and multi-user setups.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              {/* PostgreSQL Connection String */}
              {(settings.databaseType === "postgresql" || !settings.databaseType) && (
                <div>
                  <Label className="block text-sm font-medium mb-2">PostgreSQL Connection String</Label>
                  <div className="relative">
                    <Input 
                      type={showConnectionString ? "text" : "password"}
                      value={postgresConnectionString}
                      onChange={(e) => setPostgresConnectionString(e.target.value)}
                      className="pr-24"
                      placeholder="postgres://username:password@host:port/database"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 text-xs"
                      onClick={() => setShowConnectionString(!showConnectionString)}
                    >
                      {showConnectionString ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: postgres://username:password@host:port/database
                  </p>
                </div>
              )}
              
              {/* Configure Database Button */}
              <Button 
                onClick={() => {
                  setConfiguringDatabase(true);
                  
                  // Call API to configure database
                  fetch('/api/database/configure', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      type: settings.databaseType || "postgresql",
                      connectionString: postgresConnectionString,
                    }),
                  })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error('Failed to configure database');
                    }
                    return response.json();
                  })
                  .then(data => {
                    toast({
                      title: "Database configured",
                      description: data.message || "Database configured successfully. Reloading in 3 seconds...",
                      className: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                      duration: 3000,
                    });
                    
                    // Save settings
                    updateSettings({
                      databaseType: settings.databaseType || "postgresql",
                      postgresConnectionString,
                    });
                    
                    // Reload the page after 3 seconds to apply the new database configuration
                    setTimeout(() => {
                      window.location.reload();
                    }, 3000);
                  })
                  .catch(error => {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to configure database",
                      variant: "destructive",
                      duration: 5000,
                    });
                  })
                  .finally(() => {
                    setConfiguringDatabase(false);
                  });
                }}
                disabled={configuringDatabase}
                className="w-full"
              >
                {configuringDatabase ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Configuring Database...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Configure Database
                  </>
                )}
              </Button>
            </div>
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
