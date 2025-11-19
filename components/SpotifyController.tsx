'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Smartphone, Monitor } from 'lucide-react';
import Image from 'next/image';
import {
    getCurrentPlayback,
    playPause,
    skipToNext,
    skipToPrevious,
    setVolume,
    getDevices,
    transferPlayback,
    isAuthenticated,
    SpotifyPlaybackState,
    SpotifyDevice,
} from '../utils/spotify';

export default function SpotifyController() {
    const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
    const [devices, setDevices] = useState<SpotifyDevice[]>([]);
    const [showDevices, setShowDevices] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showControls, setShowControls] = useState(false);

    // Fetch current playback state
    const fetchPlaybackState = useCallback(async () => {
        if (!authenticated) return;

        try {
            const state = await getCurrentPlayback();
            setPlaybackState(state);
        } catch (error) {
            console.error('Error fetching playback state:', error);
        }
    }, [authenticated]);

    // Fetch available devices
    const fetchDevices = useCallback(async () => {
        if (!authenticated) return;

        try {
            const deviceList = await getDevices();
            setDevices(deviceList);
        } catch (error) {
            console.error('Error fetching devices:', error);
        }
    }, [authenticated]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            setAuthenticated(isAuthenticated());
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    // Initialize data and start polling
    useEffect(() => {
        if (!authenticated) return;

        const initializeData = async () => {
            await fetchPlaybackState();
            await fetchDevices();
        };

        initializeData();

        const interval = setInterval(fetchPlaybackState, 5000);
        return () => clearInterval(interval);
    }, [authenticated, fetchPlaybackState, fetchDevices]);

    // Handle play/pause
    const handlePlayPause = async () => {
        setIsLoading(true);
        await playPause();
        await fetchPlaybackState();
        setIsLoading(false);
    };

    // Handle skip next
    const handleSkipNext = async () => {
        setIsLoading(true);
        await skipToNext();
        setTimeout(fetchPlaybackState, 500); // Small delay for Spotify to update
        setIsLoading(false);
    };

    // Handle skip previous
    const handleSkipPrevious = async () => {
        setIsLoading(true);
        await skipToPrevious();
        setTimeout(fetchPlaybackState, 500);
        setIsLoading(false);
    };

    // Handle volume change
    const handleVolumeChange = async (newVolume: number) => {
        await setVolume(newVolume);
        if (playbackState?.device) {
            setPlaybackState({
                ...playbackState,
                device: {
                    ...playbackState.device,
                    volume_percent: newVolume,
                },
            });
        }
    };

    // Handle device switch
    const handleDeviceSwitch = async (deviceId: string) => {
        setIsLoading(true);
        await transferPlayback(deviceId);
        await fetchPlaybackState();
        await fetchDevices();
        setShowDevices(false);
        setIsLoading(false);
    };

    // Format time duration
    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Get device icon
    const getDeviceIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'smartphone':
                return <Smartphone className="w-4 h-4" />;
            case 'computer':
                return <Monitor className="w-4 h-4" />;
            default:
                return <Volume2 className="w-4 h-4" />;
        }
    };

    // Show loading state during hydration to prevent mismatch
    if (!mounted) {
        return (
            <div className="bg-black/80 backdrop-blur-md rounded-lg p-4 text-white">
                <div className="text-center">
                    <h3 className="font-medium mb-2">Spotify Controller</h3>
                    <p className="text-sm text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="">
                <button
                    onClick={() => window.open('/spotify-auth', '_blank')}
                    className="bg-black text-white transition-colors px-4 py-4 font-medium min-w-xs rounded-full text-lg"
                >
                    Connect Spotify
                </button>
            </div>
        );
    }

    if (!playbackState || !playbackState.item) {
        return (
            <div className="p-4 max-w-lg w-full">
                <div className="flex items-center gap-3 mb-4 animate-pulse">
                    <div className='rounded-md w-20 h-20 bg-gray-200' />
                    <div className="flex-1 min-w-0 flex flex-col items-end justify-end gap-0.5">
                        <div className='min-w-30 h-6 bg-black/30 rounded-md'/>
                        <div className='min-w-16 h-4 bg-black/5 rounded-md'/>
                        <div className="min-w-12 h-3 bg-black/5 rounded-md"/>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>00:00</span>
                        <span>00:00</span>
                    </div>
                    <div className="w-full bg-black/10 rounded-full h-1">
                        <div
                            className="bg-black h-1 rounded-full transition-all duration-1000"
                            style={{ width: `${50}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    const { item: track, is_playing, progress_ms, device } = playbackState;
    const albumArt = track.album.images[0]?.url;
    const progressPercent = (progress_ms / track.duration_ms) * 100;

    return (
        <div className=" min-w-lg p-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 mb-4" onClick={() => setShowControls(!showControls)}>
                {albumArt && (
                    <Image
                        src={albumArt}
                        alt={track.album.name}
                        width={80}
                        height={80}
                        className="rounded-md"
                    />
                )}
                <div className="flex-1 min-w-0 flex flex-col items-end justify-end">
                    <h3 className="font-medium text-lg truncate text-black">{track.name}</h3>
                    <p className="text-xs text-gray-400 truncate">
                        {track.artists.map(artist => artist.name).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{track.album.name}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{formatTime(progress_ms)}</span>
                    <span>{formatTime(track.duration_ms)}</span>
                </div>
                <div className="w-full bg-black/10 rounded-full h-1">
                    <div
                        className="bg-black h-1 rounded-full transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Controls */}
            <div className={`flex items-center justify-center gap-4 ${showControls ? '' : 'hidden'}`}>
                <button
                    onClick={handleSkipPrevious}
                    disabled={isLoading}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 text-black"
                >
                    <SkipBack className="w-5 h-5" />
                </button>

                <button
                    onClick={handlePlayPause}
                    disabled={isLoading}
                    className="p-3 bg-black text-white rounded-full transition-colors disabled:opacity-50 "
                >
                    {is_playing ? (
                        <Pause className="w-6 h-6" />
                    ) : (
                        <Play className="w-6 h-6 ml-0.5" />
                    )}
                </button>

                <button
                    onClick={handleSkipNext}
                    disabled={isLoading}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 text-black"
                >
                    <SkipForward className="w-5 h-5" />
                </button>
            </div>

            {/* Volume and Device Controls */}
            <div className="hidden items-center gap-3">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={device?.volume_percent || 0}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-400 w-8">
                    {device?.volume_percent || 0}%
                </span>

                {/* Device Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowDevices(!showDevices)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title={`Playing on ${device?.name || 'Unknown Device'}`}
                    >
                        {getDeviceIcon(device?.type || '')}
                    </button>

                    {showDevices && (
                        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg min-w-48 z-10">
                            <div className="p-2">
                                <p className="text-xs text-gray-400 mb-2">Available Devices</p>
                                {devices.map((dev) => (
                                    <button
                                        key={dev.id}
                                        onClick={() => handleDeviceSwitch(dev.id)}
                                        className={`w-full text-left p-2 rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 ${dev.is_active ? 'text-green-400' : 'text-white'
                                            }`}
                                    >
                                        {getDeviceIcon(dev.type)}
                                        <span className="truncate">{dev.name}</span>
                                        {dev.is_active && <span className="text-xs">•</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}