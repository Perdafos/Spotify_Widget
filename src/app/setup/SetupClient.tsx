'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Music, 
  Volume2, 
  Sliders, 
  AlertTriangle,
  Play,
  Layers,
  Sparkles,
  ExternalLink as LinkIcon
} from 'lucide-react';
import { SpotifyTrackInfo } from '@/lib/lastfm';

interface SetupClientProps {
  isConfigured: boolean;
  defaultUsername: string;
}

export default function SetupClient({
  isConfigured,
  defaultUsername
}: SetupClientProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [username, setUsername] = useState(defaultUsername);
  
  // Widget Customization States
  const [widgetTheme, setWidgetTheme] = useState('glass-dark');
  const [widgetLayout, setWidgetLayout] = useState('compact');
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [glowEffect, setGlowEffect] = useState(true);
  
  // Demo Track state for previewing
  const [nowPlaying, setNowPlaying] = useState<SpotifyTrackInfo>({
    isPlaying: true,
    title: 'Sweater Weather',
    artist: 'The Neighbourhood',
    album: 'I Love You.',
    albumImageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
    songUrl: '#',
    durationMs: 240000,
    progressMs: 98000,
  });
  
  const [liveData, setLiveData] = useState<SpotifyTrackInfo | null>(null);
  const [isPollingLive, setIsPollingLive] = useState(false);

  const [smoothProgress, setSmoothProgress] = useState(0);
  const [currentSongKey, setCurrentSongKey] = useState('');
  const [songStartTime, setSongStartTime] = useState<number>(0);

  // Copy helper
  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Poll actual api/now-playing if user turns it on
  useEffect(() => {
    if (!isPollingLive) return;

    const fetchNowPlaying = async () => {
      try {
        const url = username ? `/api/now-playing?user=${encodeURIComponent(username)}` : '/api/now-playing';
        const res = await fetch(url);
        if (res.ok) {
          const data: SpotifyTrackInfo = await res.json();
          setLiveData(data);
        }
      } catch (err) {
        console.error('Error fetching now playing:', err);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, [isPollingLive, username]);

  // Construct widget preview URL
  const getWidgetUrl = (absolute = false) => {
    const basePath = absolute && typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams();
    if (username) params.append('user', username);
    if (widgetTheme !== 'glass-dark') params.append('theme', widgetTheme);
    if (widgetLayout !== 'compact') params.append('layout', widgetLayout);
    if (!showProgressBar) params.append('bar', 'false');
    if (glowEffect) params.append('glow', 'true');
    
    const queryString = params.toString();
    return `${basePath}/widget${queryString ? `?${queryString}` : ''}`;
  };

  // Active track to display in preview (either live or demo)
  const activeTrack = isPollingLive && liveData ? liveData : nowPlaying;

  // Sync song start time for smooth progress bar interpolation in preview
  useEffect(() => {
    if (!activeTrack.isPlaying) {
      setCurrentSongKey('');
      setSongStartTime(0);
      return;
    }
    const key = `${activeTrack.title}-${activeTrack.artist}`;
    setCurrentSongKey((prevKey) => {
      if (prevKey !== key) {
        setSongStartTime(Date.now() - (activeTrack.progressMs || 0));
        return key;
      }
      if (activeTrack.progressMs !== undefined) {
        setSongStartTime(Date.now() - activeTrack.progressMs);
      }
      return prevKey;
    });
  }, [activeTrack.isPlaying, activeTrack.title, activeTrack.artist, activeTrack.progressMs]);

  // Smooth progress bar update (100ms interval interpolation) in preview
  useEffect(() => {
    if (!activeTrack.isPlaying || !activeTrack.durationMs || !songStartTime) {
      setSmoothProgress(0);
      return;
    }

    setSmoothProgress(Math.max(0, Date.now() - songStartTime));

    const interval = setInterval(() => {
      const elapsed = Date.now() - songStartTime;
      if (elapsed >= (activeTrack.durationMs || 0)) {
        setSmoothProgress(activeTrack.durationMs || 0);
      } else {
        setSmoothProgress(elapsed);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeTrack.isPlaying, activeTrack.durationMs, songStartTime]);

  const progressPercent = activeTrack.durationMs 
    ? Math.min(100, (smoothProgress / activeTrack.durationMs) * 100)
    : 0;

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Determine styling classes for preview based on user options
  const getPreviewClasses = () => {
    let base = 'relative overflow-hidden transition-all duration-500 rounded-2xl ';
    
    // Theme styling
    if (widgetTheme === 'transparent') {
      base += 'bg-transparent border border-white/10 text-white';
    } else if (widgetTheme === 'glass-light') {
      base += 'bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 shadow-lg';
    } else if (widgetTheme === 'solid-black') {
      base += 'bg-black text-white shadow-xl';
    } else if (widgetTheme === 'solid-white') {
      base += 'bg-white text-slate-900 border border-slate-200 shadow-xl';
    } else {
      // glass-dark (default)
      base += 'bg-slate-900/60 backdrop-blur-lg border border-white/10 text-white shadow-2xl';
    }

    // Glow styling
    if (glowEffect && activeTrack.isPlaying) {
      base += ' shadow-[0_0_25px_rgba(213,16,7,0.2)] border-[#D51007]/20';
    }

    // Layout configuration
    if (widgetLayout === 'compact') {
      base += ' flex items-center p-4 max-w-[420px] w-full';
    } else if (widgetLayout === 'card') {
      base += ' flex flex-col p-6 max-w-[300px] w-full items-center text-center';
    } else {
      // minimal
      base += ' flex items-center justify-between p-3 max-w-[320px] w-full';
    }

    return base;
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-[#D51007] selection:text-white">
      {/* Glow dots decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D51007]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <nav className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D51007]/10 rounded-xl border border-[#D51007]/20">
              <Music className="text-[#D51007] w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Music Stream Widget
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs px-2.5 py-1 bg-slate-800 rounded-full border border-white/5 text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {isConfigured ? 'Last.fm Connected' : 'API Key Missing'}
            </span>
          </div>
        </div>
      </nav>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Setup steps and token info (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Status Alert if Credentials missing */}
          {!isConfigured && (
            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-4 items-start text-amber-200">
              <AlertTriangle className="w-6 h-6 shrink-0 text-amber-500" />
              <div className="space-y-1.5">
                <h4 className="font-semibold text-white">Prasyarat Terdeteksi Kosong (.env)</h4>
                <p className="text-sm text-slate-300">
                  Anda perlu mengatur <strong>LASTFM_API_KEY</strong> di file <code>.env</code> Anda (atau di Vercel Dashboard) agar widget dapat memanggil API Last.fm.
                </p>
                <div className="text-xs pt-1.5 text-slate-400 space-y-1">
                  <p>1. Buat API key gratis di <a href="https://www.last.fm/api/account/create" target="_blank" rel="noreferrer" className="text-red-400 underline inline-flex items-center gap-0.5">Last.fm API Account <ExternalLink className="w-3 h-3 inline" /></a></p>
                  <p>2. Buat file <code>.env</code> di root proyek Anda</p>
                  <p>3. Masukkan <code>LASTFM_API_KEY=api_key_anda</code></p>
                  <p>4. Restart server pengembangan lokal Anda atau lakukan Redeploy di Vercel</p>
                </div>
              </div>
            </div>
          )}

          {/* Connection Step Card */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Langkah 1: Konfigurasi Username Last.fm</h3>
                <p className="text-sm text-slate-400">Hubungkan widget dengan memasukkan nama pengguna Last.fm Anda.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Username Last.fm Anda</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: perdafos"
                  className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm w-full text-slate-300 focus:outline-none focus:border-[#D51007] transition"
                />
              </div>

              <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 text-sm space-y-3 text-slate-300">
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">1</span>
                  <p>Pasang ekstensi browser **Web Scrobbler** (Chrome/Firefox/Edge) atau aplikasi Last.fm di HP Android/iOS Anda.</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">2</span>
                  <p>Hubungkan pemutar musik Anda (seperti **YouTube Music**, Spotify Free, Apple Music, atau lainnya) pada Web Scrobbler.</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">3</span>
                  <p>Saat Anda memutar musik, data lagu yang diputar akan otomatis diteruskan secara langsung ke widget ini.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Integration instructions for OBS */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Langkah 2: Integrasikan ke OBS Studio</h3>
                <p className="text-sm text-slate-400">Tambahkan widget sebagai Browser Source di live stream Anda.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                  <p>Buka OBS Studio, klik tombol <strong>+</strong> di panel <strong>Sources</strong>, lalu pilih <strong>Browser</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                  <p>Beri nama widget (misalnya <em>Music Widget</em>) dan paste URL widget yang telah disalin di bawah.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                  <p>Atur ukuran Width dan Height sesuai layout pilihan Anda (misalnya <strong>420px x 110px</strong> untuk Compact Row).</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">URL Widget OBS Anda</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={getWidgetUrl(true)} 
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono w-full text-slate-300 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(getWidgetUrl(true), setCopiedUrl)}
                    disabled={!username}
                    className={`px-4 py-2 border rounded-xl text-sm flex items-center gap-2 shrink-0 transition ${
                      username
                        ? 'bg-slate-800 border-white/10 hover:bg-slate-700 text-slate-300'
                        : 'bg-slate-900 border-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    {copiedUrl ? 'Copied' : 'Copy URL'}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Widget customizer & Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Live Preview Display */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-6 flex flex-col">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Live Widget Preview
              </h3>
              
              {/* Poll live switch */}
              <button 
                onClick={() => setIsPollingLive(!isPollingLive)}
                disabled={!isConfigured || !username}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                  !isConfigured || !username
                    ? 'bg-slate-900 border-white/5 text-slate-600 cursor-not-allowed'
                    : isPollingLive 
                      ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                      : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPollingLive ? 'animate-spin' : ''}`} />
                {isPollingLive ? 'Live Last.fm data' : 'Preview Demo'}
              </button>
            </div>

            {/* Container for Preview */}
            <div className="flex-1 min-h-[220px] bg-slate-950/40 border border-white/5 rounded-xl flex items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              
              {/* Music widget element wrapper */}
              <div className={getPreviewClasses()}>
                {/* Album Art */}
                {activeTrack.albumImageUrl && (
                  <div className={`relative shrink-0 overflow-hidden ${
                    widgetLayout === 'card' 
                      ? 'w-32 h-32 rounded-xl mb-4 shadow-lg' 
                      : widgetLayout === 'minimal'
                        ? 'w-10 h-10 rounded-md mr-3'
                        : 'w-16 h-16 rounded-xl mr-4 shadow-md'
                  }`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={activeTrack.albumImageUrl} 
                      alt={activeTrack.album || 'Album Art'} 
                      className={`object-cover w-full h-full ${activeTrack.isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}
                      style={{ animationPlayState: activeTrack.isPlaying ? 'running' : 'paused' }}
                    />
                    
                    {/* Play Overlay Icon */}
                    {activeTrack.isPlaying && widgetLayout !== 'minimal' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex gap-1 items-end h-4 w-4">
                          <span className="w-0.75 bg-[#D51007] rounded-full animate-[pulse_1s_infinite_alternate]" style={{ height: '40%' }} />
                          <span className="w-0.75 bg-[#D51007] rounded-full animate-[pulse_1.2s_infinite_alternate_0.2s]" style={{ height: '90%' }} />
                          <span className="w-0.75 bg-[#D51007] rounded-full animate-[pulse_0.8s_infinite_alternate_0.4s]" style={{ height: '60%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Track Details */}
                <div className={`min-w-0 flex-1 ${
                  widgetLayout === 'card' 
                    ? 'w-full flex flex-col items-center' 
                    : 'flex flex-col justify-center'
                }`}>
                  <div className="w-full overflow-hidden relative">
                    <h4 className="font-bold text-sm truncate w-full hover:text-[#D51007] transition-colors">
                      {activeTrack.title || 'Nothing Playing'}
                    </h4>
                  </div>
                  <p className={`text-xs truncate w-full ${
                    widgetTheme === 'glass-light' || widgetTheme === 'solid-white' 
                      ? 'text-slate-500' 
                      : 'text-slate-400'
                  }`}>
                    {activeTrack.artist || 'Waiting for song...'}
                  </p>

                  {/* Progress Bar (Compact & Card layouts only) */}
                  {showProgressBar && widgetLayout !== 'minimal' && activeTrack.isPlaying && activeTrack.durationMs && (
                    <div className="w-full mt-2.5 space-y-1">
                      <div className={`h-1 rounded-full overflow-hidden ${
                        widgetTheme === 'glass-light' || widgetTheme === 'solid-white' 
                          ? 'bg-slate-200' 
                          : 'bg-white/10'
                      }`}>
                        <div 
                          className="h-full bg-[#D51007] rounded-full transition-all duration-100 ease-out" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-slate-500">
                        <span>{formatTime(smoothProgress)}</span>
                        <span>{formatTime(activeTrack.durationMs || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact styling status decoration */}
                {widgetLayout === 'minimal' && activeTrack.isPlaying && (
                  <div className="shrink-0 pl-2">
                    <Volume2 className="w-4 h-4 text-[#D51007]" />
                  </div>
                )}
              </div>

            </div>

            {/* Customizer Inputs */}
            <div className="space-y-5">
              <h4 className="font-semibold text-sm text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D51007]" />
                Kustomisasi Tampilan
              </h4>

              {/* Theme Selector */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400">Gaya & Tema Warna</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'glass-dark', name: 'Glass Dark (Rekomen)' },
                    { id: 'glass-light', name: 'Glass Light' },
                    { id: 'transparent', name: 'Transparent (OBS)' },
                    { id: 'solid-black', name: 'Solid Black' },
                    { id: 'solid-white', name: 'Solid White' }
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setWidgetTheme(theme.id)}
                      className={`text-left px-3 py-2 rounded-xl text-xs border transition ${
                        widgetTheme === theme.id 
                          ? 'bg-slate-800 border-[#D51007] text-white font-medium' 
                          : 'bg-slate-950 border-white/5 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Selector */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400">Tata Letak (Layout)</span>
                <div className="flex gap-2">
                  {[
                    { id: 'compact', name: 'Compact Row', size: '420x110px' },
                    { id: 'card', name: 'Card Square', size: '300x280px' },
                    { id: 'minimal', name: 'Minimal Badge', size: '320x60px' }
                  ].map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setWidgetLayout(layout.id)}
                      className={`flex-1 text-center py-2.5 rounded-xl border transition ${
                        widgetLayout === layout.id 
                          ? 'bg-slate-800 border-[#D51007] text-white font-medium' 
                          : 'bg-slate-950 border-white/5 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="text-xs">{layout.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">{layout.size}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Switches */}
              <div className="space-y-3 pt-2">
                {/* Progress Bar Toggle */}
                <div className="flex items-center justify-between">
                  <label htmlFor="bar-toggle" className="text-xs text-slate-400 cursor-pointer">Tampilkan Progress Bar & Waktu</label>
                  <button
                    id="bar-toggle"
                    onClick={() => setShowProgressBar(!showProgressBar)}
                    className={`w-10 h-6 rounded-full transition-colors relative focus:outline-none ${
                      showProgressBar ? 'bg-[#D51007]' : 'bg-slate-800'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        showProgressBar ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Glow Toggle */}
                <div className="flex items-center justify-between">
                  <label htmlFor="glow-toggle" className="text-xs text-slate-400 cursor-pointer">Efek Glow Neon Red</label>
                  <button
                    id="glow-toggle"
                    onClick={() => setGlowEffect(!glowEffect)}
                    className={`w-10 h-6 rounded-full transition-colors relative focus:outline-none ${
                      glowEffect ? 'bg-[#D51007]' : 'bg-slate-800'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        glowEffect ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Standalone View Button */}
              <a
                href={getWidgetUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 border border-white/5 hover:border-white/10 transition text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka Widget di Tab Baru
              </a>

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-16 bg-slate-950/20 text-center text-xs text-slate-500">
        <p>Music Stream Widget &copy; {new Date().getFullYear()}. Cocok digunakan untuk streaming OBS, vMix, & Streamlabs via Last.fm.</p>
      </footer>
    </div>
  );
}
