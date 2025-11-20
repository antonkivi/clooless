// Main entry point for Spotify utilities
// This file re-exports all public APIs from the spotify module

// Configuration
export { spotifyApi, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, STORAGE_KEYS, SPOTIFY_SCOPES } from './config';

// Types
export type {
  SpotifyTrack,
  SpotifyEpisode,
  SpotifyPlaybackState,
  SpotifyDevice,
  CachedDevice,
  TokenData,
} from './types';

export type {
  SpotifyPlaylist,
  SpotifyPlaylistTrack,
} from './playlist';

// Authentication
export {
  getStoredTokens,
  storeTokens,
  clearTokens,
  needsTokenRefresh,
  initializeSpotifyApi,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  isAuthenticated,
} from './auth';

// Music playback
export {
  getCurrentPlayback,
  playPause,
  skipToNext,
  skipToPrevious,
  setVolume,
  playTrack,
} from './music';

// Podcast/Episode playback
export {
  getCurrentEpisode,
  getEpisode,
  seekToPosition,
} from './podcast';

// Device management
export {
  getDevices,
  getAllDevices,
  transferPlayback,
  getCachedDevices,
  cacheDevices,
  getMergedDevices,
  clearCachedDevices,
} from './devices';

// Playlist management
export {
  getUserPlaylists,
  getPlaylistTracks,
} from './playlist';

// Default export for backwards compatibility
import { spotifyApi } from './config';
export default spotifyApi;
