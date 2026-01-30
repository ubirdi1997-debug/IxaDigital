import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

// Cache for branding data
let brandingCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useBranding = () => {
  const [branding, setBranding] = useState({
    logo_url: 'https://customer-assets.emergentagent.com/job_a08c0b50-0e68-4792-b6a6-4a15ac002d5c/artifacts/3mcpq5px_Logo.jpeg',
    favicon_url: '',
    company_name: 'IXA Digital'
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    // Check cache first
    const now = Date.now();
    if (brandingCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      setBranding(brandingCache);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/branding`);
      if (response.data.success && response.data.branding) {
        const brandingData = { ...response.data.branding };
        
        // Convert relative URLs to absolute URLs
        if (brandingData.logo_url) {
          if (!brandingData.logo_url.startsWith('http')) {
            brandingData.logo_url = `${BACKEND_URL}${brandingData.logo_url}`;
          }
        }
        
        if (brandingData.favicon_url) {
          if (!brandingData.favicon_url.startsWith('http')) {
            brandingData.favicon_url = `${BACKEND_URL}${brandingData.favicon_url}`;
          }
          // Update favicon in document head
          updateFavicon(brandingData.favicon_url);
        }
        
        // Update cache
        brandingCache = brandingData;
        cacheTimestamp = now;
        
        setBranding(brandingData);
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const updateFavicon = (url) => {
    try {
      // Remove all existing favicon links
      const existingLinks = document.querySelectorAll('link[rel*="icon"]');
      existingLinks.forEach(link => link.remove());

      // Determine favicon type based on URL
      let type = 'image/x-icon';
      if (url.endsWith('.png')) {
        type = 'image/png';
      } else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
        type = 'image/jpeg';
      } else if (url.endsWith('.gif')) {
        type = 'image/gif';
      } else if (url.endsWith('.svg')) {
        type = 'image/svg+xml';
      }

      // Add standard favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = type;
      link.href = url + '?t=' + Date.now(); // Cache bust
      document.head.appendChild(link);

      // Add shortcut icon for older browsers
      const shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      shortcutLink.type = type;
      shortcutLink.href = url + '?t=' + Date.now();
      document.head.appendChild(shortcutLink);

      // Add apple-touch-icon for iOS
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = url + '?t=' + Date.now();
      document.head.appendChild(appleLink);

      console.log('Favicon updated:', url);
    } catch (error) {
      console.error('Failed to update favicon:', error);
    }
  };

  return { branding, isLoading };
};
