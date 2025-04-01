
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Dashboard from "@/pages/Dashboard";
import Terminal from "@/pages/Terminal";
import Bots from "@/pages/Bots";
import Earn from "@/pages/Earn";
import Markets from "@/pages/Markets";
import NotFound from "@/pages/NotFound";

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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/terminal" element={<TerminalLayout><Terminal /></TerminalLayout>} />
          <Route path="/bots" element={<AppLayout><Bots /></AppLayout>} />
          <Route path="/earn" element={<AppLayout><Earn /></AppLayout>} />
          <Route path="/markets" element={<AppLayout><Markets /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
