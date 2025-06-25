import { NextRequest } from 'next/server';
import { scoutPlayer } from '@/lib/playerEngine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');

  if (!name) {
    return new Response(JSON.stringify({ error: 'Missing name parameter' }), { status: 400 });
  }

  try {
    console.log(`GET /api/player called with name=${name}`);
    const player = await scoutPlayer(name);
    return new Response(JSON.stringify(player), { status: 200 });
  } catch (err: any) {
    console.error('Error in /api/player:', err.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
export async function POST() {
  return new Response(JSON.stringify({ error: 'POST not allowed. Use GET.' }), {
    status: 405,
    headers: { Allow: 'GET' },
  });
}

export async function PUT() {
  return new Response(JSON.stringify({ error: 'PUT not allowed. Use GET.' }), {
    status: 405,
    headers: { Allow: 'GET' },
  });
}

export async function DELETE() {
  return new Response(JSON.stringify({ error: 'DELETE not allowed. Use GET.' }), {
    status: 405,
    headers: { Allow: 'GET' },
  });
}
