import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, STORAGE_KEYS, SPOTIFY_SCOPES, spotifyApi } from './config';
import type { TokenData } from './types';

// Authentication helpers
export const getStoredTokens = (): TokenData | null => {
  if (typeof window === 'undefined') return null;
  
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  
  if (!accessToken || !refreshToken) return null;
  
  return {
    accessToken,
    refreshToken,
    expiry: expiry ? parseInt(expiry) : 0,
  };
};

export const storeTokens = (accessToken: string, refreshToken: string, expiresIn: number): void => {
  if (typeof window === 'undefined') return;
  
  const expiry = Date.now() + (expiresIn * 1000);
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
};

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
};

// Check if tokens need refresh
export const needsTokenRefresh = (): boolean => {
  const tokens = getStoredTokens();
  if (!tokens) return true;
  
  // Refresh if expires in next 5 minutes
  return Date.now() > (tokens.expiry - 5 * 60 * 1000);
};

// Initialize API with stored tokens
export const initializeSpotifyApi = async (): Promise<boolean> => {
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
export const getAuthorizationUrl = (): string => {
  const scopeString = SPOTIFY_SCOPES.join(' ');
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
export const exchangeCodeForTokens = async (code: string): Promise<boolean> => {
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

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const tokens = getStoredTokens();
  return !!tokens && !needsTokenRefresh();
};
