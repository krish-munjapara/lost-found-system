import { useState, useEffect, useCallback, useRef } from 'react';

let googleInitialized = false;
let googleCallback = null;

/**
 * Shared Google Identity Services initialization hook.
 * Ensures Google is initialized only once across the application.
 * Provides renderButton for explicit Google Sign-In button.
 */
export const useGoogleAuth = () => {
  const [isReady, setIsReady] = useState(false);
  const buttonContainerRef = useRef(null);

  useEffect(() => {
    // Only initialize once globally
    if (googleInitialized) {
      setIsReady(true);
      return;
    }

    const initializeGoogle = () => {
      const google = window.google;
      if (!google) {
        console.error('[GOOGLE] Google Identity Services not loaded');
        return;
      }

      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        console.error('[GOOGLE] VITE_GOOGLE_CLIENT_ID not configured');
        return;
      }

      console.log('[GOOGLE] Initializing Google Identity Services (shared)');
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => {
          console.log('[GOOGLE] GIS callback received (shared)');
          if (googleCallback) {
            googleCallback(response);
          }
        },
      });

      googleInitialized = true;
      setIsReady(true);
    };

    // Wait for Google script to load
    if (window.google) {
      initializeGoogle();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initializeGoogle();
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, []);

  const setGoogleCallback = useCallback((callback) => {
    googleCallback = callback;
  }, []);

  const renderGoogleButton = useCallback((containerId, options = {}) => {
    const google = window.google;
    if (!google) {
      console.error('[GOOGLE] Google Identity Services not loaded');
      return;
    }

    if (!isReady) {
      console.error('[GOOGLE] Google Identity Services not ready');
      return;
    }

    console.log('[GOOGLE] Rendering Google Sign-In button');
    
    // Clear any existing button in the container
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }

    google.accounts.id.renderButton(
      document.getElementById(containerId),
      {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        ...options,
      }
    );
  }, [isReady]);

  return { isReady, setGoogleCallback, renderGoogleButton, buttonContainerRef };
};
