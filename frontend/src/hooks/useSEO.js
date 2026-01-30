import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

let seoCache = null;
let seoCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const ensureMetaTag = (name, attr = 'name') => {
  let tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  return tag;
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
