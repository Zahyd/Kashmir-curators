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
import { useLandingPageContent } from '@/hooks/useLandingPageContent';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { openLeadModal } = useLeadCapture();
  const { seo, pageSectionsOrder } = useLandingPageContent();

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

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':
        return <HeroSection key="hero" />;
      case 'radar':
        return (
          <div key="radar" className="relative z-20 -mt-6">
            <DynamicCurationTicker />
            <TravelStatusWidget />
          </div>
        );
      case 'destinations':
        return <DestinationsGrid key="destinations" />;
      case 'featuredPackages':
        return <FeaturedPackages key="featuredPackages" />;
      case 'b2bPartner':
        return <B2BPartnerSection key="b2bPartner" />;
      case 'authenticity':
        return <AuthenticityFeatures key="authenticity" />;
      case 'testimonials':
        return <Testimonials key="testimonials" />;
      case 'faqs':
        return <FAQSection key="faqs" />;
      case 'closingCta':
        return <UnifiedClosingCta key="closingCta" />;
      default:
        return null;
    }
  };

  const activeSections = (pageSectionsOrder && pageSectionsOrder.length > 0)
    ? [...pageSectionsOrder].filter(s => s.isVisible !== false).sort((a, b) => (a.order || 0) - (b.order || 0))
    : [
        { id: 'hero' },
        { id: 'radar' },
        { id: 'destinations' },
        { id: 'featuredPackages' },
        { id: 'b2bPartner' },
        { id: 'authenticity' },
        { id: 'testimonials' },
        { id: 'faqs' },
        { id: 'closingCta' }
      ];

  return (
    <div className="min-h-screen bg-[#F8F8F9] dark:bg-[#05080a] text-slate-900 dark:text-white transition-colors">
      <SeoMeta 
        title={seo.defaultTitle}
        description={seo.defaultDescription}
        keywords={seo.defaultKeywords}
        canonical={seo.canonicalBase}
        image={seo.ogImage}
        schema={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${seo.canonicalBase}/#website`,
              "url": seo.canonicalBase,
              "name": seo.siteName,
              "description": seo.defaultDescription
            },
            {
              "@type": "Organization",
              "@id": `${seo.canonicalBase}/#organization`,
              "name": seo.siteName,
              "url": seo.canonicalBase,
              "logo": `${seo.canonicalBase}/logo.png`,
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
        {activeSections.map(s => renderSection(s.id))}
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
};

export default Index;
