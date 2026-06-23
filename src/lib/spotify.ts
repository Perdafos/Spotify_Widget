import fs from 'fs';
import path from 'path';

// Define the structure of the track information we return to the client
export interface SpotifyTrackInfo {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progressMs?: number;
  durationMs?: number;
  timestamp?: number;
  error?: string;
}

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || '';

const TOKEN_FILE_PATH = path.join(process.cwd(), 'spotify-token.json');

// Base64 encode client credentials
const BASIC_AUTH = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

/**
 * Gets the refresh token from environment variables or local JSON storage.
 */
export function getRefreshToken(): string {
  // 1. Check environment variables (recommended for production/Vercel)
  if (process.env.SPOTIFY_REFRESH_TOKEN) {
    return process.env.SPOTIFY_REFRESH_TOKEN;
  }

  // 2. Check local file (convenient for local dev/self-hosting)
  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      const data = fs.readFileSync(TOKEN_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.refresh_token || '';
    }
  } catch (error) {
    console.error('Error reading local spotify-token.json:', error);
  }

  return '';
}

/**
 * Saves the refresh token to a local JSON file in development mode.
 */
export function saveRefreshToken(refreshToken: string): boolean {
  // Only write to file if we are in development environment or self-hosted local execution
  try {
    const data = JSON.stringify({ refresh_token: refreshToken }, null, 2);
    fs.writeFileSync(TOKEN_FILE_PATH, data, 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to save refresh token locally:', error);
    return false;
  }
}

/**
 * Exchanges authorization code for access and refresh tokens.
 */
export async function getTokensFromCode(code: string) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error('Missing Spotify credentials or Redirect URI in environment variables.');
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${BASIC_AUTH}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

/**
 * Requests a new access token using a refresh token.
 */
export async function getAccessToken(refreshToken: string): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET.');
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${BASIC_AUTH}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to refresh access token: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Retrieves the currently playing track from Spotify.
 */
export async function getCurrentlyPlaying(): Promise<SpotifyTrackInfo> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return { isPlaying: false, error: 'No refresh token found in environment or local storage.' };
  }

  try {
    const accessToken = await getAccessToken(refreshToken);

    const response = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (response.status === 204) {
      // 204 No Content means nothing is currently playing
      return { isPlaying: false };
    }

    if (response.status > 400) {
      const errorMsg = await response.text();
      return { isPlaying: false, error: `Spotify API error (${response.status}): ${errorMsg}` };
    }

    const song = await response.json();

    if (!song || !song.item) {
      return { isPlaying: false };
    }

    const isPlaying = song.is_playing;
    const title = song.item.name;
    const artist = song.item.artists.map((_artist: any) => _artist.name).join(', ');
    const album = song.item.album.name;
    const albumImageUrl = song.item.album.images[0]?.url;
    const songUrl = song.item.external_urls.spotify;
    const progressMs = song.progress_ms;
    const durationMs = song.item.duration_ms;
    const timestamp = song.timestamp;

    return {
      isPlaying,
      title,
      artist,
      album,
      albumImageUrl,
      songUrl,
      progressMs,
      durationMs,
      timestamp,
    };
  } catch (error: any) {
    console.error('Error fetching currently playing track:', error);
    return { isPlaying: false, error: error.message || String(error) };
  }
}
