'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

export default function NetworkStatus() {
  const { isOnline, connectionType } = useNetworkStatus();

  if (isOnline && connectionType !== 'slow-2g') {
    return null; // Don't show anything when connection is good
  }

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg ${
      isOnline ? 'bg-amber-100 border border-amber-300' : 'bg-red-100 border border-red-300'
    }`}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">Slow connection detected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">No internet connection</span>
          </>
        )}
      </div>
    </div>
  );
}