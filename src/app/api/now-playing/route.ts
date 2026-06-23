import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentlyPlaying } from '@/lib/lastfm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const user = searchParams.get('user') || undefined;
    
    const data = await getCurrentlyPlaying(user);
    
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
