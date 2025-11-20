import { getStoredTokens, initializeSpotifyApi } from './auth';
import type { SpotifyEpisode } from './types';

// Podcast/Episode playback control functions

export const getCurrentEpisode = async (): Promise<SpotifyEpisode | null> => {
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
      return null;
    }
    
    const data = await response.json();
    
    // Check if currently playing item is an episode
    if (data.currently_playing_type === 'episode' && data.item) {
        console.log("EPISODE!")
      return data.item as SpotifyEpisode;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current episode:', error);
    return null;
  }
};

export const getEpisode = async (episodeId: string): Promise<SpotifyEpisode | null> => {
  try {
    await initializeSpotifyApi();
    const tokens = getStoredTokens();
    if (!tokens) return null;

    const response = await fetch(`https://api.spotify.com/v1/episodes/${episodeId}`, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data as SpotifyEpisode;
  } catch (error) {
    console.error('Error getting episode:', error);
    return null;
  }
};

export const seekToPosition = async (positionMs: number): Promise<boolean> => {
  try {
    await initializeSpotifyApi();
    const tokens = getStoredTokens();
    if (!tokens) return false;

    const response = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error seeking to position:', error);
    return false;
  }
};
