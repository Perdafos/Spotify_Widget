import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Server is not configured properly. Missing SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI in env.' },
      { status: 500 }
    );
  }

  const scopes = ['user-read-currently-playing', 'user-read-playback-state'].join(' ');
  
  const spotifyAuthUrl = new URL('https://accounts.spotify.com/authorize');
  spotifyAuthUrl.searchParams.append('response_type', 'code');
  spotifyAuthUrl.searchParams.append('client_id', clientId);
  spotifyAuthUrl.searchParams.append('scope', scopes);
  spotifyAuthUrl.searchParams.append('redirect_uri', redirectUri);
  // Optional: state param can be generated and validated. For a simple widget we can omit or pass a static string.
  spotifyAuthUrl.searchParams.append('state', 'spotify-widget-state');

  return NextResponse.redirect(spotifyAuthUrl.toString());
}
