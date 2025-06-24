'use client';
import { useState } from 'react';

export default function Page() {
  const [search, setSearch] = useState('');
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState('');

  const fetchPlayer = async () => {
    setError('');
    try {
      const res = await fetch(`/api/player?name=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setPlayer(data);
    } catch (err) {
      setError(err.message);
      setPlayer(null);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">HoopLand Scout</h1>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 w-full mt-4"
        placeholder="Search player name"
      />
      <button onClick={fetchPlayer} className="mt-2 bg-black text-white px-4 py-2">Search</button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {player && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">{player.name}</h2>
          <pre>{JSON.stringify(player, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
