import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LangProvider } from "./contexts/LangContext";
// [OPTIONAL] NavBar – comment this back in to show the top navigation bar
import NavBar from "./components/NavBar";   // full path: client/src/components/NavBar.tsx
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Kitchen from "./pages/Kitchen";
import Waiter from "./pages/Waiter";
import Confirmation from "./pages/Confirmation";
import OrderHistory from "./pages/OrderHistory";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <div style={{ minHeight: "100vh", background: "#111827" }}>
      {/* [OPTIONAL] NavBar – uncomment the line below + import above to enable navigation bar
          Full component path: client/src/components/NavBar.tsx
           */}
          <NavBar /> 
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/confirmation"} component={Confirmation} />
        <Route path={"/history"} component={OrderHistory} />
        <Route path={"/dashboard"} component={Dashboard} />
        <Route path={"/kitchen"} component={Kitchen} />
        <Route path={"/waiter"} component={Waiter} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LangProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LangProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
