import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Preferences from "./pages/Preferences";
import NewAssignment from "./pages/NewAssignment";
import AssignmentDetail from "./pages/AssignmentDetail";
import SharedAssignments from "./pages/SharedAssignments";
import Friends from "./pages/Friends";
import TaskBoard from "./pages/TaskBoard";
import Performance from "./pages/Performance";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/new" element={<NewAssignment />} />
          <Route path="/shared" element={<SharedAssignments />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/board" element={<TaskBoard />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/assignment/:id" element={<AssignmentDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;