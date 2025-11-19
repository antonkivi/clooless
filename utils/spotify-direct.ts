// Spotify Web API Direct Implementation (fallback)
// This file provides direct API calls without the spotify-web-api-node library

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

export interface SpotifyApiResponse<T> {
  body: T;
  statusCode: number;
}

export interface SpotifyPlayOptions {
  device_id?: string;
  context_uri?: string;
  uris?: string[];
  offset?: {
    position?: number;
    uri?: string;
  };
  position_ms?: number;
}

// Direct API call helper
const makeSpotifyRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> => {
  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Spotify API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Direct API implementations
export const directSpotifyApi = {
  // Set access token for requests
  accessToken: '',

  setAccessToken(token: string) {
    this.accessToken = token;
  },

  // Get current playback state
  async getMyCurrentPlaybackState() {
    const data = await makeSpotifyRequest('/me/player', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return { body: data, statusCode: 200 };
  },

  // Play/Pause controls
  async play(options: SpotifyPlayOptions = {}) {
    await makeSpotifyRequest('/me/player/play', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: JSON.stringify(options),
    });
  },

  async pause() {
    await makeSpotifyRequest('/me/player/pause', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
  },

  // Skip controls
  async skipToNext() {
    await makeSpotifyRequest('/me/player/next', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
  },

  async skipToPrevious() {
    await makeSpotifyRequest('/me/player/previous', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
  },

  // Volume control
  async setVolume(volume: number) {
    await makeSpotifyRequest(`/me/player/volume?volume_percent=${volume}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
  },

  // Get devices
  async getMyDevices() {
    const data = await makeSpotifyRequest('/me/player/devices', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return { body: data, statusCode: 200 };
  },

  // Transfer playback
  async transferMyPlayback(deviceIds: string[]) {
    await makeSpotifyRequest('/me/player', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: JSON.stringify({ device_ids: deviceIds }),
    });
  },

  // Authorization code grant
  async authorizationCodeGrant(code: string, clientId: string, clientSecret: string, redirectUri: string) {
    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    return { body: data, statusCode: 200 };
  },

  // Refresh access token
  async refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    return { body: data, statusCode: 200 };
  },
};