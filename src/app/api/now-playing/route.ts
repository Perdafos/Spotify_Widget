import { NextResponse } from 'next/server';
import { getCurrentlyPlaying } from '@/lib/spotify';

export async function GET() {
  try {
    const data = await getCurrentlyPlaying();
    
    // Return track info with cache-control headers disabled
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*', // Enable CORS for OBS browser sources
      },
    });
  } catch (error: any) {
    console.error('Error in /api/now-playing route:', error);
    return NextResponse.json(
      { isPlaying: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
