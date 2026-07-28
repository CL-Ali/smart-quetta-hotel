import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LangProvider } from "./contexts/LangContext";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Kitchen from "./pages/Kitchen";
import Waiter from "./pages/Waiter";

// NavBar is only shown on staff-facing routes (dashboard, kitchen, waiter)
const STAFF_ROUTES = ["/dashboard", "/kitchen", "/waiter"];

function Router() {
  const [location] = useLocation();
  const isStaffRoute = STAFF_ROUTES.includes(location);

  return (
    <div style={{ minHeight: "100vh" }}>
      {isStaffRoute && <NavBar />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/kitchen" component={Kitchen} />
        <Route path="/waiter" component={Waiter} />
        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

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
