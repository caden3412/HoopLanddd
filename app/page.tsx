'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const Radar = dynamic(() => import('@/components/Radar'), { ssr: false });

export default function PlayerScoutPage() {
  const [search, setSearch] = useState('');
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scout = async () => {
    if (!search) return;
    setLoading(true);
    setError('');
    setPlayer(null);

    try {
      const res = await fetch(`/api/player?name=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch player');
      setPlayer(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Enter player name (e.g. bronny james)"
          className="border p-2 flex-1"
        />
        <button onClick={scout} className="bg-black text-white px-4 py-2">Scout 🏀</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {player && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{player.name}</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Attributes Radar</h3>
              <Radar data={player.attributes} />
            </div>

            <div>
              <h3 className="font-semibold">Player Info</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li><b>Height:</b> {player.height || 'Unknown'}</li>
                <li><b>Weight:</b> {player.weight || 'Unknown'}</li>
                <li><b>Jersey #:</b> {player.jersey || 'N/A'}</li>
                <li><b>Team:</b> {player.team || 'Uncommitted'}</li>
                <li><b>Year:</b> {player.year || 'N/A'}</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold">Attributes</h4>
              <pre className="text-sm">{JSON.stringify(player.attributes, null, 2)}</pre>
            </div>
            <div>
              <h4 className="font-semibold">Physical</h4>
              <pre className="text-sm">{JSON.stringify(player.physical || {}, null, 2)}</pre>
            </div>
            <div>
              <h4 className="font-semibold">Tendencies</h4>
              <pre className="text-sm">{JSON.stringify(player.tendencies, null, 2)}</pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold">Scouting Summary</h4>
            <p className="text-sm">{player.analysis || 'No scouting report available.'}</p>
          </div>

          {player.interest && (
            <div>
              <h4 className="font-semibold">Recruiting/Portal Interest</h4>
              <ul className="list-disc ml-6 text-sm">
                {player.interest.map((i: any) => (
                  <li key={i.school}>{i.school}: {i.percent}%</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
