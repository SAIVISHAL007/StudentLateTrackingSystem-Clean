import { useState, useEffect } from 'react';

/**
 * Custom hook to detect media query matches efficiently
 * Uses native browser matchMedia API with event listeners
 * @param {string} query - CSS media query (e.g., '(max-width: 768px)')
 * @returns {boolean} - Whether the media query matches
 * 
 * PERFORMANCE: Single event listener per hook instance
 * Much better than using window.resize events in every component
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    // Initialize with current match status
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Get media query list
    const mediaQueryList = window.matchMedia(query);
    
    // Set initial state
    setMatches(mediaQueryList.matches);

    // Create listener function
    const handleChange = (e) => {
      setMatches(e.matches);
    };

    // Add event listener (more efficient than checking on resize)
    mediaQueryList.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
};
