import { NextRequest } from 'next/server';
import { scoutPlayer } from '@/lib/playerEngine';

export async function GET(req: NextRequest) {
  const name = new URL(req.url).searchParams.get('name')?.trim();
  if (!name) return new Response(JSON.stringify({ error: 'Missing name' }), { status:400 });

  try {
    const profile = await scoutPlayer(name);
    return new Response(JSON.stringify(profile), { status:200 });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e.message }), { status:500 });
  }
}
