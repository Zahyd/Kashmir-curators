import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TeamAuthProvider } from "@/contexts/TeamAuthContext";
import { LeadCaptureProvider } from "@/contexts/LeadCaptureContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import LeadCaptureModal from "@/components/leads/LeadCaptureModal";
import CallbackRequestModal from "@/components/leads/CallbackRequestModal";
import { ThemeProvider } from "./contexts/ThemeContext";
import EmergencyBanner from "./components/layout/EmergencyBanner";
import PageLoading from "./components/layout/PageLoading";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { useAntiTheft } from "./hooks/useAntiTheft";

// Lazy-loaded routes for enterprise-grade performance & bundle optimization
const Index = lazy(() => import("./pages/Index"));
const Packages = lazy(() => import("./pages/Packages"));
const PackageDetail = lazy(() => import("./pages/PackageDetail"));
const Hotels = lazy(() => import("./pages/Hotels"));
const Cabs = lazy(() => import("./pages/Cabs"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const TripPlanner = lazy(() => import("./pages/TripPlanner"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BlogList = lazy(() => import("./pages/BlogList"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const HotelConfirm = lazy(() => import("./pages/HotelConfirm"));
const TravelStatusPage = lazy(() => import("./pages/TravelStatusPage"));
const VendorPortal = lazy(() => import("./pages/VendorPortal"));
const AgentDashboard = lazy(() => import("./modules/agents/pages/AgentDashboard"));
const AgentLandingPage = lazy(() => import("./modules/agents/pages/AgentLandingPage"));
const AgencyOnboardingPage = lazy(() => import("./modules/agents/pages/AgencyOnboardingPage"));
const AgencyStatusPage = lazy(() => import("./modules/agents/pages/AgencyStatusPage"));
const AgencySuccessPage = lazy(() => import("./modules/agents/pages/AgencySuccessPage"));
const AgentPricingPage = lazy(() => import("./modules/agents/pages/AgentPricingPage"));
const HospitalityDashboard = lazy(() => import("./modules/hospitality/pages/HospitalityDashboard"));
const DriverDashboard = lazy(() => import("./modules/drivers/pages/DriverDashboard"));
const SalesAuth = lazy(() => import("./pages/SalesAuth"));
const SalesPortal = lazy(() => import("./pages/SalesPortal"));
const PaymentRequest = lazy(() => import("./pages/PaymentRequest"));
const PublicItinerary = lazy(() => import("./pages/PublicItinerary"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      retry: 1,
    },
  },
});

const App = () => {
  useAntiTheft();

  return (
    <QueryClientProvider client={queryClient}>
      <TeamAuthProvider>
        <AuthProvider>
          <CurrencyProvider>
            <LeadCaptureProvider>
              <ThemeProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <EmergencyBanner />
                    <LeadCaptureModal />
                    <CallbackRequestModal />
                    <ErrorBoundary variant="page">
                      <Suspense fallback={<PageLoading fullScreen />}>
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
                      </Suspense>
                    </ErrorBoundary>
                  </BrowserRouter>
                </TooltipProvider>
              </ThemeProvider>
            </LeadCaptureProvider>
          </CurrencyProvider>
        </AuthProvider>
      </TeamAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
