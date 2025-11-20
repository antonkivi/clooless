import { getStoredTokens, initializeSpotifyApi } from './auth';
import { STORAGE_KEYS } from './config';
import type { SpotifyDevice, CachedDevice } from './types';

// Device caching helpers
export const getCachedDevices = (): CachedDevice[] => {
  if (typeof window === 'undefined') return [];
  
  const cached = localStorage.getItem(STORAGE_KEYS.CACHED_DEVICES);
  return cached ? JSON.parse(cached) : [];
};

export const cacheDevices = (devices: SpotifyDevice[]): void => {
  if (typeof window === 'undefined') return;
  
  const existing = getCachedDevices();
  const now = Date.now();
  
  // Update existing or add new devices
  devices.forEach(device => {
    const existingIndex = existing.findIndex(d => d.id === device.id);
    if (existingIndex >= 0) {
      // Update existing device
      existing[existingIndex] = {
        ...device,
        lastSeen: now,
        isCached: false
      };
    } else {
      // Add new device
      existing.push({
        ...device,
        lastSeen: now,
        isCached: false
      });
    }
  });
  
  // Clean up old cached devices (older than 30 days)
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const filteredDevices = existing.filter(device => device.lastSeen > thirtyDaysAgo);
  
  localStorage.setItem(STORAGE_KEYS.CACHED_DEVICES, JSON.stringify(filteredDevices));
};

export const getMergedDevices = (liveDevices: SpotifyDevice[]): CachedDevice[] => {
  const cached = getCachedDevices();
  const now = Date.now();
  
  // Start with live devices (mark as not cached)
  const merged: CachedDevice[] = liveDevices.map(device => ({
    ...device,
    lastSeen: now,
    isCached: false
  }));
  
  // Add cached devices that aren't currently live
  cached.forEach(cachedDevice => {
    const isCurrentlyLive = liveDevices.find(d => d.id === cachedDevice.id);
    if (!isCurrentlyLive) {
      merged.push({
        ...cachedDevice,
        is_active: false, // Cached devices are not active
        isCached: true
      });
    }
  });
  
  // Sort: active first, then by last seen (most recent first)
  return merged.sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return b.lastSeen - a.lastSeen;
  });
};

export const clearCachedDevices = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.CACHED_DEVICES);
};

// Device API functions
export const getDevices = async (forceRefresh = false): Promise<SpotifyDevice[]> => {
  try {
    await initializeSpotifyApi();
    const tokens = getStoredTokens();
    if (!tokens) return [];

    // If forcing refresh, try to wake up devices first
    if (forceRefresh) {
      try {
        console.log('Attempting to wake up devices...');
        // Make a call to get current playback state which can wake up some devices
        await fetch('https://api.spotify.com/v1/me/player', {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        });
        
        // Small delay to allow devices to respond
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch {
        console.log('Wake up call failed, but continuing...');
      }
    }

    const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      console.log('Get devices response not OK:', response.status);
      return [];
    }

    const data = await response.json();
    const liveDevices = data.devices as SpotifyDevice[];
    
    // Cache the live devices we found
    if (liveDevices && liveDevices.length > 0) {
      cacheDevices(liveDevices);
    }

    return liveDevices;
  } catch (error) {
    console.error('Error getting devices:', error);
    return [];
  }
};

// Get all devices including cached ones
export const getAllDevices = async (forceRefresh = false): Promise<CachedDevice[]> => {
  const liveDevices = await getDevices(forceRefresh);
  const mergedDevices = getMergedDevices(liveDevices);
  
  return mergedDevices;
};

export const transferPlayback = async (deviceId: string): Promise<boolean> => {
  try {
    await initializeSpotifyApi();
    const tokens = getStoredTokens();
    if (!tokens) return false;

    const response = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error transferring playback:', error);
    return false;
  }
};
