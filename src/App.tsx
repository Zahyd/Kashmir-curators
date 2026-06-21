import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TeamAuthProvider } from "@/contexts/TeamAuthContext";
import Index from "./pages/Index";
import Packages from "./pages/Packages";
import PackageDetail from "./pages/PackageDetail";
import Hotels from "./pages/Hotels";
import Cabs from "./pages/Cabs";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import TripPlanner from "./pages/TripPlanner";
import NotFound from "./pages/NotFound";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";
import HotelConfirm from "./pages/HotelConfirm";

import SalesAuth from "./pages/SalesAuth";
import SalesPortal from "./pages/SalesPortal";
import PaymentRequest from "./pages/PaymentRequest";
import { useAntiTheft } from "./hooks/useAntiTheft";

const queryClient = new QueryClient();

const App = () => {
  useAntiTheft();

  return (
    <QueryClientProvider client={queryClient}>
      <TeamAuthProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/packages/:id" element={<PackageDetail />} />
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/cabs" element={<Cabs />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/planner" element={<TripPlanner />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/sales/auth" element={<SalesAuth />} />
              <Route path="/sales/portal" element={<SalesPortal />} />
              <Route path="/sales" element={<SalesAuth />} />
              <Route path="/sales/" element={<SalesAuth />} />
              <Route path="/payment-request/:paymentId" element={<PaymentRequest />} />
              <Route path="/hotel/confirm/:reservationId" element={<HotelConfirm />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </TeamAuthProvider>
  </QueryClientProvider>
  );
};

export default App;
