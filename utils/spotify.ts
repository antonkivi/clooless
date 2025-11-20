import SpotifyWebApi from 'spotify-web-api-node';

// Spotify API configuration
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback';

// Create Spotify API instance
const spotifyApi = new SpotifyWebApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI,
});

// Types for Spotify data
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width?: number; height?: number }>;
  };
  duration_ms: number;
  preview_url?: string;
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
  device: {
    id: string;
    is_active: boolean;
    name: string;
    type: string;
    volume_percent: number;
  } | null;
  shuffle_state: boolean;
  repeat_state: 'off' | 'track' | 'context';
}

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

export interface CachedDevice extends SpotifyDevice {
  lastSeen: number;
  isCached?: boolean; // Indicates if this device is from cache (not currently active)
}

// Local storage keys
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';
const CACHED_DEVICES_KEY = 'spotify_cached_devices';

// Authentication helpers
export const getStoredTokens = () => {
  if (typeof window === 'undefined') return null;
  
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!accessToken || !refreshToken) return null;
  
  return {
    accessToken,
    refreshToken,
    expiry: expiry ? parseInt(expiry) : 0,
  };
};

export const storeTokens = (accessToken: string, refreshToken: string, expiresIn: number) => {
  if (typeof window === 'undefined') return;
  
  const expiry = Date.now() + (expiresIn * 1000);
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// Device caching helpers
export const getCachedDevices = (): CachedDevice[] => {
  if (typeof window === 'undefined') return [];
  
  const cached = localStorage.getItem(CACHED_DEVICES_KEY);
  return cached ? JSON.parse(cached) : [];
};

export const cacheDevices = (devices: SpotifyDevice[]) => {
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
  
  localStorage.setItem(CACHED_DEVICES_KEY, JSON.stringify(filteredDevices));
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

export const clearCachedDevices = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHED_DEVICES_KEY);
};

// Check if tokens need refresh
export const needsTokenRefresh = () => {
  const tokens = getStoredTokens();
  if (!tokens) return true;
  
  // Refresh if expires in next 5 minutes
  return Date.now() > (tokens.expiry - 5 * 60 * 1000);
};

// Initialize API with stored tokens
export const initializeSpotifyApi = async () => {
  const tokens = getStoredTokens();
  if (!tokens) return false;
  
  spotifyApi.setAccessToken(tokens.accessToken);
  spotifyApi.setRefreshToken(tokens.refreshToken);
  
  // Refresh token if needed
  if (needsTokenRefresh()) {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      try {
        spotifyApi.setAccessToken(data.access_token);
      } catch (e) {
        console.warn('Could not set token on spotifyApi instance:', e);
      }
      
      storeTokens(
        data.access_token,
        tokens.refreshToken,
        data.expires_in
      );
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      clearTokens();
      return false;
    }
  }
  
  return true;
};

// Generate authorization URL
export const getAuthorizationUrl = () => {
  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played',
    'playlist-read-private',
    'playlist-read-collaborative',
  ];
  
  // Build authorization URL manually if the package method isn't working
  const scopeString = scopes.join(' ');
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: scopeString,
    state: 'state',
  });
  
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Exchange authorization code for tokens
export const exchangeCodeForTokens = async (code: string) => {
  try {
    console.log('Attempting token exchange with:', {
      CLIENT_ID: CLIENT_ID ? 'Set' : 'Missing',
      CLIENT_SECRET: CLIENT_SECRET ? 'Set' : 'Missing',
      REDIRECT_URI,
      code: code.substring(0, 20) + '...',
    });

    // Use direct API call instead of the library method
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange error response:', errorText);
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Token exchange successful!');
    const { access_token, refresh_token, expires_in } = data;
    
    // Set tokens on the API instance if it's working
    try {
      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);
    } catch (e) {
      console.warn('Could not set tokens on spotifyApi instance:', e);
    }
    
    storeTokens(access_token, refresh_token, expires_in);
    return true;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return false;
  }
};

// Playback control functions
export const getCurrentPlayback = async (): Promise<SpotifyPlaybackState | null> => {
  try {
    await initializeSpotifyApi();
    const tokens = getStoredTokens();
    if (!tokens) return null;

    const response = await fetch('https://api.spotify.com/v1/me/player', {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    if (response.status === 204 || !response.ok) {
      return null; // No content or error
    }

    const data = await response.json();
    return data as SpotifyPlaybackState;
  } catch (error) {
    console.error('Error getting current playback:', error);
    return null;
  }
};

export const playPause = async () => {
  try {
    await initializeSpotifyApi();
    const tokens = getStoredTokens();
    if (!tokens) return false;

    const playbackState = await getCurrentPlayback();
    const endpoint = playbackState?.is_playing ? '/me/player/pause' : '/me/player/play';
    
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error toggling playback:', error);
    return false;
  }
};

export const skipToNext = async () => {
  try {
    await initializeSpotifyApi();
    const tokens = getStoredTokens();
    if (!tokens) return false;

    const response = await fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error skipping to next:', error);
    return false;
  }
};

export const skipToPrevious = async () => {
  try {
    await initializeSpotifyApi();
    const tokens = getStoredTokens();
    if (!tokens) return false;

    const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error skipping to previous:', error);
    return false;
  }
};

export const setVolume = async (volume: number) => {
  try {
    await initializeSpotifyApi();
    const tokens = getStoredTokens();
    if (!tokens) return false;

    const clampedVolume = Math.max(0, Math.min(100, volume));
    const response = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${clampedVolume}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error setting volume:', error);
    return false;
  }
};

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

export const transferPlayback = async (deviceId: string) => {
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

// Check if user is authenticated
export const isAuthenticated = () => {
  const tokens = getStoredTokens();
  return !!tokens && !needsTokenRefresh();
};

export default spotifyApi;