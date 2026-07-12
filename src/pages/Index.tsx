import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import HeroSection from '@/components/home/HeroSection';
import { InteractiveTripPlanner } from '@/components/planner/InteractiveTripPlanner';
import DestinationsGrid from '@/components/home/DestinationsGrid';
import AuthenticityFeatures from '@/components/home/AuthenticityFeatures';
import FeaturedPackages from '@/components/home/FeaturedPackages';
import VisualItinerary from '@/components/home/VisualItinerary';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import FAQSection from '@/components/home/FAQSection';
import NewsletterSignup from '@/components/home/NewsletterSignup';
import ContactSection from '@/components/home/ContactSection';
import DynamicCurationTicker from '@/components/home/DynamicCurationTicker';
import SeoMeta from '@/components/SeoMeta';

const Index = () => {
  return (
    <div className="min-h-screen">
      <SeoMeta 
        title="Luxury Kashmir Tour Packages & Custom Itineraries"
        description="Book bespoke luxury travel experiences in Kashmir. Premium Dal Lake houseboats, private ski chalets in Gulmarg, and custom shepherds paths in Pahalgam."
        keywords="kashmir tour packages, gulmarg luxury resort, srinagar houseboats, pahalgam vacation planner, kashmir curators"
        schema={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://kashmircurators.com/#website",
              "url": "https://kashmircurators.com",
              "name": "Kashmir Curators",
              "description": "Bespoke Luxury Travel Curators for Kashmir Tours"
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
        <HeroSection />
        <DynamicCurationTicker />
        
        <section className="py-24 bg-transparent relative overflow-hidden" id="planner">
          {/* Subtle background decoration */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#b5852a 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          <div className="container mx-auto px-4 relative z-10">
            <InteractiveTripPlanner />
          </div>
        </section>

        <DestinationsGrid />
        <AuthenticityFeatures />
        <FeaturedPackages />
        <VisualItinerary />
        <HowItWorks />
        <Testimonials />
        <FAQSection />
        <NewsletterSignup />
        <ContactSection />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
};

export default Index;

