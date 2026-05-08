import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import HeroSection from '@/components/home/HeroSection';
import DestinationsGrid from '@/components/home/DestinationsGrid';
import AuthenticityFeatures from '@/components/home/AuthenticityFeatures';
import FeaturedPackages from '@/components/home/FeaturedPackages';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import FAQSection from '@/components/home/FAQSection';
import NewsletterSignup from '@/components/home/NewsletterSignup';
import ContactSection from '@/components/home/ContactSection';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <DestinationsGrid />
        <AuthenticityFeatures />
        <FeaturedPackages />
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
