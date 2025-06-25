// components/Radar.tsx
'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

type Props = {
  data: Record<string, number>;
};

export default function AttributeRadar({ data }: Props) {
  const formatted = Object.entries(data).map(([key, value]) => ({
    attribute: key,
    score: Math.round(value),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={formatted}>
        <PolarGrid />
        <PolarAngleAxis dataKey="attribute" fontSize={10} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} />
        <Radar name="Attribute" dataKey="score" stroke="#0f172a" fill="#0f172a" fillOpacity={0.6} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
