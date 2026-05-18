import { useEffect } from 'react';

export interface SeoMetaProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  ogType?: 'website' | 'article' | 'travel';
  schema?: Record<string, any>;
}

export const SeoMeta = ({
  title,
  description,
  keywords = 'kashmir connect, kashmir curators, gulmarg tour, pahalgam package, srinagar houseboats',
  image,
  ogType = 'website',
  schema
}: SeoMetaProps) => {
  
  useEffect(() => {
    // 1. Update primary document title
    const fullTitle = `${title} | Kashmir Curators`;
    document.title = fullTitle;

    // Helper to find or create a meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, contentVal: string) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentVal);
    };

    // 2. Set search crawler tags
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);

    // 3. Set Open Graph (Facebook/LinkedIn) social previews
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', window.location.href);
    if (image) {
      setMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
    }

    // 4. Set Twitter social cards
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    // 5. Build and inject dynamic structured JSON-LD schemas
    let scriptElement = document.getElementById('seo-schema') as HTMLScriptElement | null;
    
    if (schema) {
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.id = 'seo-schema';
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(schema);
    } else {
      // Cleanup schemas if none provided
      if (scriptElement) {
        scriptElement.remove();
      }
    }

    // Cleanup hook on transition
    return () => {
      // We keep standard tags but remove page-specific schema script to avoid overlaps
      const scriptToRemove = document.getElementById('seo-schema');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [title, description, keywords, ogType, schema]);

  return null; // Side-effect only component
};

export default SeoMeta;
