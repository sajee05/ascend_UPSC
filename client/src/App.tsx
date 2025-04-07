import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { SettingsProvider } from "./hooks/use-settings";
import { UIStateProvider } from "./hooks/use-ui-state";

// Pages
import Home from "@/pages/home";
import Quiz from "@/pages/quiz";
import TestAnalytics from "@/pages/test-analytics";
import OverallAnalytics from "@/pages/overall-analytics";
import Flashcards from "@/pages/flashcards";
import NotFound from "@/pages/not-found";
import SettingsPanel from "./components/settings-panel";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/quiz/:attemptId" component={Quiz} />
      <Route path="/test-analytics/:attemptId" component={TestAnalytics} />
      <Route path="/overall-analytics" component={OverallAnalytics} />
      <Route path="/flashcards" component={Flashcards} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <UIStateProvider>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Router />
            <Toaster />
            <SettingsPanel />
          </div>
        </UIStateProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
