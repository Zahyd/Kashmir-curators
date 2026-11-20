import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TeamAuthProvider } from "@/contexts/TeamAuthContext";
import { LeadCaptureProvider } from "@/contexts/LeadCaptureContext";
import LeadCaptureModal from "@/components/leads/LeadCaptureModal";
import CallbackRequestModal from "@/components/leads/CallbackRequestModal";
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
import TravelStatusPage from "./pages/TravelStatusPage";
import VendorPortal from "./pages/VendorPortal";
import AgentDashboard from "./modules/agents/pages/AgentDashboard";
import AgentLandingPage from "./modules/agents/pages/AgentLandingPage";
import AgencyOnboardingPage from "./modules/agents/pages/AgencyOnboardingPage";
import AgencyStatusPage from "./modules/agents/pages/AgencyStatusPage";
import AgencySuccessPage from "./modules/agents/pages/AgencySuccessPage";
import AgentPricingPage from "./modules/agents/pages/AgentPricingPage";
import HospitalityDashboard from "./modules/hospitality/pages/HospitalityDashboard";
import DriverDashboard from "./modules/drivers/pages/DriverDashboard";

import SalesAuth from "./pages/SalesAuth";
import SalesPortal from "./pages/SalesPortal";
import PaymentRequest from "./pages/PaymentRequest";
import PublicItinerary from "./pages/PublicItinerary";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

import { ThemeProvider } from "./contexts/ThemeContext";
import EmergencyBanner from "./components/layout/EmergencyBanner";
import { useAntiTheft } from "./hooks/useAntiTheft";

const queryClient = new QueryClient();

const App = () => {
  useAntiTheft();

  return (
    <QueryClientProvider client={queryClient}>
      <TeamAuthProvider>
        <AuthProvider>
          <LeadCaptureProvider>
            <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <EmergencyBanner />
                <LeadCaptureModal />
                <CallbackRequestModal />
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
                  <Route path="/itinerary/:inquiryId" element={<PublicItinerary />} />
                  <Route path="/blog" element={<BlogList />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/sales/auth" element={<SalesAuth />} />
                  <Route path="/sales/login" element={<SalesAuth />} />
                  <Route path="/sales/portal" element={<SalesPortal />} />
                  <Route path="/sales" element={<SalesAuth />} />
                  <Route path="/sales/" element={<SalesAuth />} />
                  <Route path="/payment-request/:paymentId" element={<PaymentRequest />} />
                  <Route path="/hotel/confirm/:reservationId" element={<HotelConfirm />} />
                  <Route path="/hotel/confirm/:tokenOrId" element={<HotelConfirm />} />
                  <Route path="/reception/confirm/:tokenOrId" element={<HotelConfirm />} />
                  <Route path="/agent/apply" element={<AgencyOnboardingPage />} />
                  <Route path="/agent/status" element={<AgencyStatusPage />} />
                  <Route path="/agent/pricing" element={<AgentPricingPage />} />
                  <Route path="/agent/success" element={<AgencySuccessPage />} />
                  <Route path="/agent/landing" element={<AgentLandingPage />} />
                  <Route path="/agent" element={<AgentDashboard />} />
                  <Route path="/agent/*" element={<AgentDashboard />} />
                  <Route path="/hospitality" element={<HospitalityDashboard />} />
                  <Route path="/hospitality/*" element={<HospitalityDashboard />} />
                  <Route path="/driver" element={<DriverDashboard />} />
                  <Route path="/driver/*" element={<DriverDashboard />} />
                  <Route path="/drivers" element={<DriverDashboard />} />
                  <Route path="/travel-status" element={<TravelStatusPage />} />
                  <Route path="/vendor" element={<VendorPortal />} />
                  <Route path="/vendor/auth" element={<VendorPortal />} />
                  <Route path="/vendor/onboard" element={<VendorPortal />} />
                  <Route path="/vendor/portal" element={<VendorPortal />} />
                  <Route path="/partner" element={<VendorPortal />} />
                  <Route path="/safety-card/:token" element={<TravelStatusPage />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/contact" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
          </LeadCaptureProvider>
        </AuthProvider>
      </TeamAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
