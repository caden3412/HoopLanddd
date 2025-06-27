import { getCloseMatch } from './nameMatch';
import { getBioFromSources } from './scrapers';
import { extractProfileFromText } from './nlp';
import { getRecruitingInterest } from './recruiting';
import { getTeamData } from './teams';

export async function scoutPlayer(name: string) {
  const cleanedName = await getCloseMatch(name);
  const rawText = await getBioFromSources(cleanedName);
  if (!rawText) throw new Error('No data found for player ' + cleanedName);

  const profile = await extractProfileFromText(rawText);
  const interest = await getRecruitingInterest(cleanedName);
  const teamInfo = profile.team ? await getTeamData(profile.team) : null;

  return {
    name: cleanedName,
    slug: cleanedName.toLowerCase().replace(/\s+/g, '-'),
    height: profile.height || 'Unknown',
    weight: profile.weight || 'Unknown',
    jersey: profile.jersey || 'N/A',
    team: profile.team || 'Uncommitted',
    year: profile.year || 'N/A',
    attributes: profile.attributes,
    physical: profile.physical,
    tendencies: profile.tendencies,
    analysis: profile.analysis || rawText.slice(0, 1500),
    interest,
    teamInfo,
  };
}
