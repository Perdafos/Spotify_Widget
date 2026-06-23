import type { Metadata } from 'next';
import SetupClient from './SetupClient';

export const metadata: Metadata = {
  title: 'Setup & Customization - Music Stream Widget',
  description: 'Connect your Last.fm account and customize your overlay widget layout, colors, and neon glow settings.',
};

export default async function SetupPage() {
  const isConfigured = !!process.env.LASTFM_API_KEY;
  const defaultUsername = process.env.LASTFM_USERNAME || '';
  
  return (
    <SetupClient 
      isConfigured={isConfigured}
      defaultUsername={defaultUsername}
    />
  );
}
