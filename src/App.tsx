import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModeProvider } from "@/lib/mode";
import Index from "./pages/Index.tsx";
import Brief from "./pages/Brief.tsx";
import Ops from "./pages/Ops.tsx";
import Tech from "./pages/Tech.tsx";
import Activity from "./pages/Activity.tsx";
import CalendarPage from "./pages/Calendar.tsx";
import NotFound from "./pages/NotFound.tsx";
import AuthGate from "./components/AuthGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ModeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/brief" element={<Brief />} />
            <Route path="/ops" element={<Ops />} />
            <Route path="/tech" element={<Tech />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ModeProvider>
  </QueryClientProvider>
);

export default App;
