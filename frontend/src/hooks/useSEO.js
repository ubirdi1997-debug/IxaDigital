import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

let seoCache = null;
let seoCacheTimestamp = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds

const ensureMetaTag = (name, attr = 'name') => {
  let tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  return tag;
};

const ensureScriptTag = (src, attributes = {}) => {
  let tag = document.querySelector(`script[src="${src}"]`);
  if (!tag) {
    tag = document.createElement('script');
    tag.setAttribute('src', src);
    Object.entries(attributes).forEach(([key, value]) => tag.setAttribute(key, value));
    document.head.appendChild(tag);
  }
  return tag;
};

const removeScriptTagsByAttr = (attrName, attrValue) => {
  const tags = document.querySelectorAll(`script[${attrName}="${attrValue}"]`);
  tags.forEach((tag) => tag.remove());
};

const ensureLinkTag = (rel) => {
  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  return tag;
};

export const useSEO = () => {
  const [seo, setSeo] = useState(null);

  const applySeo = useCallback((seoData) => {
    if (!seoData) return;

    if (seoData.site_title) {
      document.title = seoData.site_title;
    }

    if (seoData.site_description) {
      ensureMetaTag('description').setAttribute('content', seoData.site_description);
    }

    if (seoData.keywords) {
      ensureMetaTag('keywords').setAttribute('content', seoData.keywords);
    }

    if (seoData.google_site_verification) {
      ensureMetaTag('google-site-verification').setAttribute('content', seoData.google_site_verification);
    }

    const gaId = seoData.google_analytics_id?.trim();
    if (gaId) {
      const isGtm = gaId.startsWith('GTM-');

      // Clean up prior GA/GTM scripts
      removeScriptTagsByAttr('data-gtag-id', 'ixadigital-ga-config');
      removeScriptTagsByAttr('data-gtm-id', 'ixadigital-gtm-config');
      const gaScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
      gaScripts.forEach((tag) => tag.remove());
      const gtmScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]');
      gtmScripts.forEach((tag) => tag.remove());

      if (isGtm) {
        const existingGtm = document.querySelector('script[data-gtm-id="ixadigital-gtm-config"]');
        const gtmScriptText = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gaId}');`;

        if (!existingGtm) {
          const configScript = document.createElement('script');
          configScript.setAttribute('data-gtm-id', 'ixadigital-gtm-config');
          configScript.text = gtmScriptText;
          document.head.appendChild(configScript);
        } else {
          existingGtm.text = gtmScriptText;
        }
      } else {
        // Load GA script (gtag.js)
        const gtagSrc = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
        ensureScriptTag(gtagSrc, { async: 'true', 'data-gtag-id': gaId });

        // Inject config script (inline)
        const existingConfig = document.querySelector('script[data-gtag-id="ixadigital-ga-config"]');
        if (!existingConfig) {
          const configScript = document.createElement('script');
          configScript.setAttribute('data-gtag-id', 'ixadigital-ga-config');
          configScript.text = `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${gaId}');`;
          document.head.appendChild(configScript);
        } else {
          existingConfig.text = `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${gaId}');`;
        }
      }
    } else {
      // Remove GA/GTM scripts if ID is cleared
      const gaScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
      gaScripts.forEach((tag) => tag.remove());
      const gtmScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]');
      gtmScripts.forEach((tag) => tag.remove());
      removeScriptTagsByAttr('data-gtag-id', 'ixadigital-ga-config');
      removeScriptTagsByAttr('data-gtm-id', 'ixadigital-gtm-config');
    }

    if (seoData.og_image) {
      const ogImage = seoData.og_image.startsWith('http')
        ? seoData.og_image
        : `${BACKEND_URL}${seoData.og_image}`;
      ensureMetaTag('og:image', 'property').setAttribute('content', ogImage);
    }

    if (seoData.site_title) {
      ensureMetaTag('og:title', 'property').setAttribute('content', seoData.site_title);
      ensureMetaTag('twitter:title').setAttribute('content', seoData.site_title);
    }

    if (seoData.site_description) {
      ensureMetaTag('og:description', 'property').setAttribute('content', seoData.site_description);
      ensureMetaTag('twitter:description').setAttribute('content', seoData.site_description);
    }

    ensureMetaTag('twitter:card').setAttribute('content', 'summary_large_image');

    if (seoData.twitter_handle) {
      const handle = seoData.twitter_handle.startsWith('@')
        ? seoData.twitter_handle
        : `@${seoData.twitter_handle}`;
      ensureMetaTag('twitter:site').setAttribute('content', handle);
    }

    // Canonical link
    const canonical = ensureLinkTag('canonical');
    canonical.setAttribute('href', window.location.origin + window.location.pathname);
  }, []);

  const fetchSeo = useCallback(async () => {
    const now = Date.now();
    if (seoCache && seoCacheTimestamp && (now - seoCacheTimestamp < CACHE_DURATION)) {
      setSeo(seoCache);
      applySeo(seoCache);
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/seo-config`);
      const seoData = response.data || null;
      seoCache = seoData;
      seoCacheTimestamp = now;
      setSeo(seoData);
      applySeo(seoData);
    } catch (error) {
      console.error('Failed to fetch SEO config:', error);
    }
  }, [applySeo]);

  useEffect(() => {
    fetchSeo();
  }, [fetchSeo]);

  return { seo };
};
