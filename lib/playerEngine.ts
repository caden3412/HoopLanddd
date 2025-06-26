// FILE: lib/playerEngine.ts

import { getCleanedName } from './nameMatch';
import { scrapeAllSources } from './scrapers';
import { extractNLPProfile } from './nlp';
import { getRecruitingInterest } from './recruiting';
import { getTeamData } from './teams';

export async function scoutPlayer(name: string) {
  const cleanedName = await getCleanedName(name);
  const rawText = await scrapeAllSources(cleanedName);
  const result = await extractNLPProfile(rawText);
  const interest = await getRecruitingInterest(cleanedName);
  const teamInfo = result.team ? await getTeamData(result.team) : {};

  return {
    name: cleanedName,
    slug: cleanedName.toLowerCase().replace(/\s+/g, '-'),
    height: result.height || 'Unknown',
    weight: result.weight || 'Unknown',
    jersey: result.jersey || 'N/A',
    team: result.team || 'Uncommitted',
    year: result.year || 'N/A',
    attributes: result.attributes,
    physical: result.physical,
    tendencies: result.tendencies,
    analysis: result.analysis || rawText.slice(0, 1000),
    interest,
    teamInfo
  };
}
