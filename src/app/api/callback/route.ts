import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, saveRefreshToken } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Build redirect URL base (host + protocol)
  const origin = request.nextUrl.origin;

  if (error) {
    console.error('Spotify auth callback error:', error);
    return NextResponse.redirect(`${origin}/setup?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/setup?error=Missing+authorization+code`);
  }

  try {
    const data = await getTokensFromCode(code);
    const refreshToken = data.refresh_token;

    if (refreshToken) {
      // Save refresh token locally
      saveRefreshToken(refreshToken);
      return NextResponse.redirect(`${origin}/setup?success=true&refresh_token=${encodeURIComponent(refreshToken)}`);
    } else {
      return NextResponse.redirect(`${origin}/setup?error=No+refresh+token+returned+from+Spotify`);
    }
  } catch (err: any) {
    console.error('Callback handler error:', err);
    return NextResponse.redirect(`${origin}/setup?error=${encodeURIComponent(err.message || 'Unknown error occurred')}`);
  }
}
