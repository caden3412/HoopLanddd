import { NextRequest } from 'next/server';
import { scoutPlayer } from '@/lib/playerEngine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');

  if (!name) {
    return new Response(JSON.stringify({ error: 'Missing name' }), { status: 400 });
  }

  try {
    const player = await scoutPlayer(name);
    return new Response(JSON.stringify(player), { status: 200 });
  } catch (err: any) {
    console.error('Error in /api/player:', err.message);
    return new Response(JSON.stringify({ error: 'Internal error occurred' }), { status: 500 });
  }
}
