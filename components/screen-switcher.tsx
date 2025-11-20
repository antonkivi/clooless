'use client';

import { Expand, Shrink } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ScreenSwitcher() {
  const [isKioskMode, setIsKioskMode] = useState(false);

  // Update kiosk mode state when fullscreen changes
  useEffect(() => {
    const checkFullscreen = () => {
      setIsKioskMode(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    return () => document.removeEventListener('fullscreenchange', checkFullscreen);
  }, []);

  const toggleKioskMode = async () => {
    if (!isKioskMode) {
      // Enter kiosk mode (fullscreen)
      try {
        await document.documentElement.requestFullscreen();
        setIsKioskMode(true);
      } catch (error) {
        console.error('Error entering fullscreen:', error);
      }
    } else {
      // Exit kiosk mode
      try {
        await document.exitFullscreen();
        setIsKioskMode(false);
      } catch (error) {
        console.error('Error exiting fullscreen:', error);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleKioskMode}
        className={`
          p-2 rounded-lg font-medium transition-all duration-200 text-black hover:bg-gray-100
        `}
      >
        {isKioskMode ? <Shrink /> : <Expand className=''/>}
      </button>
    </div>
  );
}