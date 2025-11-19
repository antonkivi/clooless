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

// Local storage keys
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';

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

export const getDevices = async (): Promise<SpotifyDevice[]> => {
  try {
    await initializeSpotifyApi();
    const tokens = getStoredTokens();
    if (!tokens) return [];

    const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.devices as SpotifyDevice[];
  } catch (error) {
    console.error('Error getting devices:', error);
    return [];
  }
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