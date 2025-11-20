// Spotify Playlist utilities
import { spotifyApi } from './config';

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: Array<{ url: string; width?: number; height?: number }>;
  tracks: {
    total: number;
  };
  owner: {
    display_name: string;
  };
}

export interface SpotifyPlaylistTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width?: number; height?: number }>;
  };
  duration_ms: number;
}

/**
 * Get the current user's playlists
 */
export async function getUserPlaylists(): Promise<SpotifyPlaylist[]> {
  try {
    const response = await spotifyApi.getUserPlaylists();
    return response.body.items.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      images: playlist.images || [],
      tracks: {
        total: playlist.tracks.total,
      },
      owner: {
        display_name: playlist.owner.display_name || 'Unknown',
      },
    }));
  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
}

/**
 * Get tracks from a specific playlist
 */
export async function getPlaylistTracks(playlistId: string): Promise<SpotifyPlaylistTrack[]> {
  try {
    const response = await spotifyApi.getPlaylistTracks(playlistId);
    return response.body.items
      .filter((item) => item.track && item.track.type === 'track')
      .map((item) => ({
        id: item.track!.id,
        name: item.track!.name,
        artists: item.track!.artists.map((artist) => ({ name: artist.name })),
        album: {
          name: item.track!.album.name,
          images: item.track!.album.images || [],
        },
        duration_ms: item.track!.duration_ms,
      }));
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    throw error;
  }
}
