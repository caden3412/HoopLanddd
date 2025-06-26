// lib/nlp.ts
import { NlpManager } from 'node-nlp';

const manager = new NlpManager({ languages: ['en'], nlu: { log: false } });

export async function extractNLPProfile(text: string) {
  const result = {
    height: null,
    weight: null,
    jersey: null,
    team: null,
    year: null,
    attributes: {
      layup: 5, dunking: 5, inside: 5, midrange: 5, three: 5,
      freeThrow: 5, dribbling: 5, passing: 5,
      offReb: 5, defReb: 5, stealing: 5, blocking: 5
    },
    physical: {
      speed: 5, strength: 5, stamina: 5
    },
    tendencies: {
      dunks: 0, floaters: 0, postups: 0,
      hookshots: 0, twopointers: 0, threePointers: 0,
      pumpfakes: 0, fades: 0, passes: 0, lobs: 0,
      crossovers: 0, spinmoves: 0, stepbacks: 0,
      offReb: 0, runPlay: 0, defReb: 0,
      onBallSteals: 0, offBallSteals: 0, blocks: 0, takeCharge: 0,
      defense: 0
    },
    analysis: '',
    interest: []
  };

  if (!text || text.length < 10) return result;

  result.analysis = text.slice(0, 1000);

  const heightMatch = text.match(/(\d{1,2})\s?['"]\s?(\d{1,2})?\s?"?/);
  if (heightMatch) result.height = `${heightMatch[1]}'${heightMatch[2] || '0'}"`;

  const weightMatch = text.match(/(\d{2,3})\s?(pounds|lbs)/i);
  if (weightMatch) result.weight = `${weightMatch[1]} lbs`;

  const jerseyMatch = text.match(/#(\d{1,2})/);
  if (jerseyMatch) result.jersey = jerseyMatch[1];

  const yearMatch = text.match(/(freshman|sophomore|junior|senior)/i);
  if (yearMatch) result.year = yearMatch[1];

  const teamMatch = text.match(/committed to ([A-Z][a-zA-Z\s]+|[A-Z]{2,})|plays for ([A-Z][a-zA-Z\s]+)/);
  if (teamMatch) result.team = teamMatch[1] || teamMatch[2];

  return result;
}
