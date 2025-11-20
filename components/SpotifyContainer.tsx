'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import {
    getUserPlaylists,
    getPlaylistTracks,
    isAuthenticated,
    playTrack,
    SpotifyPlaylist,
    SpotifyPlaylistTrack,
} from '../utils/spotify/index';

// Cache key and duration (5 minutes)
const PLAYLISTS_CACHE_KEY = 'spotify_playlists_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface PlaylistsCache {
    data: SpotifyPlaylist[];
    timestamp: number;
}

// Helper functions for cache management (using sessionStorage for better practice)
const getCachedPlaylists = (): SpotifyPlaylist[] | null => {
    if (typeof window === 'undefined') return null;
    
    try {
        const cached = sessionStorage.getItem(PLAYLISTS_CACHE_KEY);
        if (!cached) return null;

        const parsedCache: PlaylistsCache = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid
        if (now - parsedCache.timestamp < CACHE_DURATION) {
            return parsedCache.data;
        }

        // Cache expired, remove it
        sessionStorage.removeItem(PLAYLISTS_CACHE_KEY);
        return null;
    } catch (error) {
        console.error('Error loading playlists from cache:', error);
        return null;
    }
};

const setCachedPlaylists = (data: SpotifyPlaylist[]) => {
    if (typeof window === 'undefined') return;
    
    try {
        const cache: PlaylistsCache = {
            data,
            timestamp: Date.now(),
        };
        sessionStorage.setItem(PLAYLISTS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error('Error saving playlists to cache:', error);
    }
};

export default function SpotifyContainer() {
    const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
    const [playlistTracks, setPlaylistTracks] = useState<SpotifyPlaylistTrack[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [mounted, setMounted] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();
    const playlistId = searchParams.get('pid');

    // Check authentication on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            setAuthenticated(isAuthenticated());
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    // Fetch playlists when authenticated
    const fetchPlaylists = useCallback(async (forceRefresh = false) => {
        if (!authenticated) return;

        // Try to load from cache first if not forcing refresh
        if (!forceRefresh) {
            const cachedPlaylists = getCachedPlaylists();
            if (cachedPlaylists) {
                setPlaylists(cachedPlaylists);
                return;
            }
        }

        setIsLoading(true);
        try {
            const data = await getUserPlaylists();
            setPlaylists(data);
            setCachedPlaylists(data);
        } catch (error) {
            console.error('Error fetching playlists:', error);
        } finally {
            setIsLoading(false);
        }
    }, [authenticated]);

    // Handle refresh button click
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchPlaylists(true); // Force refresh
        setIsRefreshing(false);
    };

    // Fetch playlist tracks when playlistId changes
    const fetchPlaylistTracks = useCallback(async (pid: string) => {
        setIsLoading(true);
        try {
            const data = await getPlaylistTracks(pid);
            setPlaylistTracks(data);
            const playlist = playlists.find(p => p.id === pid);
            setSelectedPlaylist(playlist || null);
        } catch (error) {
            console.error('Error fetching playlist tracks:', error);
        } finally {
            setIsLoading(false);
        }
    }, [playlists]);

    // Load playlists on mount
    useEffect(() => {
        if (authenticated && !playlistId) {
            fetchPlaylists();
        }
    }, [authenticated, playlistId, fetchPlaylists]);

    // Load playlist tracks when pid parameter changes
    useEffect(() => {
        if (authenticated && playlistId && playlists.length > 0) {
            fetchPlaylistTracks(playlistId);
        }
    }, [playlistId, authenticated, playlists, fetchPlaylistTracks]);

    // Handle playlist click
    const handlePlaylistClick = (playlist: SpotifyPlaylist) => {
        router.push(`?pid=${playlist.id}`);
    };

    // Handle back to playlists
    const handleBackToPlaylists = () => {
        setSelectedPlaylist(null);
        setPlaylistTracks([]);
        router.push("/");
    };

    // Handle track click to play
    const handleTrackClick = async (track: SpotifyPlaylistTrack) => {
        try {
            const trackUri = `spotify:track:${track.id}`;
            const playlistUri = selectedPlaylist ? `spotify:playlist:${selectedPlaylist.id}` : undefined;
            await playTrack(trackUri, playlistUri);
        } catch (error) {
            console.error('Error playing track:', error);
        }
    };

    // Format time duration
    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Show loading state during hydration
    if (!mounted) {
        return (
            <div className="min-w-lg p-4">
                <div className="text-center">
                    <h3 className="font-medium mb-2">Spotify Playlists</h3>
                    <p className="text-sm text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-w-lg p-4">
                <div className="text-center">
                    <h3 className="font-medium text-lg mb-2 text-black">Spotify Playlists</h3>
                    <p className="text-sm text-gray-500 mb-4">Connect your Spotify account to view playlists</p>
                    <button
                        onClick={() => window.open('/spotify-auth', '_blank')}
                        className="bg-black text-white transition-colors px-4 py-2 font-medium rounded-full"
                    >
                        Connect Spotify
                    </button>
                </div>
            </div>
        );
    }

    // Show playlist tracks view
    if (playlistId && selectedPlaylist) {
        return (
            <div className="min-w-lg p-4 h-full">
                <div className="mb-4">
                    <button
                        onClick={handleBackToPlaylists}
                        className="text-sm text-gray-600 hover:text-black transition-colors mb-2"
                    >
                        ← Back to playlists
                    </button>
                    <h3 className="font-medium text-lg text-black">{selectedPlaylist.name}</h3>
                    <p className="text-xs text-gray-500">{playlistTracks.length} tracks</p>
                </div>

                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="rounded-md w-12 h-12 bg-gray-200" />
                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                    <div className="h-4 bg-black/30 rounded-md w-3/4" />
                                    <div className="h-3 bg-black/5 rounded-md w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {playlistTracks.map((track) => {
                            const albumArt = track.album.images[0]?.url;
                            return (
                                <div
                                    key={track.id}
                                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                    onClick={() => handleTrackClick(track)}
                                >
                                    {albumArt && (
                                        <Image
                                            src={albumArt}
                                            alt={track.album.name}
                                            width={48}
                                            height={48}
                                            className="rounded-md aspect-square object-cover max-h-12"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-medium text-sm truncate text-black">
                                            {track.name}
                                        </h4>
                                        <p className="text-xs text-gray-400 truncate">
                                            {track.artists.map(artist => artist.name).join(', ')}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{track.album.name}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {formatTime(track.duration_ms)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Show playlists list view
    return (
        <div className="min-w-lg p-4 h-full">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-lg text-black">Your Playlists</h3>
                    <p className="text-xs text-gray-500">{playlists.length} playlists</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    title="Refresh playlists"
                >
                    <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="rounded-md w-12 h-12 bg-gray-200" />
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                <div className="h-5 bg-black/30 rounded-md w-3/4" />
                                <div className="h-3 bg-black/5 rounded-md w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto h-full">
                    {playlists.map((playlist) => {
                        const playlistImage = playlist.images[0]?.url;
                        return (
                            <div
                                key={playlist.id}
                                onClick={() => handlePlaylistClick(playlist)}
                                className="flex items-center gap-3 cursor-pointer  hover:bg-gray-50 p-2 rounded-lg transition-colors"
                            >
                                {playlistImage ? (
                                    <Image
                                        src={playlistImage}
                                        alt={playlist.name}
                                        width={48}
                                        height={48}
                                        className="rounded-md  aspect-square object-cover max-h-12"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                        <span className="text-gray-400 text-xs">No image</span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="font-medium text-sm truncate text-black">
                                        {playlist.name}
                                    </h4>
                                    {playlist.description && (
                                        <p className="text-xs text-gray-400 truncate">
                                            {playlist.description}
                                        </p>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                    {playlist.tracks.total} tracks
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
