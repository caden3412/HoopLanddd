// lib/playerEngine.ts
import { scrapePlayerBio } from './scraper';
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
    attributes: result.attributes,
    physical: result.physical,
    tendencies: result.tendencies,
    analysis: result.analysis || rawText,
    interest: result.interest || []
  };
}
