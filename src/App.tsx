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
import { AdminNotificationListener } from "./components/AdminNotificationListener";
import { useUserPresence } from "./hooks/useUserPresence";
import { useAdminCheck } from "./hooks/useAdminCheck";

const queryClient = new QueryClient();

const AppContent = () => {
  useUserPresence();
  const { isAdmin } = useAdminCheck();  // 

  return (
    <>
      <AdminNotificationListener />
      <Routes>

        <Route
          path="/"
          element={
            isAdmin ? <Navigate to="/admin" replace /> : <Index />
          }
        />

        {/* REGULAR ROUTES */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/history" element={<History />} />
        <Route path="/news" element={<News />} />
        <Route path="/chart-viewer" element={<ChartViewer />} />
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/signals" element={<Signals />} />
        <Route path="/referral-program" element={<ReferralProgram />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/contact" element={<Contact />} />

        {/* CATCH-ALL */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
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

export default App;
