'use client';

import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionType = () => {
      // @ts-ignore - navigator.connection is experimental
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    // Set initial status
    updateOnlineStatus();
    updateConnectionType();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listen for connection changes
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateConnectionType);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (connection) {
        connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  return { isOnline, connectionType };
}