import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import HeroSection from '@/components/home/HeroSection';
import DestinationsGrid from '@/components/home/DestinationsGrid';
import AuthenticityFeatures from '@/components/home/AuthenticityFeatures';
import FeaturedPackages from '@/components/home/FeaturedPackages';
import B2BPartnerSection from '@/components/home/B2BPartnerSection';
import Testimonials from '@/components/home/Testimonials';
import FAQSection from '@/components/home/FAQSection';
import DynamicCurationTicker from '@/components/home/DynamicCurationTicker';
import TravelStatusWidget from '@/components/home/TravelStatusWidget';
import UnifiedClosingCta from '@/components/home/UnifiedClosingCta';
import SeoMeta from '@/components/SeoMeta';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { openLeadModal } = useLeadCapture();

  useEffect(() => {
    // Proactively invite visitor to curate trip if not authenticated and hasn't seen it
    if (isLoading) return;

    const hasSeen = localStorage.getItem('has_seen_lead_curation_invite');
    if (!isAuthenticated && hasSeen !== 'true') {
      const timer = setTimeout(() => {
        openLeadModal({
          sourceCta: 'LANDING_PROACTIVE_INVITE',
          intent: 'Plan My Kashmir Trip'
        });
        localStorage.setItem('has_seen_lead_curation_invite', 'true');
      }, 12000); // 12 seconds delay after land
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, openLeadModal]);

  return (
    <div className="min-h-screen bg-[#F8F8F9] dark:bg-[#05080a] text-slate-900 dark:text-white transition-colors">
      <SeoMeta 
        title="Luxury Kashmir Tour Packages, B2B Travel Partner DMC & Custom Itineraries"
        description="Book bespoke luxury travel experiences in Kashmir or partner as a verified travel agent. Direct B2B net rates, premium Dal Lake houseboats, private ski chalets, and 24/7 ground execution."
        keywords="kashmir tour packages, kashmir b2b dmc, travel agent net rates kashmir, gulmarg luxury resort, srinagar houseboats, pahalgam vacation planner, kashmir curators"
        schema={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://kashmircurators.com/#website",
              "url": "https://kashmircurators.com",
              "name": "Kashmir Curators & B2B Partner DMC",
              "description": "Bespoke Luxury Travel Curators & Direct Ground DMC for Kashmir Tours"
            },
            {
              "@type": "Organization",
              "@id": "https://kashmircurators.com/#organization",
              "name": "Kashmir Curators",
              "url": "https://kashmircurators.com",
              "logo": "https://kashmircurators.com/logo.png",
              "sameAs": [
                "https://facebook.com/kashmircurators",
                "https://instagram.com/kashmircurators"
              ]
            }
          ]
        }}
      />
      
      <Navbar />
      
      <main>
        {/* 1. Hero with Integrated Search Tabs */}
        <HeroSection />
        
        {/* 2. Live Valley Radar & Corridor Trust Strip */}
        <div className="relative z-20 -mt-6">
          <DynamicCurationTicker />
          <TravelStatusWidget />
        </div>

        {/* 3. Iconic Valley Destinations */}
        <DestinationsGrid />

        {/* 4. Curated Luxury Packages */}
        <FeaturedPackages />

        {/* 5. Dedicated B2B Travel Agent & DMC Operating System */}
        <B2BPartnerSection />

        {/* 6. The Curators Craft & Ground Authenticity */}
        <AuthenticityFeatures />

        {/* 7. Social Proof & Reviews */}
        <Testimonials />

        {/* 8. Minimalist Collapsible FAQ */}
        <FAQSection />

        {/* 9. Unified Closing Consultation & Agent Onboarding Card */}
        <UnifiedClosingCta />
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
};

export default Index;
