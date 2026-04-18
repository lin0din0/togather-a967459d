import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CalendarConnect from "./pages/CalendarConnect";
import Budget from "./pages/Budget";
import AddConnection from "./pages/AddConnection";
import InviteSent from "./pages/InviteSent";
import Home from "./pages/Home";
import ChatList from "./pages/ChatList";
import ChatThread from "./pages/ChatThread";
import ChatGoalSettings from "./pages/ChatGoalSettings";
import ChatAIPreferences from "./pages/ChatAIPreferences";
import ChatNotifications from "./pages/ChatNotifications";
import CalendarView from "./pages/CalendarView";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Splash />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/calendar-connect" element={<ProtectedRoute><CalendarConnect /></ProtectedRoute>} />
              <Route path="/aichat" element={<Navigate to="/calendar-connect" replace />} />
              <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
              <Route path="/add-connection" element={<ProtectedRoute><AddConnection /></ProtectedRoute>} />
              <Route path="/invite-sent" element={<ProtectedRoute><InviteSent /></ProtectedRoute>} />
              <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
              <Route path="/chat/:personId" element={<ProtectedRoute><ChatThread /></ProtectedRoute>} />
              <Route path="/chat/:personId/goal" element={<ProtectedRoute><ChatGoalSettings /></ProtectedRoute>} />
              <Route path="/chat/:personId/ai-preferences" element={<ProtectedRoute><ChatAIPreferences /></ProtectedRoute>} />
              <Route path="/chat/:personId/notifications" element={<ProtectedRoute><ChatNotifications /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* Legacy redirects */}
              <Route path="/onboarding" element={<Navigate to="/calendar-connect" replace />} />
              <Route path="/people" element={<Navigate to="/home" replace />} />
              <Route path="/plan" element={<Navigate to="/chat" replace />} />
              <Route path="/schedule" element={<Navigate to="/calendar" replace />} />
              <Route path="/notifications" element={<Navigate to="/profile" replace />} />
              <Route path="/announcements" element={<Navigate to="/home" replace />} />
              <Route path="/events/:id" element={<Navigate to="/calendar" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
