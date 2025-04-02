import { StrictMode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute"; // Import ProtectedRoute
import Dashboard from "@/pages/Dashboard";
import Index from "@/pages/Index";
import Terminal from "@/pages/Terminal";
import Bots from "@/pages/Bots";
import Earn from "@/pages/Earn";
import Markets from "@/pages/Markets";
import CommunityPage from "@/pages/Community";
import NotFound from "@/pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";

// Landing pages
import { CodyAIPage } from "@/pages/CodyAI";
import { TradingBotsLandingPage } from "@/pages/TradingBotsLanding";
import { BlogPage } from "@/pages/Blog";
import { OmniTokenPage } from "@/pages/OmniToken"; // Renamed import
import { PricingPage } from "@/pages/Pricing";

// Profile pages
import UserProfile from "@/pages/profile/UserProfile";
import Preferences from "@/pages/profile/Preferences";
import PlanSubscription from "@/pages/profile/PlanSubscription";
import ChangePassword from "@/pages/profile/ChangePassword";
import Security from "@/pages/profile/Security";
import MyAccounts from "@/pages/profile/MyAccounts";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";

// Create a new QueryClient instance
const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col min-h-screen bg-black">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const TerminalLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-black">
    <Navbar />
    {children}
  </div>
);

const App = () => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* Protected App Routes with Layout */}
              <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/terminal" element={<ProtectedRoute><TerminalLayout><Terminal /></TerminalLayout></ProtectedRoute>} />
              <Route path="/bots" element={<ProtectedRoute><AppLayout><Bots /></AppLayout></ProtectedRoute>} />
              <Route path="/earn" element={<ProtectedRoute><AppLayout><Earn /></AppLayout></ProtectedRoute>} />
              <Route path="/markets" element={<ProtectedRoute><AppLayout><Markets /></AppLayout></ProtectedRoute>} />
              <Route path="/community" element={<ProtectedRoute><AppLayout><CommunityPage /></AppLayout></ProtectedRoute>} />

              {/* Protected Profile routes with Layout */}
              <Route path="/profile" element={<ProtectedRoute><AppLayout><UserProfile /></AppLayout></ProtectedRoute>} />
              <Route path="/preferences" element={<ProtectedRoute><AppLayout><Preferences /></AppLayout></ProtectedRoute>} />
              <Route path="/plan" element={<ProtectedRoute><AppLayout><PlanSubscription /></AppLayout></ProtectedRoute>} />
              <Route path="/password" element={<ProtectedRoute><AppLayout><ChangePassword /></AppLayout></ProtectedRoute>} />
              <Route path="/security" element={<ProtectedRoute><AppLayout><Security /></AppLayout></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute><AppLayout><MyAccounts /></AppLayout></ProtectedRoute>} />

              {/* Public Landing Page Routes (without AppLayout) */}
              <Route path="/home" element={<Index />} /> {/* Use Index directly, it will have its own Navbar/Footer */}
              <Route path="/cody-ai" element={<CodyAIPage />} />
              <Route path="/trading-bots" element={<TradingBotsLandingPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/omni-token" element={<OmniTokenPage />} /> {/* Renamed route and component */}
              <Route path="/pricing" element={<PricingPage />} />

              {/* Public Auth Routes (without AppLayout) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Not Found Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);

export default App;
