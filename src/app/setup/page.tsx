import type { Metadata } from 'next';
import SetupClient from './SetupClient';

export const metadata: Metadata = {
  title: 'Setup & Customization - Spotify Stream Widget',
  description: 'Connect your Spotify account and customize your overlay widget layout, colors, and neon glow settings.',
};

interface SearchParams {
  success?: string;
  error?: string;
  refresh_token?: string;
}

export default async function SetupPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const success = searchParams.success === 'true';
  const error = searchParams.error || null;
  const refreshToken = searchParams.refresh_token || null;
  
  const isConfigured = !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || '';
  
  return (
    <SetupClient 
      success={success} 
      error={error} 
      refreshToken={refreshToken} 
      isConfigured={isConfigured}
      redirectUri={redirectUri}
    />
  );
}
