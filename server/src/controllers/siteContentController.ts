import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';

// Absolute path to fallback JSON data storage
const fallbackFilePath = path.join(__dirname, '../data/siteContent.json');

// Ensure parent folder exists
if (!fs.existsSync(path.dirname(fallbackFilePath))) {
  fs.mkdirSync(path.dirname(fallbackFilePath), { recursive: true });
}

// Initial defaults
const defaultContent: Record<string, any> = {
  hero: {
    section_key: 'hero',
    title: 'BEYOND the ORDINARY',
    subtitle: 'Experience Kashmir as it was meant to be seen: Private, Peerless, and Profoundly Beautiful.',
    content: {
      stat1_label: 'Elite Curations',
      stat1_value: '1,200+',
      stat2_label: 'Satisfaction Index',
      stat2_value: '4.95',
      stat3_label: 'Concierge Protocol',
      stat3_value: '24/7',
    },
    image_url: '',
  },
  about: {
    section_key: 'about',
    title: 'The Kashmir Curators Difference',
    subtitle: 'Uncompromising Luxury and Authentic Experiences',
    content: {
      description: 'We are a premier luxury travel atelier specializing in bespoke Kashmir tourism, delivering unparalleled private experiences.',
    },
    image_url: '',
  },
  socialMedia: {
    section_key: 'socialMedia',
    title: 'Brand Social Footprint',
    subtitle: 'Manage the outbound connection links for the Footer.',
    content: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      twitter: 'https://twitter.com',
      youtube: 'https://youtube.com'
    },
    image_url: ''
  },
  fleetHero: {
    section_key: 'fleetHero',
    title: 'Premium Transport',
    subtitle: 'Reliable cab services for airport transfers, local sightseeing, and outstation trips.',
    content: {},
    image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600'
  },
  hotelsHero: {
    section_key: 'hotelsHero',
    title: 'Luxury Stays in Kashmir',
    subtitle: 'From lakeside houseboats to cozy mountain retreats, find your perfect stay.',
    content: {},
    image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600'
  },
  packagesHero: {
    section_key: 'packagesHero',
    title: 'PRIVATE PORTFOLIO',
    subtitle: 'A meticulously curated registry of the finest expeditions across the Kashmir valley.',
    content: {},
    image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600'
  },
  journeyHero: {
    section_key: 'journeyHero',
    title: 'Design Your Journey',
    subtitle: 'BESPOKE TRAVEL CURATED FOR YOU',
    content: {},
    image_url: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80'
  },
  signatureItinerary: {
    section_key: 'signatureItinerary',
    title: 'THE SIGNATURE ITINERARY',
    subtitle: 'Day-by-day blueprint of our flagship 6-day Kashmir expedition.',
    content: {
      days: [
        {
          day: 1,
          title: "Srinagar Arrival & Shikara Sunset",
          subtitle: "VALLEY ENTRY PROTOCOL",
          route: "SXR Airport ➔ Dal Lake",
          duration: "15 km | 40 mins",
          image: "https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?auto=format&fit=crop&q=80&w=800",
          description: "Land at Srinagar Airport where your private chauffeur awaits. Check-in to a hand-carved cedarwood luxury houseboat. As dusk falls, board a private Shikara for a sunset cruise on the mirror-like waters of Dal Lake.",
          highlights: ["VIP airport greeting & transfer", "Luxury Heritage Houseboat boarding", "Sunset Shikara ride with Kashmiri Kahwa"],
          inclusions: [
            { icon: "plane", label: "Private Airport Transfer" },
            { icon: "compass", label: "Private Shikara Excursion" },
            { icon: "coffee", label: "Welcome Kahwa & High Tea" }
          ]
        },
        {
          day: 2,
          title: "Srinagar to Pahalgam Valley",
          subtitle: "RIVERSIDE COTTAGES & SAFFRON MEADOWS",
          route: "Srinagar ➔ Pahalgam",
          duration: "95 km | 2.5 hrs",
          image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=800",
          description: "Drive through the saffron fields of Pampore. Pass by ancient stone ruins of Avantipura before ascending into Pahalgam—the Valley of Shepherds. Check in to your ultra-private, riverside luxury cottage overlooking the Lidder River.",
          highlights: ["Saffron fields visit & tasting", "10th-century Avantipura ruins guided stop", "Soundscapes at Lidder riverside cottage"],
          inclusions: [
            { icon: "clock", label: "Private Chauffeur Escort" },
            { icon: "checkCircle", label: "Heritage Ruins Permits" },
            { icon: "coffee", label: "Riverside Fine-Dining Dinner" }
          ]
        },
        {
          day: 3,
          title: "Aru & Betaab Valleys",
          subtitle: "SHEPHERDS TRAILS & GLACIER STREAMWAYS",
          route: "Pahalgam Local Loop",
          duration: "30 km | 1.5 hrs",
          image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800",
          description: "Embark on an exclusive excursion to Betaab Valley—named after the famous Bollywood film—and the high-altitude meadow of Aru Valley. Walk along glacier streams and meet native shepherd families in their high pastures.",
          highlights: ["Guided hike through pine-forested meadows", "Picnic lunch beside glacier stream", "Interaction with local shepherd communities"],
          inclusions: [
            { icon: "compass", label: "Local Nature Guide" },
            { icon: "checkCircle", label: "Betaab & Aru Entry Permits" },
            { icon: "coffee", label: "Gourmet Meadow Picnic" }
          ]
        },
        {
          day: 4,
          title: "Pahalgam to Alpine Gulmarg",
          subtitle: "HIGHLANDS & PINE SKI CHALETS",
          route: "Pahalgam ➔ Gulmarg",
          duration: "140 km | 3.5 hrs",
          image: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&q=80&w=800",
          description: "Journey towards the majestic Pir Panjal range to Gulmarg—the Meadow of Flowers. Check in to a premium alpine ski resort. End the day with a forest walk beneath towering, snow-capped conifers.",
          highlights: ["Scenic drive passing high apple orchards", "Luxury alpine resort check-in", "Sunset woodland trail trek"],
          inclusions: [
            { icon: "clock", label: "Premium SUV Transfer" },
            { icon: "checkCircle", label: "Gulmarg Eco-Zone Access" },
            { icon: "coffee", label: "Traditional Wazwan Dinner" }
          ]
        },
        {
          day: 5,
          title: "Gondola Peak Ascend (Aphrawat)",
          subtitle: "HIGHEST CABLE CAR IN ASIA",
          route: "Gulmarg Gondola Loop",
          duration: "10 km | 30 mins",
          image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800",
          description: "Ascend to Apharwat Peak at 14,000 feet using Asia's highest and longest cable car system (Phase 1 & 2 pre-booked to skip all crowds). Walk on high-altitude snow fields and enjoy breathtaking views of Nanga Parbat.",
          highlights: ["Pre-booked VIP Gondola passes (both phases)", "Apharwat peak snow photography", "Hot tea at 14,000 feet alpine cafe"],
          inclusions: [
            { icon: "compass", label: "Pre-booked Gondola Tickets" },
            { icon: "checkCircle", label: "Ski / Snow Marshal Liaison" },
            { icon: "coffee", label: "High-Altitude Tea Service" }
          ]
        },
        {
          day: 6,
          title: "Gulmarg to Srinagar Airport",
          subtitle: "PASHMINA CRAFT & FAREWELL VALLEY",
          route: "Gulmarg ➔ Srinagar Airport",
          duration: "56 km | 1.5 hrs",
          image: "https://images.unsplash.com/photo-1617653202545-931490e875e6?auto=format&fit=crop&q=80&w=800",
          description: "Descend back to Srinagar for an exclusive, curated shopping excursion—visiting authentic weavers of Pashmina shawls and hand-knotted silk carpets. Chauffeur transfer to Srinagar Airport for departure.",
          highlights: ["Verified handloom artisan house visit", "Authentic souvenir & spice shopping guide", "Premium airport drop-off protocol"],
          inclusions: [
            { icon: "plane", label: "Airport Drop-off Escort" },
            { icon: "compass", label: "Curated Craft Tour Guide" },
            { icon: "coffee", label: "Farewell Saffron Kehwa" }
          ]
        }
      ]
    },
    image_url: ''
  }
};

// Reads local cache JSON file
const readFallback = (): Record<string, any> => {
  try {
    if (fs.existsSync(fallbackFilePath)) {
      const data = fs.readFileSync(fallbackFilePath, 'utf-8');
      return JSON.parse(data);
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

export const getSiteContent = async (req: Request, res: Response) => {
  try {
    // Attempt database load
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
      
      // Merge with defaults in case some keys are missing
      const responseData = { ...defaultContent, ...contentMap };
      return res.json(responseData);
    }
  } catch (dbError) {
    // Graceful fallback to file cache
    console.log('Prisma siteContent table not loaded or migrated. Falling back to local cache.');
  }

  // Load from local storage fallback
  const fallbackData = readFallback();
  res.json({ ...defaultContent, ...fallbackData });
};

export const saveSiteContentSection = async (req: any, res: Response) => {
  const { sectionKey } = req.params;
  const { title, subtitle, content, image_url } = req.body;

  try {
    // Attempt Prisma upsert
    const saved = await (prisma as any).siteContent.upsert({
      where: { sectionKey },
      update: {
        title: title || null,
        subtitle: subtitle || null,
        content: content || {},
        imageUrl: image_url || null,
      },
      create: {
        sectionKey,
        title: title || null,
        subtitle: subtitle || null,
        content: content || {},
        imageUrl: image_url || null,
      },
    });

    // Notify other connected sockets in real-time
    if (req.io) {
      req.io.emit('site-content-updated', {
        sectionKey,
        data: {
          section_key: sectionKey,
          title: title || null,
          subtitle: subtitle || null,
          content: content || {},
          image_url: image_url || null,
        }
      });
    }

    return res.json({
      success: true,
      section: {
        id: saved.id,
        section_key: saved.sectionKey,
        title: saved.title,
        subtitle: saved.subtitle,
        content: saved.content,
        image_url: saved.imageUrl,
      }
    });
  } catch (dbError) {
    console.log('Prisma siteContent save bypassed. Saving to fallback local JSON store.');
  }

  // Fallback Save to JSON Cache file
  const currentFallback = readFallback();
  const newSectionData = {
    section_key: sectionKey,
    title: title || null,
    subtitle: subtitle || null,
    content: content || {},
    image_url: image_url || null,
  };
  currentFallback[sectionKey] = newSectionData;
  writeFallback(currentFallback);

  // Notify other connected sockets in real-time
  if (req.io) {
    req.io.emit('site-content-updated', {
      sectionKey,
      data: newSectionData
    });
  }

  res.json({
    success: true,
    section: newSectionData
  });
};
