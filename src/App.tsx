import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LangProvider } from "@/contexts/LangContext";
import { AuthProvider } from "@/contexts/AuthContext";
import SplashScreen from "@/components/splash/SplashScreen";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import MerchantPage from "./pages/MerchantPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import CreateOrderPage from "./pages/CreateOrderPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import MerchantDashboard from "./pages/merchant/MerchantDashboard";
import MerchantOverview from "./pages/merchant/MerchantOverview";
import MerchantCatalog from "./pages/merchant/MerchantCatalog";
import MerchantBranches from "./pages/merchant/MerchantBranches";
import MerchantOrders from "./pages/merchant/MerchantOrders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);

  useEffect(() => {
    // Check if user has seen splash in this session
    const seen = sessionStorage.getItem('ya-splash-seen');
    if (seen) {
      setShowSplash(false);
      setHasSeenSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasSeenSplash(true);
    sessionStorage.setItem('ya-splash-seen', 'true');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LangProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {showSplash && !hasSeenSplash && (
              <SplashScreen onComplete={handleSplashComplete} />
            )}
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/merchant/:id" element={<MerchantPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderTrackingPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/create-order" element={<CreateOrderPage />} />
                {/* Merchant Portal */}
                <Route path="/merchant" element={<MerchantDashboard />}>
                  <Route index element={<MerchantOverview />} />
                  <Route path="catalog" element={<MerchantCatalog />} />
                  <Route path="branches" element={<MerchantBranches />} />
                  <Route path="orders" element={<MerchantOrders />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LangProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
