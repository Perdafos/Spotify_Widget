'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SpotifyTrackInfo } from '@/lib/spotify';
import { Volume2, Music } from 'lucide-react';

export default function WidgetClient() {
  const searchParams = useSearchParams();
  
  // Customization variables from URL search params
  const theme = searchParams.get('theme') || 'glass-dark'; // glass-dark, glass-light, transparent, solid-black, solid-white
  const layout = searchParams.get('layout') || 'compact'; // compact, card, minimal
  const showBar = searchParams.get('bar') !== 'false';
  const glow = searchParams.get('glow') === 'true';
  const offlineMode = searchParams.get('offline') || 'show'; // show, hide
  const pollIntervalMs = parseInt(searchParams.get('poll') || '5000', 10);

  // Widget State
  const [track, setTrack] = useState<SpotifyTrackInfo>({ isPlaying: false });
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll current playing track
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch('/api/now-playing');
        if (res.ok) {
          const data: SpotifyTrackInfo = await res.json();
          setTrack(data);
          
          if (data.isPlaying) {
            setIsVisible(true);
          } else if (offlineMode === 'hide') {
            setIsVisible(false);
          }
        }
      } catch (err) {
        console.error('Error fetching now playing state:', err);
      }
    };

    fetchNowPlaying();
    const pollInterval = setInterval(fetchNowPlaying, pollIntervalMs);

    return () => clearInterval(pollInterval);
  }, [offlineMode, pollIntervalMs]);

  // Smooth progress bar update (100ms interval interpolation)
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (!track.isPlaying || !track.progressMs || !track.durationMs) {
      setSmoothProgress(0);
      return;
    }

    setSmoothProgress(track.progressMs);
    let lastUpdate = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastUpdate;
      lastUpdate = now;

      setSmoothProgress((prev) => {
        const next = prev + elapsed;
        return next >= (track.durationMs || 0) ? 0 : next;
      });
    }, 100);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [track.isPlaying, track.progressMs, track.durationMs, track.timestamp]);

  // Calculation for progress percentage
  const progressPercent = track.durationMs 
    ? Math.min(100, (smoothProgress / track.durationMs) * 100)
    : 0;

  // Format milliseconds to M:SS
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // If set to hide when offline and nothing is playing, render empty
  if (!isVisible || (!track.isPlaying && offlineMode === 'hide')) {
    return <div className="w-screen h-screen bg-transparent" />;
  }

  // Get dynamic container classes
  const getContainerClasses = () => {
    let classes = 'relative overflow-hidden transition-all duration-500 rounded-xl select-none ';

    // Theme selector
    if (theme === 'transparent') {
      classes += 'bg-transparent text-white';
    } else if (theme === 'glass-light') {
      classes += 'bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 shadow-md';
    } else if (theme === 'solid-black') {
      classes += 'bg-black text-white shadow-xl';
    } else if (theme === 'solid-white') {
      classes += 'bg-white text-slate-900 border border-slate-200 shadow-xl';
    } else {
      // glass-dark (default)
      classes += 'bg-slate-950/75 backdrop-blur-lg border border-white/10 text-white shadow-2xl';
    }

    // Glow effects
    if (glow && track.isPlaying) {
      classes += ' shadow-[0_0_20px_rgba(29,185,84,0.3)] border-[#1DB954]/20';
    }

    // Layout configuration
    if (layout === 'compact') {
      classes += ' flex items-center p-3.5 max-w-[400px] w-full h-[100px]';
    } else if (layout === 'card') {
      classes += ' flex flex-col p-5 max-w-[280px] w-full items-center text-center';
    } else {
      // minimal
      classes += ' flex items-center justify-between p-2.5 max-w-[300px] w-full h-[54px]';
    }

    return classes;
  };

  // Determine marquee requirements (scroll if text is too long)
  const isMarqueeRequired = (text: string = '') => {
    return text.length > 22;
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-transparent overflow-hidden p-4">
      {/* CSS Styles for smooth scrolling marquee */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .marquee-container {
          display: flex;
          overflow: hidden;
          width: 100%;
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        .marquee-content {
          display: flex;
          flex-shrink: 0;
          min-width: 100%;
          gap: 2rem;
          animation: marquee 12s linear infinite;
        }
      `}</style>

      <div className={getContainerClasses()}>
        {/* Album Art Section */}
        {track.isPlaying && track.albumImageUrl ? (
          <div className={`relative shrink-0 overflow-hidden ${
            layout === 'card' 
              ? 'w-28 h-28 rounded-lg mb-3.5 shadow-md' 
              : layout === 'minimal'
                ? 'w-8 h-8 rounded'
                : 'w-16 h-16 rounded-lg mr-3.5 shadow'
          }`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={track.albumImageUrl} 
              alt={track.album || 'Album Artwork'} 
              className={`object-cover w-full h-full ${track.isPlaying ? 'animate-[spin_24s_linear_infinite]' : ''}`}
              style={{ animationPlayState: track.isPlaying ? 'running' : 'paused' }}
            />
            {layout !== 'minimal' && (
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                <div className="flex gap-0.5 items-end h-3 w-3">
                  <span className="w-0.5 bg-[#1DB954] rounded-full animate-[pulse_0.8s_infinite_alternate]" style={{ height: '30%' }} />
                  <span className="w-0.5 bg-[#1DB954] rounded-full animate-[pulse_1.1s_infinite_alternate_0.15s]" style={{ height: '85%' }} />
                  <span className="w-0.5 bg-[#1DB954] rounded-full animate-[pulse_0.7s_infinite_alternate_0.3s]" style={{ height: '50%' }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Offline Placeholder Icon */
          <div className={`shrink-0 flex items-center justify-center bg-white/5 rounded ${
            layout === 'card' 
              ? 'w-24 h-24 rounded-lg mb-3.5' 
              : layout === 'minimal'
                ? 'w-8 h-8'
                : 'w-14 h-14 rounded-lg mr-3.5'
          }`}>
            <Music className={`text-slate-500 ${layout === 'minimal' ? 'w-4 h-4' : 'w-6 h-6'}`} />
          </div>
        )}

        {/* Content Section */}
        <div className={`min-w-0 flex-1 ${
          layout === 'card' 
            ? 'w-full flex flex-col items-center' 
            : 'flex flex-col justify-center'
        }`}>
          {/* Song Title (Marquee if long) */}
          <div className="w-full">
            {track.isPlaying && track.title && isMarqueeRequired(track.title) ? (
              <div className="marquee-container">
                <div className="marquee-content">
                  <span className="font-bold text-sm tracking-tight whitespace-nowrap">{track.title}</span>
                  <span className="font-bold text-sm tracking-tight whitespace-nowrap">{track.title}</span>
                </div>
              </div>
            ) : (
              <h4 className="font-bold text-sm tracking-tight truncate w-full">
                {track.isPlaying ? (track.title || 'Unknown Track') : 'Not Playing'}
              </h4>
            )}
          </div>

          {/* Artist Name */}
          <div className="w-full mt-0.5">
            <p className={`text-xs truncate w-full ${
              theme === 'glass-light' || theme === 'solid-white' 
                ? 'text-slate-500' 
                : 'text-slate-400'
            }`}>
              {track.isPlaying ? (track.artist || 'Unknown Artist') : 'Spotify Offline'}
            </p>
          </div>

          {/* Progress Bar (Compact & Card layouts only) */}
          {showBar && layout !== 'minimal' && track.isPlaying && (
            <div className="w-full mt-2.5 space-y-1">
              <div className={`h-1 rounded-full overflow-hidden ${
                theme === 'glass-light' || theme === 'solid-white' 
                  ? 'bg-slate-200' 
                  : 'bg-white/10'
              }`}>
                <div 
                  className="h-full bg-[#1DB954] rounded-full transition-all duration-100 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-slate-500">
                <span>{formatTime(smoothProgress)}</span>
                <span>{formatTime(track.durationMs || 0)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Layout State Icon */}
        {layout === 'minimal' && track.isPlaying && (
          <div className="shrink-0 pl-2">
            <Volume2 className="w-3.5 h-3.5 text-[#1DB954]" />
          </div>
        )}
      </div>
    </div>
  );
}
