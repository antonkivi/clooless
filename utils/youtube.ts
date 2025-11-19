"use server";
import axios from "axios";

export async function fetchTheLatestVideos() {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
    const videoLength = 3;

    const url = "https://www.googleapis.com/youtube/v3/search";
    const params = {
        key: apiKey,
        channelId: channelId,
        part: "snippet",
        order: "date",
        maxResults: videoLength,
        type: "video",
    };
    const response = await axios.get(url, { params });
    return response.data.items;
}
