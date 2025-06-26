// lib/playerEngine.ts
import { scrapePlayerBio } from './sources';
import { extractNLPProfile } from './nlp';

export async function scoutPlayer(name: string) {
  const rawText = await scrapePlayerBio(name);
  const result = await extractNLPProfile(rawText);

  return {
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    height: result.height || 'Unknown',
    weight: result.weight || 'Unknown',
    jersey: result.jersey || 'N/A',
    team: result.team || 'N/A',
    year: result.year || 'N/A',
    attributes: result.attributes || {
      layup: 5, dunking: 5, inside: 5, midrange: 5,
      three: 5, freeThrow: 5, dribbling: 5, passing: 5,
      offReb: 5, defReb: 5, stealing: 5, blocking: 5
    },
    physical: result.physical || {},
    tendencies: result.tendencies || {},
    analysis: result.analysis || rawText.slice(0, 1000),
    interest: result.interest || []
  };
}
