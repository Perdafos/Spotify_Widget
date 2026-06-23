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

const API_KEY = process.env.LASTFM_API_KEY || '';
const DEFAULT_USERNAME = process.env.LASTFM_USERNAME || '';

/**
 * Retrieves the currently playing track from Last.fm for a given user.
 */
export async function getCurrentlyPlaying(user?: string): Promise<SpotifyTrackInfo> {
  const username = user || DEFAULT_USERNAME;
  
  if (!API_KEY) {
    return { isPlaying: false, error: 'LASTFM_API_KEY is not configured in Vercel/environment variables.' };
  }
  
  if (!username) {
    return { isPlaying: false, error: 'No Last.fm username configured (pass as ?user=username query parameter or set LASTFM_USERNAME).' };
  }

  try {
    const endpoint = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${API_KEY}&limit=1&format=json`;
    
    const response = await fetch(endpoint, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      return { isPlaying: false, error: `Last.fm API error (${response.status}): ${errorMsg}` };
    }

    const data = await response.json();
    
    // Check if there is an error code in Last.fm response
    if (data.error) {
      return { isPlaying: false, error: `Last.fm error (${data.error}): ${data.message}` };
    }

    const tracks = data.recenttracks?.track;
    if (!tracks) {
      return { isPlaying: false };
    }

    // Handle case where track is a single object instead of array (if only 1 track history exists)
    const track = Array.isArray(tracks) ? tracks[0] : tracks;
    if (!track) {
      return { isPlaying: false };
    }

    // Check if the track is currently playing
    const isPlaying = track['@attr']?.nowplaying === 'true';

    if (!isPlaying) {
      return { isPlaying: false };
    }

    const title = track.name;
    const artist = track.artist?.['#text'] || 'Unknown Artist';
    const album = track.album?.['#text'] || '';
    
    // Find the largest image available
    let albumImageUrl = '';
    if (track.image && Array.isArray(track.image)) {
      const xlImage = track.image.find((img: any) => img.size === 'extralarge');
      const lImage = track.image.find((img: any) => img.size === 'large');
      const mImage = track.image.find((img: any) => img.size === 'medium');
      albumImageUrl = xlImage?.['#text'] || lImage?.['#text'] || mImage?.['#text'] || '';
    }

    const songUrl = track.url || '';

    return {
      isPlaying,
      title,
      artist,
      album,
      albumImageUrl,
      songUrl,
    };
  } catch (error: any) {
    console.error('Error fetching currently playing track from Last.fm:', error);
    return { isPlaying: false, error: error.message || String(error) };
  }
}
