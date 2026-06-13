import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import { AppShell } from "@/components/rx/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/rx/ProtectedRoute";
import Today from "./pages/Today";
import PRs from "./pages/PRs";
import Insights from "./pages/Insights";
import History from "./pages/History";
import CalendarPage from "./pages/Calendar";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import MyProgramming from "./pages/MyProgramming";
import AuthPage from "./pages/Auth";
import JoinPage from "./pages/Join";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffProgramming from "./pages/staff/StaffProgramming";
import StaffClassDay from "./pages/staff/StaffClassDay";
import StaffRoster from "./pages/staff/StaffRoster";
import StaffMemberships from "./pages/staff/StaffMemberships";
import { StaffRoute } from "@/components/rx/StaffRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/join/:linkId" element={<JoinPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Today />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/prs" element={<PRs />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/history" element={<History />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-programming" element={<MyProgramming />} />
              <Route
                path="/staff"
                element={
                  <StaffRoute>
                    <StaffDashboard />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/programming"
                element={
                  <StaffRoute allow={["programmer", "admin"]}>
                    <StaffProgramming />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/classes"
                element={
                  <StaffRoute>
                    <StaffClassDay />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/roster"
                element={
                  <StaffRoute>
                    <StaffRoster />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/memberships"
                element={
                  <StaffRoute allow={["admin"]}>
                    <StaffMemberships />
                  </StaffRoute>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
