import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

// Cache for reCAPTCHA config
let recaptchaConfigCache = null;
let configCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useRecaptcha = () => {
  const [config, setConfig] = useState({
    enabled: false,
    site_key: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      // Check cache first
      const now = Date.now();
      if (recaptchaConfigCache && configCacheTimestamp && (now - configCacheTimestamp < CACHE_DURATION)) {
        setConfig(recaptchaConfigCache);
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${BACKEND_URL}/api/recaptcha-config`);
        if (response.data.success) {
          const configData = {
            enabled: response.data.enabled,
            site_key: response.data.site_key
          };
          
          // Update cache
          recaptchaConfigCache = configData;
          configCacheTimestamp = now;
          
          setConfig(configData);

          // Load reCAPTCHA script if enabled
          if (configData.enabled && configData.site_key && !window.grecaptcha) {
            loadRecaptchaScript();
          }
        }
      } catch (error) {
        console.error('Failed to fetch reCAPTCHA config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const loadRecaptchaScript = () => {
    if (document.getElementById('recaptcha-script')) return;

    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  };

  return { config, isLoading };
};
