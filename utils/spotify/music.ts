import { getStoredTokens, initializeSpotifyApi } from './auth';
import type { SpotifyPlaybackState, SpotifyTrack, SpotifyEpisode } from './types';

// Unified playback function that works for both music and podcasts
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
    console.log(data)
    
    if (data.currently_playing_type === 'track') {
      console.log("Currently playing: Track", data.item ? `- ${data.item.name}` : '(paused/stopped)');
      if (data.item) {
        data.item = data.item as SpotifyTrack;
      }
    } else if (data.currently_playing_type === 'episode') {
      console.log("Currently playing: Episode", data.item ? `- ${data.item.name}` : '(paused/stopped)');
      if (data.item) {
        data.item = data.item as SpotifyEpisode;
      }
    } else {
      console.log("Currently playing:", data.currently_playing_type, data.item ? `- ${data.item.name}` : '(no item)');
    }
    
    return data as SpotifyPlaybackState;
  } catch (error) {
    console.error('Error getting current playback:', error);
    return null;
  }
};

export const playPause = async (): Promise<boolean> => {
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

export const skipToNext = async (): Promise<boolean> => {
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

export const skipToPrevious = async (): Promise<boolean> => {
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

export const setVolume = async (volume: number): Promise<boolean> => {
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
