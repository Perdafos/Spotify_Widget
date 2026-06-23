'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Music, 
  Volume2, 
  Sliders, 
  AlertTriangle,
  Play,
  Layers,
  Sparkles
} from 'lucide-react';

const SpotifyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.564.387-.86.207-2.377-1.454-5.37-1.783-8.894-.978-.336.077-.67-.134-.748-.47-.077-.337.134-.67.47-.749 3.856-.88 7.15-.509 9.825 1.13.295.178.387.563.207.86zm1.224-2.723c-.226.367-.706.487-1.072.261-2.717-1.67-6.86-2.152-10.065-1.18-.41.124-.843-.105-.968-.515-.125-.41.104-.843.515-.968 3.666-1.112 8.225-.572 11.33 1.338.366.226.486.706.26 1.072zm.106-2.834C14.364 8.78 8.497 8.583 5.114 9.61c-.518.157-1.07-.136-1.228-.654-.158-.519.136-1.07.654-1.227 3.882-1.179 10.37-.954 14.484 1.488.466.277.618.88.34 1.346-.277.466-.88.618-1.346.34z"/>
  </svg>
);
import { SpotifyTrackInfo } from '@/lib/spotify';

interface SetupClientProps {
  success: boolean;
  error: string | null;
  refreshToken: string | null;
  isConfigured: boolean;
  redirectUri: string;
}

export default function SetupClient({
  success,
  error,
  refreshToken,
  isConfigured,
  redirectUri
}: SetupClientProps) {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  
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
    progressMs: 78000,
    durationMs: 240000,
    timestamp: Date.now(),
  });
  
  const [liveData, setLiveData] = useState<SpotifyTrackInfo | null>(null);
  const [isPollingLive, setIsPollingLive] = useState(false);

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
        const res = await fetch('/api/now-playing');
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
  }, [isPollingLive]);

  // Construct widget preview URL
  const getWidgetUrl = (absolute = false) => {
    const basePath = absolute && typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams();
    if (widgetTheme !== 'glass-dark') params.append('theme', widgetTheme);
    if (widgetLayout !== 'compact') params.append('layout', widgetLayout);
    if (!showProgressBar) params.append('bar', 'false');
    if (glowEffect) params.append('glow', 'true');
    
    const queryString = params.toString();
    return `${basePath}/widget${queryString ? `?${queryString}` : ''}`;
  };

  // Active track to display in preview (either live or demo)
  const activeTrack = isPollingLive && liveData ? liveData : nowPlaying;

  // Local state for smooth progress bar updates in preview
  const [smoothProgress, setSmoothProgress] = useState(0);

  useEffect(() => {
    if (!activeTrack.isPlaying || !activeTrack.progressMs || !activeTrack.durationMs) {
      setSmoothProgress(0);
      return;
    }

    setSmoothProgress(activeTrack.progressMs);
    let lastUpdate = Date.now();

    const animFrame = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastUpdate;
      lastUpdate = now;

      setSmoothProgress((prev) => {
        const next = prev + elapsed;
        return next >= (activeTrack.durationMs || 0) ? 0 : next;
      });
    }, 100);

    return () => clearInterval(animFrame);
  }, [activeTrack.isPlaying, activeTrack.progressMs, activeTrack.durationMs, activeTrack.timestamp]);

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
    if (glowEffect) {
      base += ' shadow-[0_0_25px_rgba(29,185,84,0.15)]';
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
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-[#1DB954] selection:text-black">
      {/* Glow dots decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1DB954]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <nav className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1DB954]/10 rounded-xl border border-[#1DB954]/20">
              <span className="text-[#1DB954] text-xl font-bold">Sp</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Spotify Stream Widget
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs px-2.5 py-1 bg-slate-800 rounded-full border border-white/5 text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {isConfigured ? 'Configured' : 'Credentials Missing'}
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
                  Anda perlu mengatur <strong>SPOTIFY_CLIENT_ID</strong> dan <strong>SPOTIFY_CLIENT_SECRET</strong> di file <code>.env.local</code> Anda terlebih dahulu sebelum bisa melakukan otorisasi.
                </p>
                <div className="text-xs pt-1.5 text-slate-400 space-y-1">
                  <p>1. Copy <code>.env.example</code> menjadi <code>.env.local</code></p>
                  <p>2. Isi Client ID dan Client Secret dari Spotify Developer Dashboard</p>
                  <p>3. Restart server pengembangan Next.js</p>
                </div>
              </div>
            </div>
          )}

          {/* Success block */}
          {success && refreshToken && (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-4">
              <div className="flex gap-3 items-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <h3 className="text-lg font-semibold text-white">Koneksi Spotify Berhasil!</h3>
              </div>
              <p className="text-sm text-slate-300">
                Refresh Token Anda telah berhasil diambil. Token ini telah disimpan secara otomatis ke file <code>spotify-token.json</code> di root proyek Anda untuk pengembangan lokal.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Refresh Token Anda (Untuk Vercel)</label>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    readOnly 
                    value={refreshToken} 
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono w-full text-slate-300 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(refreshToken, setCopied)}
                    className="px-4 py-2 bg-slate-800 border border-white/10 hover:bg-slate-700 transition rounded-xl text-sm flex items-center gap-2 text-slate-300"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  ⚠️ <strong>Tips:</strong> Jika Anda mendeploy widget ini ke Vercel, tambahkan Environment Variable bernama <code>SPOTIFY_REFRESH_TOKEN</code> dengan nilai di atas agar widget terus berjalan secara otomatis.
                </p>
              </div>
            </div>
          )}

          {/* Connection Step Card */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1DB954]/10 border border-[#1DB954]/20 flex items-center justify-center text-[#1DB954]">
                <SpotifyIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Langkah 1: Hubungkan dengan Spotify</h3>
                <p className="text-sm text-slate-400">Izinkan aplikasi Anda mengakses status pemutaran lagu.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 text-sm space-y-3 text-slate-300">
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">1</span>
                <p>Pastikan Redirect URI di Spotify Developer Dashboard Anda diatur ke:<br />
                  <code className="text-emerald-400 font-mono break-all">{redirectUri || 'http://localhost:3000/api/callback'}</code>
                </p>
              </div>
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">2</span>
                <p>Klik tombol di bawah ini untuk mengautentikasi akun Spotify Anda.</p>
              </div>
            </div>

            <a
              href={isConfigured ? "/api/login" : "#"}
              onClick={(e) => {
                if (!isConfigured) {
                  e.preventDefault();
                  alert('Silakan atur file .env.local terlebih dahulu!');
                }
              }}
              className={`w-full py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
                isConfigured 
                  ? 'bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-lg shadow-[#1DB954]/20 hover:scale-[1.01]' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <SpotifyIcon className="w-5 h-5 fill-current text-black shrink-0" />
              Sambungkan Akun Spotify
            </a>
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
                  <p>Beri nama widget (misalnya <em>Spotify Widget</em>) dan paste URL widget yang telah disalin di bawah.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                  <p>Atur ukuran Width dan Height sesuai gaya pilihan Anda. Contoh: <strong>420px x 110px</strong> untuk horizontal compact.</p>
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
                    className="px-4 py-2 bg-slate-800 border border-white/10 hover:bg-slate-700 transition rounded-xl text-sm flex items-center gap-2 text-slate-300 shrink-0"
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
                className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                  isPollingLive 
                    ? 'bg-[#1DB954]/20 border-[#1DB954]/30 text-[#1DB954]' 
                    : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPollingLive ? 'animate-spin' : ''}`} />
                {isPollingLive ? 'Live Spotify data' : 'Preview Demo'}
              </button>
            </div>

            {/* Container for Preview */}
            <div className="flex-1 min-h-[220px] bg-slate-950/40 border border-white/5 rounded-xl flex items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              
              {/* Spotify widget element wrapper */}
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
                          <span className="w-0.75 bg-[#1DB954] rounded-full animate-[pulse_1s_infinite_alternate]" style={{ height: '40%' }} />
                          <span className="w-0.75 bg-[#1DB954] rounded-full animate-[pulse_1.2s_infinite_alternate_0.2s]" style={{ height: '90%' }} />
                          <span className="w-0.75 bg-[#1DB954] rounded-full animate-[pulse_0.8s_infinite_alternate_0.4s]" style={{ height: '60%' }} />
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
                    <h4 className="font-bold text-sm truncate w-full hover:text-[#1DB954] transition-colors">
                      {activeTrack.title || 'Nothing Playing'}
                    </h4>
                  </div>
                  <p className={`text-xs truncate w-full ${
                    widgetTheme === 'glass-light' || widgetTheme === 'solid-white' 
                      ? 'text-slate-500' 
                      : 'text-slate-400'
                  }`}>
                    {activeTrack.artist || 'Connect your account'}
                  </p>

                  {/* Horizontal Progress Bar */}
                  {showProgressBar && widgetLayout !== 'minimal' && activeTrack.isPlaying && (
                    <div className="w-full mt-3 space-y-1.5">
                      <div className={`h-1.5 rounded-full overflow-hidden ${
                        widgetTheme === 'glass-light' || widgetTheme === 'solid-white' 
                          ? 'bg-slate-200' 
                          : 'bg-white/10'
                      }`}>
                        <div 
                          className="h-full bg-[#1DB954] rounded-full transition-all duration-100 ease-out" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>{formatTime(smoothProgress)}</span>
                        <span>{formatTime(activeTrack.durationMs || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact styling status decoration */}
                {widgetLayout === 'minimal' && activeTrack.isPlaying && (
                  <div className="shrink-0 pl-2">
                    <Volume2 className="w-4 h-4 text-[#1DB954]" />
                  </div>
                )}
              </div>

            </div>

            {/* Customizer Inputs */}
            <div className="space-y-5">
              <h4 className="font-semibold text-sm text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#1DB954]" />
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
                          ? 'bg-slate-800 border-[#1DB954] text-white font-medium' 
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
                          ? 'bg-slate-800 border-[#1DB954] text-white font-medium' 
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
                <div className="flex items-center justify-between">
                  <label htmlFor="bar-toggle" className="text-xs text-slate-400 cursor-pointer">Tampilkan Progress Bar Lagu</label>
                  <button
                    id="bar-toggle"
                    onClick={() => setShowProgressBar(!showProgressBar)}
                    disabled={widgetLayout === 'minimal'}
                    className={`w-10 h-6 rounded-full transition-colors relative focus:outline-none ${
                      widgetLayout === 'minimal' 
                        ? 'bg-slate-800 opacity-50 cursor-not-allowed' 
                        : showProgressBar 
                          ? 'bg-[#1DB954]' 
                          : 'bg-slate-800'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        showProgressBar && widgetLayout !== 'minimal' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="glow-toggle" className="text-xs text-slate-400 cursor-pointer">Efek Glow Neon Spotify</label>
                  <button
                    id="glow-toggle"
                    onClick={() => setGlowEffect(!glowEffect)}
                    className={`w-10 h-6 rounded-full transition-colors relative focus:outline-none ${
                      glowEffect ? 'bg-[#1DB954]' : 'bg-slate-800'
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
        <p>Spotify Widget Creator &copy; {new Date().getFullYear()}. Cocok digunakan untuk streaming OBS, vMix, & Streamlabs.</p>
      </footer>
    </div>
  );
}
