import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';
import heroImage from '@/assets/kashmir-hero-new.jpg';
import srinagarImg from '@/assets/kashmir-hero-new.jpg';
import gulmargImg from '@/assets/gulmarg.jpg';
import pahalgamImg from '@/assets/pahalgam.jpg';

export interface DestinationItem {
  id: string;
  name: string;
  image: string;
  tagline: string;
  desc: string;
  colSpan?: string;
  rowSpan?: string;
  isActive?: boolean;
}

export interface B2BPillar {
  title: string;
  desc: string;
  highlight: string;
  icon: string;
}

export interface AuthenticityFeature {
  icon: string;
  title: string;
  description: string;
  badge: string;
}

export interface PageSectionConfig {
  id: string;
  name: string;
  isVisible: boolean;
  order: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  location: string;
  duration: string;
  price: number;
  category: string;
  badge: string;
  image: string;
  description: string;
  isActive: boolean;
}

export interface CouponItem {
  id: string;
  code: string;
  title: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  validUntil: string;
  usageLimit?: number;
  usedCount?: number;
  isActive: boolean;
}

export const DEFAULT_DESTINATIONS: DestinationItem[] = [
  {
    id: 'dest-1',
    name: 'Srinagar',
    image: srinagarImg,
    tagline: 'The City of Eternal Lakes',
    desc: 'Venice of the East, where luxury floats on silent waters.',
    colSpan: 'col-span-1 md:col-span-2',
    rowSpan: 'row-span-1 md:row-span-2',
    isActive: true
  },
  {
    id: 'dest-2',
    name: 'Gulmarg',
    image: gulmargImg,
    tagline: 'The Alpine Sanctuary',
    desc: 'World-class peaks and pristine winter elegance.',
    colSpan: 'col-span-1 md:col-span-2',
    rowSpan: 'row-span-1',
    isActive: true
  },
  {
    id: 'dest-3',
    name: 'Pahalgam',
    image: pahalgamImg,
    tagline: 'The Valley of Quietude',
    desc: 'Serene riverbanks and ancient pine-scented air.',
    colSpan: 'col-span-1 md:col-span-1',
    rowSpan: 'row-span-1',
    isActive: true
  },
  {
    id: 'dest-4',
    name: 'Sonmarg',
    image: 'https://images.unsplash.com/photo-1595932594611-6beec02f61aa?w=800',
    tagline: 'The Meadow of Gold',
    desc: 'Where glaciers meet the sky in a golden embrace.',
    colSpan: 'col-span-1 md:col-span-1',
    rowSpan: 'row-span-1',
    isActive: true
  }
];

export const DEFAULT_PAGE_SECTIONS: PageSectionConfig[] = [
  { id: 'hero', name: 'Hero & Search Tabs', isVisible: true, order: 1 },
  { id: 'radar', name: 'Valley Radar & Live Ticker', isVisible: true, order: 2 },
  { id: 'destinations', name: 'Signature Locations Grid', isVisible: true, order: 3 },
  { id: 'featuredPackages', name: 'Curated Luxury Packages', isVisible: true, order: 4 },
  { id: 'fleet', name: 'VIP Chauffeur Fleet & 4x4 Transit', isVisible: true, order: 5 },
  { id: 'b2bPartner', name: 'B2B Partner & Travel Agent OS', isVisible: true, order: 6 },
  { id: 'authenticity', name: 'Craftsmanship & Authenticity', isVisible: true, order: 7 },
  { id: 'testimonials', name: 'Guest Reviews & Testimonials', isVisible: true, order: 8 },
  { id: 'faqs', name: 'Collapsible FAQ Knowledgebase', isVisible: true, order: 9 },
  { id: 'closingCta', name: 'Closing Consultation CTA', isVisible: true, order: 10 }
];

export function useLandingPageContent() {
  const [content, setContent] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/site-content`);
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch (err) {
      console.error('Failed to fetch CMS site content:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();

    // Listen for instant real-time live synchronization
    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);

    socket.on('site-content-updated', ({ sectionKey, data }) => {
      setContent(prev => ({
        ...prev,
        [sectionKey]: data
      }));
    });

    socket.on('page-sections-updated', (sectionsData) => {
      setContent(prev => ({
        ...prev,
        pageSectionsOrder: {
          ...prev.pageSectionsOrder,
          content: sectionsData
        }
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchContent]);

  // Section Getters with 100% Non-Regression Fallbacks
  const hero = {
    title: content?.hero?.title || 'BEYOND the ORDINARY',
    subtitle: content?.hero?.subtitle || 'Experience Kashmir as it was meant to be seen: Private, Peerless, and Profoundly Beautiful.',
    imageUrl: content?.hero?.image_url || heroImage,
    badgeText: content?.hero?.content?.badge_text || 'Valley Operations Telemetry 2026',
    ctaText: content?.hero?.content?.cta_text || 'Curate Your Journey',
    ctaPhone: content?.hero?.content?.cta_phone || '+91 91037 98448',
    enabledTabs: content?.hero?.content?.enabled_tabs || ['packages', 'hotels', 'cabs', 'flights', 'bus'],
    stats: [
      { 
        value: content?.hero?.content?.stat1_value || '1,200+', 
        label: content?.hero?.content?.stat1_label || 'Elite Curations' 
      },
      { 
        value: content?.hero?.content?.stat2_value || '4.95', 
        label: content?.hero?.content?.stat2_label || 'Satisfaction Index' 
      },
      { 
        value: content?.hero?.content?.stat3_value || '24/7', 
        label: content?.hero?.content?.stat3_label || 'Concierge Protocol' 
      },
    ]
  };

  const ticker = {
    isEnabled: content?.ticker?.content?.is_enabled ?? true,
    speed: content?.ticker?.content?.speed ?? 35,
    badgeText: content?.ticker?.content?.badge_text || 'LIVE VALLEY DISPATCH',
    announcements: content?.ticker?.content?.announcements || [
      'NH44 Jammu-Srinagar Highway: All corridors open with normal 4x4 movement.',
      'Gulmarg Phase 1 & 2 Gondola Operating smoothly. Clear skies forecast.',
      'Dal Lake & Nigeen Lake: Heritage Houseboat check-ins on schedule.',
      'Pahalgam-Aru-Chandanwari route verified safe and fully operational.',
      'Srinagar International Airport (SXR): All domestic arrivals on standard schedule.'
    ]
  };

  const destinations = {
    title: content?.destinations?.title || 'SIGNATURE LOCATIONS',
    subtitle: content?.destinations?.subtitle || 'Beyond the maps, discover the hidden soul of the valley through our handpicked premier destinations.',
    badgeText: content?.destinations?.content?.badge_text || 'Curated Geography',
    items: (content?.destinations?.content?.items && content.destinations.content.items.length > 0)
      ? content.destinations.content.items
      : DEFAULT_DESTINATIONS
  };

  const featuredPackagesSection = {
    badgeText: content?.featuredPackagesSection?.content?.badge_text || 'Seasonal Selections',
    title: content?.featuredPackagesSection?.title || 'PRIVATE COLLECTIONS',
    subtitle: content?.featuredPackagesSection?.subtitle || 'Exclusive itineraries engineered for those who demand transparent pricing and perfection in every mile.',
    viewAllText: content?.featuredPackagesSection?.content?.view_all_text || 'Explore All Expeditions'
  };

  const b2bSection = {
    badgeText: content?.b2bSection?.content?.badge_text || 'Kashmir Connect B2B Travel Operating System',
    title: content?.b2bSection?.title || 'Powering 400+ Travel Agents',
    subtitle: content?.b2bSection?.subtitle || 'Stop losing bookings to opaque cab unions and sudden road disruptions. Access contracted wholesale net rates, build white-label client proposals in 90 seconds, and deliver 24/7 on-ground execution.',
    pillars: content?.b2bSection?.content?.pillars || [
      {
        title: 'Contracted B2B Net Rates',
        desc: 'Wholesale tariffs for Dal Lake houseboats, Gulmarg ski chalets, and private 4x4 snow fleets. Zero broker markups.',
        highlight: 'Locked seasonal pricing',
        icon: 'Landmark'
      },
      {
        title: 'White-Label Quote Studio',
        desc: 'Create day-wise custom itineraries with your agency logo, phone, and custom markup in under 90 seconds.',
        highlight: 'Instant PDF export',
        icon: 'Sparkles'
      },
      {
        title: 'Zero Union Disruption Hub',
        desc: 'Live valley road radar, dynamic vehicle re-allocation, and direct local taxi union clearance protocols.',
        highlight: 'Guaranteed cab transit',
        icon: 'ShieldCheck'
      },
      {
        title: 'Dedicated Ground Concierge',
        desc: '24/7 Srinagar airport welcoming escort, on-call crisis liaison, and dedicated travel manager for VIP clients.',
        highlight: 'Personal valley escort',
        icon: 'Users2'
      }
    ]
  };

  const authenticity = {
    badgeText: content?.authenticity?.content?.badge_text || 'The Curators Standard',
    title: content?.authenticity?.title || 'IMPECCABLE CRAFTSMANSHIP',
    subtitle: content?.authenticity?.subtitle || "We don't just plan travel; we engineer memories. Every detail is a deliberate act of luxury, designed for the world's most discerning travelers.",
    features: content?.authenticity?.content?.features || [
      {
        icon: 'Globe',
        title: 'Native Guardians',
        description: 'Our curators are local descendants, offering access to hidden estates and untold ancestral stories.',
        badge: 'Elite Access'
      },
      {
        icon: 'Crown',
        title: 'Bespoke Luxury',
        description: 'From private heritage houseboats to hidden alpine villas, we define the peak of Kashmiri elegance.',
        badge: 'Signature'
      },
      {
        icon: 'Zap',
        title: 'Instant Protocol',
        description: 'A 24/7 dedicated concierge at your command, ensuring every whim is met with absolute precision.',
        badge: 'Priority'
      },
      {
        icon: 'Shield',
        title: 'Verified Legacy',
        description: 'Every interaction and estate is rigorously audited for security, privacy, and impeccable quality.',
        badge: 'Audited'
      }
    ]
  };

  const testimonialsSection = {
    badgeText: content?.testimonialsSection?.content?.badge_text || 'Client Voices',
    title: content?.testimonialsSection?.title || 'CURATED MEMORIES',
    subtitle: content?.testimonialsSection?.subtitle || 'Unfiltered reflections from high-profile guests, family travelers, and partner agencies across India and abroad.'
  };

  const faqsSection = {
    badgeText: content?.faqsSection?.content?.badge_text || 'Direct Answers',
    title: content?.faqsSection?.title || 'FREQUENTLY ASKED QUESTIONS',
    subtitle: content?.faqsSection?.subtitle || 'Clear, transparent answers about valley permits, weather conditions, booking procedures, and security protocols.'
  };

  const closingCta = {
    title: content?.closingCta?.title || 'Ready to Experience Paradise?',
    subtitle: content?.closingCta?.subtitle || 'Speak with a Senior Kashmir Destination Specialist or request a bespoke itinerary within 30 minutes.',
    responseTimeText: content?.closingCta?.content?.response_time_text || 'Average response time: 24 minutes',
    directPhone: content?.closingCta?.content?.direct_phone || '+91 91037 98448',
    buttonText: content?.closingCta?.content?.button_text || 'Request Free Consultation',
    points: content?.closingCta?.content?.points || [
      'Contracted direct ground net rates',
      'Complimentary airport concierge meet & greet',
      '100% weather & disruption flexible cancellation'
    ]
  };

  const navbar = {
    brandName: content?.navbar?.content?.brand_name || 'The Kashmir Curators',
    phone: content?.navbar?.content?.phone || '+91 91037 98448',
    emergencyBadge: content?.navbar?.content?.emergency_badge || 'Valley Weather: Open & Safe',
    ctaText: content?.navbar?.content?.cta_text || 'Plan My Trip',
    links: content?.navbar?.content?.links || [
      { label: 'Packages', path: '/packages' },
      { label: 'Hotels', path: '/hotels' },
      { label: 'Cabs', path: '/cabs' },
      { label: 'Planner', path: '/planner' },
      { label: 'About', path: '/about' }
    ]
  };

  const footer = {
    description: content?.footer?.content?.description || 'The premier registry for high-fidelity travel experiences across the Kashmir valley. Curating excellence since 2012.',
    address: content?.footer?.content?.address || 'Watergam, Rafiabad, Sopore, 193303',
    phone: content?.footer?.content?.phone || '+91 91037 98448',
    email: content?.footer?.content?.email || 'Zahidreyaz44123@gmail.com',
    copyright: content?.footer?.content?.copyright || '© 2026 The Kashmir Curators',
    registrationText: content?.footer?.content?.registration_text || 'Registered with Department of Tourism, Government of Jammu & Kashmir'
  };

  const socialMedia = {
    facebook: content?.socialMedia?.content?.facebook || 'https://facebook.com/kashmircurators',
    instagram: content?.socialMedia?.content?.instagram || 'https://instagram.com/kashmircurators',
    twitter: content?.socialMedia?.content?.twitter || 'https://twitter.com/kashmircurators',
    youtube: content?.socialMedia?.content?.youtube || 'https://youtube.com/@kashmircurators'
  };

  const seo = {
    siteName: content?.seo?.content?.site_name || 'The Kashmir Curators',
    defaultTitle: content?.seo?.content?.default_title || 'Luxury Kashmir Tour Packages, B2B Travel Partner DMC & Custom Itineraries',
    defaultDescription: content?.seo?.content?.default_description || 'Book bespoke luxury travel experiences in Kashmir or partner as a verified travel agent. Direct B2B net rates, premium Dal Lake houseboats, private ski chalets, and 24/7 ground execution.',
    defaultKeywords: content?.seo?.content?.default_keywords || 'kashmir tour packages, kashmir b2b dmc, travel agent net rates kashmir, gulmarg luxury resort, srinagar houseboats, pahalgam vacation planner, kashmir curators',
    ogImage: content?.seo?.image_url || 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=1200',
    canonicalBase: content?.seo?.content?.canonical_base || 'https://kashmir-curators.vercel.app'
  };

  const pageSectionsOrder: PageSectionConfig[] = content?.pageSectionsOrder?.content?.sections || DEFAULT_PAGE_SECTIONS;

  const activities: ActivityItem[] = content?.activities?.content?.items || [];
  const coupons: CouponItem[] = content?.coupons?.content?.items || [];

  return {
    content,
    hero,
    ticker,
    destinations,
    featuredPackagesSection,
    b2bSection,
    authenticity,
    testimonialsSection,
    faqsSection,
    closingCta,
    navbar,
    footer,
    socialMedia,
    seo,
    pageSectionsOrder,
    activities,
    coupons,
    isLoading,
    refetch: fetchContent
  };
}
