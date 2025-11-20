"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { fetchTheLatestVideos } from "../utils/youtube";
import { ChevronUp } from "lucide-react";

type Video = {
    videoId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    publishedAt: string;
};

type CachedVideosData = {
    videos: Video[];
    timestamp: number;
};

interface YouTubeApiResponse {
    items: Array<{
        id: {
            videoId: string;
        };
        snippet: {
            title: string;
            description: string;
            thumbnails: {
                [key: string]: {
                    url: string;
                };
            };
            publishedAt: string;
        };
    }>;
}

const LatestCloolessVideos: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isOpen, setIsOpen] = useState(false); // Start with videos hidden
    const [newVideoAvailable, setNewVideoAvailable] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cache key and duration (1 hour)
    const CACHE_KEY = "clooless_latest_videos";
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

    // Helper function to check if a video is new (less than 2 days old)
    const isVideoNew = (publishedAt: string): boolean => {
        const videoDate = new Date(publishedAt);
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
        return videoDate > twoDaysAgo;
    };

    // Helper function to get cached videos
    const getCachedVideos = (): Video[] | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const cachedData: CachedVideosData = JSON.parse(cached);
            const now = Date.now();

            // Check if cache is still valid
            if (now - cachedData.timestamp < CACHE_DURATION) {
                return cachedData.videos;
            }
        } catch (error) {
            console.error("Error reading cache:", error);
        }
        return null;
    };

    // Helper function to cache videos
    const cacheVideos = (videos: Video[]): void => {
        try {
            const cacheData: CachedVideosData = {
                videos,
                timestamp: Date.now()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.error("Error caching videos:", error);
        }
    };

    useEffect(() => {
        const loadVideos = async () => {
            try {
                // Try to get cached videos first
                const cachedVideos = getCachedVideos();
                
                if (cachedVideos) {
                    setVideos(cachedVideos);
                    // Check if any cached videos are new
                    const hasNewVideos = cachedVideos.some(video => isVideoNew(video.publishedAt));
                    setNewVideoAvailable(hasNewVideos);
                    return;
                }

                // If no cache, fetch from API
                const videoItems = await fetchTheLatestVideos();
                const formattedVideos: Video[] = videoItems.map((item: YouTubeApiResponse['items'][0]) => ({
                    videoId: item.id.videoId,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || "",
                    publishedAt: item.snippet.publishedAt,
                }));
                
                setVideos(formattedVideos);
                cacheVideos(formattedVideos);
                
                // Check if any videos are new
                const hasNewVideos = formattedVideos.some(video => isVideoNew(video.publishedAt));
                setNewVideoAvailable(hasNewVideos);
            } catch (err: unknown) {
                console.error("Error fetching YouTube videos", err);
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                setError(errorMessage);
            }
        };

        loadVideos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (videos.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <div className={`fixed bottom-0 left-0 w-full transition-transform duration-500 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="absolute w-full -top-16 left-0 h-14 flex flex-row items-center justify-center">
                <button 
                    className="py-4 px-4 bg-black/80 backdrop-blur-md text-white rounded-full flex flex-row gap-2 transition-colors duration-200" 
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <ChevronUp className={`${isOpen ? "rotate-180" : ""} transition-transform duration-300`} />
                    {newVideoAvailable && <span className="font-medium">New Episode!</span>}
                </button>
            </div>
            <div className="p-6 bg-black/80 backdrop-blur-md">
                <ul className="grid grid-cols-3 gap-6 mx-auto max-w-5xl items-center justify-center">
                    {videos.map((video) => (
                        <li key={video.videoId} className="flex flex-col relative">
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative block"
                            >
                                <Image
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    width={480}
                                    height={360}
                                    className="rounded-lg"
                                    style={{ width: "100%", maxWidth: "480px", height: "auto" }}
                                />
                                {isVideoNew(video.publishedAt) && (
                                    <p className="absolute top-2 right-2 py-2 px-4 bg-red-500/90 backdrop-blur-2xl text-white rounded-full flex flex-row gap-2 font-medium text-sm">
                                        New!
                                    </p>
                                )}
                                <h3 className="mt-2 font-medium text-white line-clamp-2">{video.title}</h3>
                            </a>
                            <small className="text-gray-400 mt-1">
                                Published: {new Date(video.publishedAt).toLocaleDateString()}
                            </small>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default LatestCloolessVideos;