import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import MessagesNew from "./pages/MessagesNew";
import Calendar from "./pages/Calendar";
import Admin from "./pages/Admin";
import Terminal from "./pages/Terminal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesNew /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
