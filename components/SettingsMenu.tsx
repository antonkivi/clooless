'use client';

import { Settings, X, RefreshCw, ChevronDown, Smartphone, Monitor, Volume2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { 
  clearCachedDevices, 
  clearTokens, 
  getAllDevices, 
  transferPlayback, 
  isAuthenticated,
  CachedDevice 
} from '../utils/spotify';

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [devices, setDevices] = useState<CachedDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false
  });

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);

  // Snackbar functionality
  const showSnackbar = (message: string) => {
    setSnackbar({ message, visible: true });
  };

  // Auto-hide snackbar after 3 seconds
  useEffect(() => {
    if (snackbar.visible) {
      const timer = setTimeout(() => {
        setSnackbar(prev => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.visible]);

  // Check authentication status
  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, [isOpen]);

  // Fetch devices when menu opens
  const fetchDevices = useCallback(async (forceRefresh = false) => {
    if (!authenticated) return;

    setIsLoadingDevices(true);
    try {
      const deviceList = await getAllDevices(forceRefresh);
      setDevices(deviceList);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setIsLoadingDevices(false);
    }
  }, [authenticated]);

  // Load devices when menu opens and user is authenticated
  useEffect(() => {
    if (isOpen && authenticated) {
      fetchDevices();
    }
  }, [isOpen, authenticated, fetchDevices]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen) {
        const target = event.target as HTMLElement;
        const dropdown = target.closest('[data-dropdown]');
        if (!dropdown) {
          setIsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Format last seen time
  const formatLastSeen = useCallback((timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);

  // Get device icon
  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'smartphone':
        return <Smartphone className="w-4 h-4" />;
      case 'computer':
        return <Monitor className="w-4 h-4" />;
      case 'speaker':
        return <Volume2 className="w-4 h-4" />;
      case 'tv':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Volume2 className="w-4 h-4" />;
    }
  };

  // Get current active device or placeholder text
  const getCurrentDeviceDisplay = () => {
    const activeDevice = devices.find(device => device.is_active);
    if (activeDevice) {
      return {
        icon: getDeviceIcon(activeDevice.type),
        name: activeDevice.name
      };
    }
    return {
      icon: <Volume2 className="w-4 h-4" />,
      name: 'Select a device'
    };
  };

  const handleClearSpotifyDevices = () => {
    try {
      clearCachedDevices();
      showSnackbar('Spotify device cache cleared successfully!');
    } catch (error) {
      console.error('Error clearing Spotify device cache:', error);
      showSnackbar('Failed to clear Spotify device cache');
    }
  };

  const handleClearYouTubeCache = () => {
    try {
      // Clear any YouTube-related cache from localStorage
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.toLowerCase().includes('youtube')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      showSnackbar('YouTube cache cleared successfully!');
    } catch (error) {
      console.error('Error clearing YouTube cache:', error);
      showSnackbar('Failed to clear YouTube cache');
    }
  };

  const handleDeviceSwitch = async (deviceId: string) => {
    try {
      setIsLoadingDevices(true);
      await transferPlayback(deviceId);
      await fetchDevices(); // Refresh devices after switching
      showSnackbar('Device switched successfully!');
    } catch (error) {
      console.error('Error switching device:', error);
      showSnackbar('Failed to switch device');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleRefreshDevices = () => {
    fetchDevices(true);
  };

  const handleSpotifyLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out of Spotify?');
    if (confirmed) {
      try {
        clearTokens();
        showSnackbar('Successfully logged out of Spotify!');
        closeMenu();
        // Optionally reload the page to reset the UI state
        setTimeout(() => window.location.reload(), 1000); // Delay reload to show snackbar
      } catch (error) {
        console.error('Error logging out of Spotify:', error);
        showSnackbar('Failed to log out of Spotify');
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={openMenu}
        className="p-2 rounded-lg font-medium transition-all duration-200 text-black hover:bg-gray-100"
        aria-label="Open settings"
      >
        <Settings />
      </button>
    );
  }

  return (
    <>
      {/* Settings button (invisible when menu is open, but maintains layout) */}
      <div className="p-2 rounded-lg font-medium opacity-0">
        <Settings />
      </div>

      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={closeMenu}
      >
        {/* Settings menu */}
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-black">Settings</h2>
              <button
                onClick={closeMenu}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black"
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cache Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-black mb-3">Cache</h3>
              <div className="space-y-2">
                <button
                  onClick={handleClearSpotifyDevices}
                  className="w-full p-3 text-center bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors text-black"
                >
                  Clear Spotify Cache
                </button>
                <button
                  onClick={handleClearYouTubeCache}
                  className="w-full p-3 text-center bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors text-black"
                >
                  Clear YouTube Cache
                </button>
              </div>
            </div>

            {/* Spotify Section */}
            <div>
              <h3 className="text-lg font-medium text-black mb-3">Spotify</h3>
              
              {/* Device Selection Dropdown */}
              {authenticated && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Playback Device</label>
                    <button
                      onClick={handleRefreshDevices}
                      disabled={isLoadingDevices}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                      aria-label="Refresh devices"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingDevices ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  {devices.length === 0 ? (
                    <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg border">
                      {isLoadingDevices ? 'Loading devices...' : 'No devices found. Try opening Spotify on another device first.'}
                    </div>
                  ) : (
                    <div className="relative" data-dropdown>
                      {/* Custom Select Button */}
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isLoadingDevices}
                        className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 flex items-center justify-between text-black"
                      >
                        <div className="flex items-center gap-2">
                          {getCurrentDeviceDisplay().icon}
                          <span>{isLoadingDevices ? 'Loading...' : getCurrentDeviceDisplay().name}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Custom Dropdown */}
                      {isDropdownOpen && !isLoadingDevices && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                          {devices.map((device) => (
                            <button
                              key={device.id}
                              onClick={() => {
                                handleDeviceSwitch(device.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-start gap-2 ${
                                device.is_active ? 'bg-green-50 text-green-800' : ''
                              } ${device.isCached ? 'text-gray-600' : ''}`}
                            >
                              <div className="shrink-0 mt-0.5">
                                {getDeviceIcon(device.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{device.name}</span>
                                  {device.is_active && <span className="text-xs text-green-600 font-medium">● Active</span>}
                                </div>
                                {device.isCached && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Last seen {formatLastSeen(device.lastSeen)} • Click to wake up
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={handleSpotifyLogout}
                className="w-full p-3 text-center bg-red-100 hover:bg-red-200 rounded-2xl transition-colors text-red-700 font-medium"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Snackbar */}
      <div
        className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
          snackbar.visible 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-lg">
          <p className="text-sm font-medium">{snackbar.message}</p>
        </div>
      </div>
    </>
  );
}