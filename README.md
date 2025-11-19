# Clooless

A Next.js dashboard application that displays the latest Clooless YouTube videos with integrated Spotify controls and a live clock.

## Features

- **Live Clock Display** - Shows current time in a clean interface
- **Spotify Integration** - Control playback, view current track, and manage devices
- **YouTube Videos** - Displays latest videos from the Clooless channel with caching
- **Responsive Design** - Built with Tailwind CSS for modern styling
- **Screen Switching** - Toggle between different display modes

## Tech Stack

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **APIs**: Spotify Web API, YouTube Data API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- Spotify Premium account
- YouTube Data API key

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd clooless
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   Create a `.env.local` file with your API credentials:

   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:3000/spotify-auth
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Spotify Integration

1. Click "Connect Spotify" to authenticate with your Spotify account
2. Use the media controls to play, pause, skip tracks
3. View current track information and playback progress

### YouTube Videos

- Latest videos are automatically fetched and cached for 1 hour
- Videos less than 2 days old are marked as "New"
- Click the expand button to view the video list
- Videos open in YouTube when clicked

## Project Structure

```text
app/
├── globals.css          # Global styles
├── layout.tsx          # Root layout component
├── page.tsx            # Home page
└── spotify-auth/       # Spotify authentication page

components/
├── Clock.tsx           # Live clock component
├── LatestVideos.tsx    # YouTube videos display
├── screen-switcher.tsx # Screen mode toggle
└── SpotifyController.tsx # Spotify playback controls

utils/
├── spotify-direct.ts   # Direct Spotify API utilities
├── spotify.ts          # Spotify API wrapper
└── youtube.ts          # YouTube API utilities
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Configuration

### Spotify API Setup

1. Create a Spotify app at [developer.spotify.com](https://developer.spotify.com)
2. Add `http://localhost:3000/spotify-auth` to redirect URIs
3. Copy client ID and secret to environment variables

### YouTube API Setup

1. Create a project in Google Cloud Console
2. Enable YouTube Data API v3
3. Create API key and add to environment variables

## License

This project is private and not licensed for public use.