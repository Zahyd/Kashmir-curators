import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';

// Absolute path to fallback JSON data storage
const fallbackFilePath = path.join(__dirname, '../data/siteContent.json');
const revisionHistoryFilePath = path.join(__dirname, '../data/siteContentRevisions.json');

// Ensure parent folder exists
if (!fs.existsSync(path.dirname(fallbackFilePath))) {
  fs.mkdirSync(path.dirname(fallbackFilePath), { recursive: true });
}

// Comprehensive Initial Defaults matching existing Landing Page 100%
export const defaultContent: Record<string, any> = {
  hero: {
    section_key: 'hero',
    title: 'BEYOND the ORDINARY',
    subtitle: 'Experience Kashmir as it was meant to be seen: Private, Peerless, and Profoundly Beautiful.',
    image_url: '',
    content: {
      badge_text: 'Valley Operations Telemetry 2026',
      cta_text: 'Curate Your Journey',
      cta_phone: '+91 91037 98448',
      stat1_label: 'Elite Curations',
      stat1_value: '1,200+',
      stat2_label: 'Satisfaction Index',
      stat2_value: '4.95',
      stat3_label: 'Concierge Protocol',
      stat3_value: '24/7',
      enabled_tabs: ['packages', 'hotels', 'cabs', 'flights', 'bus']
    }
  },
  ticker: {
    section_key: 'ticker',
    title: 'Live Valley Radar',
    subtitle: 'Corridor updates and weather advisories',
    image_url: '',
    content: {
      is_enabled: true,
      speed: 35,
      badge_text: 'LIVE VALLEY DISPATCH',
      announcements: [
        'NH44 Jammu-Srinagar Highway: All corridors open with normal 4x4 movement.',
        'Gulmarg Phase 1 & 2 Gondola Operating smoothly. Clear skies forecast.',
        'Dal Lake & Nigeen Lake: Heritage Houseboat check-ins on schedule.',
        'Pahalgam-Aru-Chandanwari route verified safe and fully operational.',
        'Srinagar International Airport (SXR): All domestic arrivals on standard schedule.'
      ]
    }
  },
  destinations: {
    section_key: 'destinations',
    title: 'SIGNATURE LOCATIONS',
    subtitle: 'Beyond the maps, discover the hidden soul of the valley through our handpicked premier destinations.',
    image_url: '',
    content: {
      badge_text: 'Curated Geography',
      items: [
        {
          id: 'dest-1',
          name: 'Srinagar',
          image: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=1200',
          tagline: 'The City of Eternal Lakes',
          desc: 'Venice of the East, where luxury floats on silent waters.',
          colSpan: 'col-span-1 md:col-span-2',
          rowSpan: 'row-span-1 md:row-span-2',
          isActive: true
        },
        {
          id: 'dest-2',
          name: 'Gulmarg',
          image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800',
          tagline: 'The Alpine Sanctuary',
          desc: 'World-class peaks and pristine winter elegance.',
          colSpan: 'col-span-1 md:col-span-2',
          rowSpan: 'row-span-1',
          isActive: true
        },
        {
          id: 'dest-3',
          name: 'Pahalgam',
          image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800',
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
      ]
    }
  },
  featuredPackagesSection: {
    section_key: 'featuredPackagesSection',
    title: 'PRIVATE COLLECTIONS',
    subtitle: 'Exclusive itineraries engineered for those who demand transparent pricing and perfection in every mile.',
    image_url: '',
    content: {
      badge_text: 'Seasonal Selections',
      view_all_text: 'Explore All Expeditions',
      featured_only: true,
      max_display: 4
    }
  },
  b2bSection: {
    section_key: 'b2bSection',
    title: 'Powering 400+ Travel Agents',
    subtitle: 'Stop losing bookings to opaque cab unions and sudden road disruptions. Access contracted wholesale net rates, build white-label client proposals in 90 seconds, and deliver 24/7 on-ground execution.',
    image_url: '',
    content: {
      badge_text: 'Kashmir Connect B2B Travel Operating System',
      pillars: [
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
    }
  },
  authenticity: {
    section_key: 'authenticity',
    title: 'IMPECCABLE CRAFTSMANSHIP',
    subtitle: "We don't just plan travel; we engineer memories. Every detail is a deliberate act of luxury, designed for the world's most discerning travelers.",
    image_url: '',
    content: {
      badge_text: 'The Curators Standard',
      features: [
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
    }
  },
  testimonialsSection: {
    section_key: 'testimonialsSection',
    title: 'CURATED MEMORIES',
    subtitle: 'Unfiltered reflections from high-profile guests, family travelers, and partner agencies across India and abroad.',
    image_url: '',
    content: {
      badge_text: 'Client Voices'
    }
  },
  faqsSection: {
    section_key: 'faqsSection',
    title: 'FREQUENTLY ASKED QUESTIONS',
    subtitle: 'Clear, transparent answers about valley permits, weather conditions, booking procedures, and security protocols.',
    image_url: '',
    content: {
      badge_text: 'Direct Answers'
    }
  },
  closingCta: {
    section_key: 'closingCta',
    title: 'Ready to Experience Paradise?',
    subtitle: 'Speak with a Senior Kashmir Destination Specialist or request a bespoke itinerary within 30 minutes.',
    image_url: '',
    content: {
      response_time_text: 'Average response time: 24 minutes',
      direct_phone: '+91 91037 98448',
      button_text: 'Request Free Consultation',
      points: [
        'Contracted direct ground net rates',
        'Complimentary airport concierge meet & greet',
        '100% weather & disruption flexible cancellation'
      ]
    }
  },
  navbar: {
    section_key: 'navbar',
    title: 'Navigation Header Liaison',
    subtitle: 'Header configuration, phone, emergency badge & links',
    image_url: '',
    content: {
      brand_name: 'The Kashmir Curators',
      phone: '+91 91037 98448',
      emergency_badge: 'Valley Weather: Open & Safe',
      cta_text: 'Plan My Trip',
      links: [
        { label: 'Packages', path: '/packages' },
        { label: 'Hotels', path: '/hotels' },
        { label: 'Cabs', path: '/cabs' },
        { label: 'Planner', path: '/planner' },
        { label: 'About', path: '/about' }
      ]
    }
  },
  footer: {
    section_key: 'footer',
    title: 'Valley Ground Liaison',
    subtitle: 'Footer configuration and direct contact protocol',
    image_url: '',
    content: {
      description: 'The premier registry for high-fidelity travel experiences across the Kashmir valley. Curating excellence since 2012.',
      address: 'Watergam, Rafiabad, Sopore, 193303',
      phone: '+91 91037 98448',
      email: 'Zahidreyaz44123@gmail.com',
      copyright: '© 2026 The Kashmir Curators',
      registration_text: 'Registered with Department of Tourism, Government of Jammu & Kashmir'
    }
  },
  socialMedia: {
    section_key: 'socialMedia',
    title: 'Brand Social Footprint',
    subtitle: 'Manage the outbound connection links for the Footer.',
    image_url: '',
    content: {
      facebook: 'https://facebook.com/kashmircurators',
      instagram: 'https://instagram.com/kashmircurators',
      twitter: 'https://twitter.com/kashmircurators',
      youtube: 'https://youtube.com/@kashmircurators'
    }
  },
  seo: {
    section_key: 'seo',
    title: 'Global SEO Suite',
    subtitle: 'Search Engine Optimization and Social Sharing Tags',
    image_url: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=1200',
    content: {
      site_name: 'The Kashmir Curators',
      default_title: 'Luxury Kashmir Tour Packages, B2B Travel Partner DMC & Custom Itineraries',
      default_description: 'Book bespoke luxury travel experiences in Kashmir or partner as a verified travel agent. Direct B2B net rates, premium Dal Lake houseboats, private ski chalets, and 24/7 ground execution.',
      default_keywords: 'kashmir tour packages, kashmir b2b dmc, travel agent net rates kashmir, gulmarg luxury resort, srinagar houseboats, pahalgam vacation planner, kashmir curators',
      canonical_base: 'https://kashmir-curators.vercel.app',
      google_verification: 'Cy5eLotuqR5YZT1HJxzC___F1gzOHEFFtmtExKMyNvs',
      enable_sitemap_ping: true
    }
  },
  pageSectionsOrder: {
    section_key: 'pageSectionsOrder',
    title: 'Landing Page Section Order & Visibility',
    subtitle: 'Drag and drop or toggle sections on the live public home page',
    image_url: '',
    content: {
      sections: [
        { id: 'hero', name: 'Hero & Search Tabs', isVisible: true, order: 1 },
        { id: 'radar', name: 'Valley Radar & Live Ticker', isVisible: true, order: 2 },
        { id: 'destinations', name: 'Signature Locations Grid', isVisible: true, order: 3 },
        { id: 'featuredPackages', name: 'Curated Luxury Packages', isVisible: true, order: 4 },
        { id: 'b2bPartner', name: 'B2B Partner & Travel Agent OS', isVisible: true, order: 5 },
        { id: 'authenticity', name: 'Craftsmanship & Authenticity', isVisible: true, order: 6 },
        { id: 'testimonials', name: 'Guest Reviews & Testimonials', isVisible: true, order: 7 },
        { id: 'faqs', name: 'Collapsible FAQ Knowledgebase', isVisible: true, order: 8 },
        { id: 'closingCta', name: 'Closing Consultation CTA', isVisible: true, order: 9 }
      ]
    }
  },
  activities: {
    section_key: 'activities',
    title: 'Curated Experiences & Activities',
    subtitle: 'Manage authentic valley adventures and cultural immersions',
    image_url: '',
    content: {
      items: [
        {
          id: 'act-1',
          title: 'Dal Lake Private Sunset Shikara',
          location: 'Srinagar',
          duration: '2 Hours',
          price: 1500,
          category: 'Heritage & Leisure',
          badge: 'Iconic',
          image: 'https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?w=800',
          description: 'Glide through floating lotus gardens, Char Chinar, and golden sunset reflections with fresh saffron kahwa.',
          isActive: true
        },
        {
          id: 'act-2',
          title: 'Apharwat Peak Gondola Snow Ride (Phase 2)',
          location: 'Gulmarg',
          duration: 'Half Day',
          price: 2400,
          category: 'Alpine Adventure',
          badge: 'High Altitude',
          image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
          description: 'Ascend to 14,000 ft on Asia highest cable car. Walk on eternal powder snow with panoramic views of Nanga Parbat.',
          isActive: true
        },
        {
          id: 'act-3',
          title: 'Lidder River White Water Rafting & Trout Fishing',
          location: 'Pahalgam',
          duration: '3 Hours',
          price: 2800,
          category: 'Thrill & Rivers',
          badge: 'Summer Thrill',
          image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800',
          description: 'Navigate Grade II-III rapids along pine-flanked waters, followed by private riverside angling.',
          isActive: true
        },
        {
          id: 'act-4',
          title: 'Royal 36-Course Wazwan Gastronomy Tasting',
          location: 'Srinagar Old City',
          duration: 'Evening Feast',
          price: 3200,
          category: 'Culinary Masterclass',
          badge: 'Authentic',
          image: 'https://images.unsplash.com/photo-1617653202545-931490e875e6?w=800',
          description: 'Feast on Rista, Rogan Josh, Tabak Maaz, and Gushtaba prepared by 4th-generation master Wazas over copper traamis.',
          isActive: true
        }
      ]
    }
  },
  coupons: {
    section_key: 'coupons',
    title: 'Promotions & Vouchers',
    subtitle: 'Discount coupons and seasonal promotional offers',
    image_url: '',
    content: {
      items: [
        {
          id: 'coup-1',
          code: 'PARADISE2026',
          title: 'Early Season Privilege',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          maxDiscount: 5000,
          minOrderValue: 25000,
          validUntil: '2026-12-31',
          usageLimit: 100,
          usedCount: 28,
          isActive: true
        },
        {
          id: 'coup-2',
          code: 'HONEYMOONVIBES',
          title: 'Romantic Valley Escapes',
          discountType: 'FLAT',
          discountValue: 3500,
          maxDiscount: 3500,
          minOrderValue: 40000,
          validUntil: '2026-12-31',
          usageLimit: 50,
          usedCount: 14,
          isActive: true
        },
        {
          id: 'coup-3',
          code: 'B2BPARTNER5',
          title: 'Agent Wholesale Rebate',
          discountType: 'PERCENTAGE',
          discountValue: 5,
          maxDiscount: 10000,
          minOrderValue: 50000,
          validUntil: '2027-03-31',
          usageLimit: 500,
          usedCount: 89,
          isActive: true
        }
      ]
    }
  },
  about: {
    section_key: 'about',
    title: 'The Kashmir Curators Difference',
    subtitle: 'Uncompromising Luxury and Authentic Experiences',
    image_url: '',
    content: {
      description: 'We are a premier luxury travel atelier specializing in bespoke Kashmir tourism, delivering unparalleled private experiences.',
      experience_years: '14+ Years',
      destinations_covered: '18 Valleys',
      certified_drivers: '150+ Vehicles',
      heritage_houseboats: '25 Private Suites'
    }
  }
};

// Reads local cache JSON file
const readFallback = (): Record<string, any> => {
  try {
    if (fs.existsSync(fallbackFilePath)) {
      const data = fs.readFileSync(fallbackFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      return { ...defaultContent, ...parsed };
    }
  } catch (e) {
    console.error('Failed to read fallback site content file:', e);
  }
  return defaultContent;
};

// Writes local cache JSON file
const writeFallback = (data: Record<string, any>) => {
  try {
    fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write fallback site content file:', e);
  }
};

// Saves a revision snapshot for rollback
const recordRevision = (sectionKey: string, oldData: any) => {
  try {
    let revisions: any[] = [];
    if (fs.existsSync(revisionHistoryFilePath)) {
      revisions = JSON.parse(fs.readFileSync(revisionHistoryFilePath, 'utf-8') || '[]');
    }
    revisions.unshift({
      id: 'rev_' + Date.now(),
      sectionKey,
      timestamp: new Date().toISOString(),
      data: oldData
    });
    // Keep max 50 historical revisions
    if (revisions.length > 50) revisions = revisions.slice(0, 50);
    fs.writeFileSync(revisionHistoryFilePath, JSON.stringify(revisions, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to record CMS revision:', e);
  }
};

export const getSiteContent = async (req: Request, res: Response) => {
  try {
    const dbItems = await (prisma as any).siteContent.findMany();
    if (dbItems && dbItems.length > 0) {
      const contentMap: Record<string, any> = {};
      dbItems.forEach((item: any) => {
        contentMap[item.sectionKey] = {
          id: item.id,
          section_key: item.sectionKey,
          title: item.title,
          subtitle: item.subtitle,
          content: item.content,
          image_url: item.imageUrl,
        };
      });
      
      const responseData = { ...defaultContent, ...contentMap };
      return res.json(responseData);
    }
  } catch (dbError) {
    console.log('Prisma siteContent table not loaded or migrated. Falling back to local cache.');
  }

  const fallbackData = readFallback();
  res.json({ ...defaultContent, ...fallbackData });
};

export const saveSiteContentSection = async (req: any, res: Response) => {
  const { sectionKey } = req.params;
  const { title, subtitle, content, image_url } = req.body;

  // Track revision of existing state before save
  const currentFallback = readFallback();
  if (currentFallback[sectionKey]) {
    recordRevision(sectionKey, currentFallback[sectionKey]);
  }

  const updatedSection = {
    section_key: sectionKey,
    title: title !== undefined ? title : (currentFallback[sectionKey]?.title || null),
    subtitle: subtitle !== undefined ? subtitle : (currentFallback[sectionKey]?.subtitle || null),
    content: content !== undefined ? content : (currentFallback[sectionKey]?.content || {}),
    image_url: image_url !== undefined ? image_url : (currentFallback[sectionKey]?.image_url || null),
  };

  try {
    await (prisma as any).siteContent.upsert({
      where: { sectionKey },
      update: {
        title: updatedSection.title,
        subtitle: updatedSection.subtitle,
        content: updatedSection.content,
        imageUrl: updatedSection.image_url,
      },
      create: {
        sectionKey,
        title: updatedSection.title,
        subtitle: updatedSection.subtitle,
        content: updatedSection.content,
        imageUrl: updatedSection.image_url,
      },
    });
  } catch (dbError) {
    console.log('Prisma siteContent save bypassed. Saving to fallback local JSON store.');
  }

  currentFallback[sectionKey] = updatedSection;
  writeFallback(currentFallback);

  // Broadcast real-time update to all connected clients & public landing pages
  if (req.io) {
    req.io.emit('site-content-updated', {
      sectionKey,
      data: updatedSection
    });

    if (sectionKey === 'pageSectionsOrder') {
      req.io.emit('page-sections-updated', updatedSection.content);
    }
  }

  res.json({
    success: true,
    section: updatedSection
  });
};

export const saveBatchSiteContent = async (req: any, res: Response) => {
  const { sections } = req.body; // Record<string, Partial<SiteContent>>
  if (!sections || typeof sections !== 'object') {
    return res.status(400).json({ error: 'Sections object is required' });
  }

  const currentFallback = readFallback();
  const updatedKeys = Object.keys(sections);

  for (const key of updatedKeys) {
    const sec = sections[key];
    if (currentFallback[key]) {
      recordRevision(key, currentFallback[key]);
    }
    currentFallback[key] = {
      section_key: key,
      title: sec.title !== undefined ? sec.title : (currentFallback[key]?.title || null),
      subtitle: sec.subtitle !== undefined ? sec.subtitle : (currentFallback[key]?.subtitle || null),
      content: sec.content !== undefined ? sec.content : (currentFallback[key]?.content || {}),
      image_url: sec.image_url !== undefined ? sec.image_url : (currentFallback[key]?.image_url || null),
    };

    try {
      await (prisma as any).siteContent.upsert({
        where: { sectionKey: key },
        update: {
          title: currentFallback[key].title,
          subtitle: currentFallback[key].subtitle,
          content: currentFallback[key].content,
          imageUrl: currentFallback[key].image_url,
        },
        create: {
          sectionKey: key,
          title: currentFallback[key].title,
          subtitle: currentFallback[key].subtitle,
          content: currentFallback[key].content,
          imageUrl: currentFallback[key].image_url,
        },
      });
    } catch (e) {
      // Handled by JSON fallback
    }

    if (req.io) {
      req.io.emit('site-content-updated', {
        sectionKey: key,
        data: currentFallback[key]
      });
    }
  }

  writeFallback(currentFallback);

  res.json({
    success: true,
    updatedKeys,
    data: currentFallback
  });
};

export const getRevisions = async (req: Request, res: Response) => {
  try {
    if (fs.existsSync(revisionHistoryFilePath)) {
      const revisions = JSON.parse(fs.readFileSync(revisionHistoryFilePath, 'utf-8') || '[]');
      return res.json(revisions);
    }
  } catch (e) {
    console.error('Failed to load revisions:', e);
  }
  res.json([]);
};

export const revertRevision = async (req: any, res: Response) => {
  const { revisionId } = req.body;
  if (!revisionId) {
    return res.status(400).json({ error: 'Revision ID is required' });
  }

  try {
    if (fs.existsSync(revisionHistoryFilePath)) {
      const revisions = JSON.parse(fs.readFileSync(revisionHistoryFilePath, 'utf-8') || '[]');
      const target = revisions.find((r: any) => r.id === revisionId);
      if (target) {
        const { sectionKey, data } = target;
        const currentFallback = readFallback();
        currentFallback[sectionKey] = data;
        writeFallback(currentFallback);

        if (req.io) {
          req.io.emit('site-content-updated', {
            sectionKey,
            data
          });
        }

        return res.json({ success: true, message: `Reverted ${sectionKey} successfully`, section: data });
      }
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }

  res.status(404).json({ error: 'Revision not found' });
};

export const resetToDefaults = async (req: any, res: Response) => {
  const { sectionKey } = req.params;
  const targetDefault = defaultContent[sectionKey];

  if (!targetDefault) {
    return res.status(404).json({ error: `No default template found for section '${sectionKey}'` });
  }

  const currentFallback = readFallback();
  if (currentFallback[sectionKey]) {
    recordRevision(sectionKey, currentFallback[sectionKey]);
  }

  currentFallback[sectionKey] = targetDefault;
  writeFallback(currentFallback);

  try {
    await (prisma as any).siteContent.upsert({
      where: { sectionKey },
      update: {
        title: targetDefault.title,
        subtitle: targetDefault.subtitle,
        content: targetDefault.content,
        imageUrl: targetDefault.image_url,
      },
      create: {
        sectionKey,
        title: targetDefault.title,
        subtitle: targetDefault.subtitle,
        content: targetDefault.content,
        imageUrl: targetDefault.image_url,
      },
    });
  } catch (e) {
    // Handled by JSON fallback
  }

  if (req.io) {
    req.io.emit('site-content-updated', {
      sectionKey,
      data: targetDefault
    });
  }

  res.json({
    success: true,
    message: `Reset ${sectionKey} to default system template`,
    section: targetDefault
  });
};
