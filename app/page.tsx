'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
const Radar = dynamic(() => import('@/components/Radar'), { ssr: false });

export default function PlayerScoutPage() {
  // ...existing hooks...
  return (
    <>
      <div className="flex gap-4">
        <input /* stylings */ />
        <button /* stylings */ onClick={scout}>Scout 🏀</button>
      </div>
      {/* loading, error */}
      {player && (
        <>
          <h2>{player.name} ({player.starRating}-star)</h2>
          <Radar data={player.attributes} />
          {/* summary, tendencies list */}
        </>
      )}
    </>
  );
}
