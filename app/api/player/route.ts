import { NextRequest } from 'next/server';
import { scoutPlayer } from '@/lib/playerEngine';

export async function GET(req: NextRequest) {
  const name = new URL(req.url).searchParams.get('name');
  if (!name) return new Response(JSON.stringify({ error: 'Missing name' }), { status: 400 });
  try {
    const player = await scoutPlayer(name);
    return new Response(JSON.stringify(player), { status: 200 });
  } catch (e: any) {
    console.error('❌ scoutPlayer error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 502 });
  }
}
