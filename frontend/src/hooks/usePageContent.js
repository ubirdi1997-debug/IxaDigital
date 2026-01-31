import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const cache = new Map();
const cacheTimestamps = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds

export const usePageContent = (page) => {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    if (!page) {
      setIsLoading(false);
      return;
    }

    const now = Date.now();
    const cached = cache.get(page);
    const cachedAt = cacheTimestamps.get(page);
    if (cached && cachedAt && (now - cachedAt < CACHE_DURATION)) {
      setContent(cached);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/page-content/${page}`);
      if (response.data?.success && response.data.content) {
        cache.set(page, response.data.content);
        cacheTimestamps.set(page, now);
        setContent(response.data.content);
      } else {
        setContent(null);
      }
    } catch (error) {
      console.error('Failed to fetch page content:', error);
      setContent(null);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { content, isLoading };
};
