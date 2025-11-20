// Spotify API Types and Interfaces

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

export interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  duration_ms: number;
  images: Array<{ url: string; width?: number; height?: number }>;
  show: {
    name: string;
    publisher: string;
  };
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | SpotifyEpisode | null;
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
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

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiry: number;
}
