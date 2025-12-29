import { useEffect, useState } from "react";
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
import { useAutoLogout } from "./hooks/useAutoLogout";

const queryClient = new QueryClient();

const AppContent = () => {
  const [isLight, setIsLight] = useState(
  document.documentElement.classList.contains("light")
);

useEffect(() => {
  document.documentElement.classList.toggle("light", isLight);
}, [isLight]);

  useUserPresence();
  useAutoLogout();
  const { isAdmin } = useAdminCheck();

  return (
    <>
      <AdminNotificationListener />
      <div className="fixed top-1 right-4 z-50">
  <button
    onClick={() => setIsLight(!isLight)}
    className="px-3 py-2 rounded-md border text-sm bg-background hover:bg-secondary transition"
  >
    {isLight ? "🌙 Dark" : "☀️ Light"}
  </button>
</div>

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
        <Route path="/faq" element={<FAQ />} />
        <Route path="/platform-guide" element={<PlatformGuide />} />
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
