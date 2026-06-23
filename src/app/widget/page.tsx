import type { Metadata } from 'next';
import { Suspense } from 'react';
import WidgetClient from './WidgetClient';

export const metadata: Metadata = {
  title: 'Spotify Stream Overlay Widget',
  description: 'Overlay widget showing currently playing music on live stream.',
};

export default function WidgetPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-transparent flex items-center justify-center" />}>
      <WidgetClient />
    </Suspense>
  );
}
