// app/api/player/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { scoutPlayer } from '@/lib/playerEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Missing player name' }, { status: 400 });
  }

  try {
    const profile = await scoutPlayer(name);
    return NextResponse.json(profile);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch player profile' }, { status: 500 });
  }
}
