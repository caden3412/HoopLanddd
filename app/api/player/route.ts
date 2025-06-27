import { NextResponse } from 'next/server';
import { scoutPlayer } from '../../../lib/playerEngine';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const playerName = url.searchParams.get('name');
  if (!playerName) return NextResponse.json({ error: 'Missing player name' }, { status: 400 });

  try {
    const playerData = await scoutPlayer(playerName);
    return NextResponse.json(playerData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
