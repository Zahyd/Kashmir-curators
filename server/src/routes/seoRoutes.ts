import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/**
 * GET /sitemap.xml
 * Dynamically constructs and serves the search engine index map
 */
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const host = req.get('host') || 'kashmircurators.com';
    const protocol = req.secure ? 'https' : 'http';
    const domain = `${protocol}://${host}`;

    // 1. Core static marketing pages
    const staticPages = [
      '',
      '/packages',
      '/hotels',
      '/cabs',
      '/planner',
      '/auth'
    ];

    // 2. Fetch all dynamic packages from the database
    const dbPackages = await prisma.package.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true }
    });

    // 3. Build XML structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages serialization
    staticPages.forEach(route => {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}${route}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Dynamic pages serialization
    dbPackages.forEach(pkg => {
      const dateStr = pkg.updatedAt.toISOString().split('T')[0];
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/packages/${pkg.id}</loc>\n`;
      xml += `    <lastmod>${dateStr}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error: any) {
    console.error('[SEO: Sitemap] Dynamic generation failed:', error.message);
    res.status(500).send('Failed to build dynamic sitemap');
  }
});

/**
 * GET /robots.txt
 * Instructs search engine spiders on index guidelines and lists sitemap path
 */
router.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host') || 'kashmircurators.com';
  const protocol = req.secure ? 'https' : 'http';
  const domain = `${protocol}://${host}`;

  let robots = `User-agent: *\n`;
  robots += `Allow: /\n`;
  robots += `Disallow: /admin\n`;
  robots += `Disallow: /sales/portal\n`;
  robots += `Disallow: /api/\n`;
  robots += `\n`;
  robots += `Sitemap: ${domain}/sitemap.xml\n`;

  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

export default router;
