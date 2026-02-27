import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import History from "./pages/History";
import News from "./pages/News";
import ChartViewer from "./pages/ChartViewer";
import Purchase from "./pages/Purchase";
import Admin from "./pages/Admin";
import Signals from "./pages/Signals";
import ReferralProgram from "./pages/ReferralProgram";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import PlatformGuide from "./pages/PlatformGuide";
import { AdminNotificationListener } from "./components/AdminNotificationListener";
import { useUserPresence } from "./hooks/useUserPresence";
import { useAdminCheck } from "./hooks/useAdminCheck";
import { useSignalProviderCheck } from "./hooks/useSignalProviderCheck";
import { useAutoLogout } from "./hooks/useAutoLogout";

// NEW: Import Signal Provider and Free Signals pages
import SignalProvider from "./pages/SignalProvider";
import FreeSignals from "./pages/FreeSignals";

const queryClient = new QueryClient();

const AppContent = () => {
  useUserPresence();
  useAutoLogout();
  const { isAdmin } = useAdminCheck();
  const { isSignalProvider } = useSignalProviderCheck();

  return (
    <>
      <AdminNotificationListener />
      <Routes>
        {/* PUBLIC ROUTES - Accessible to everyone */}
        <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/platform-guide" element={<PlatformGuide />} />
        
        {/* NEW: Free Signals page - accessible to everyone including non-logged in users */}
        <Route path="/free-signals" element={<FreeSignals />} />
        
        {/* PROTECTED ROUTES - Require authentication */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/history" element={<History />} />
        <Route path="/news" element={<News />} />
        <Route path="/chart-viewer" element={<ChartViewer />} />
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/signals" element={<Signals />} />
        <Route path="/referral-program" element={<ReferralProgram />} />
        
        {/* ADMIN ROUTE - Requires admin role */}
        <Route path="/admin" element={<Admin />} />
        
        {/* NEW: SIGNAL PROVIDER ROUTE - Requires signal_provider role */}
        <Route path="/signal-provider" element={<SignalProvider />} />
        
        {/* 404 ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
