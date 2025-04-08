import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation } from "wouter";
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
import QuestionView from "@/pages/question-view";
import NotFound from "@/pages/not-found";
import SettingsPanel from "./components/settings-panel";
import { QuestionBrowser } from "./components/question-browser";
import { Header } from "./components/layout/header";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/quiz/:attemptId" component={Quiz} />
      <Route path="/test-analytics/:attemptId" component={TestAnalytics} />
      <Route path="/overall-analytics" component={OverallAnalytics} />
      <Route path="/flashcards" component={Flashcards} />
      <Route path="/questions" component={() => <QuestionBrowser />} />
      <Route path="/tests/:testId/questions">
        {(params) => <QuestionBrowser testId={Number(params.testId)} />}
      </Route>
      <Route path="/tests/:testId/questions/:questionId">
        {(params) => <QuestionView />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Get current location to determine if we should hide header on certain pages
  const [location] = useLocation();
  
  // Hide header on quiz pages
  const hideHeader = location.startsWith("/quiz/");

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <UIStateProvider>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            {!hideHeader && <Header />}
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
