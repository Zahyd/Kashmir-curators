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
