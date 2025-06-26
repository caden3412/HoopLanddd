import { NlpManager } from 'node-nlp';

const manager = new NlpManager({ languages: ['en'], forceNER: true });

export async function extractNLPProfile(text: string) {
  if (!text || text.length < 30) {
    return {
      attributes: defaultAttributes(),
      physical: {},
      tendencies: {},
      analysis: 'No data available.',
    };
  }

  const lowerText = text.toLowerCase();

  const attributes = {
    layup: scoreKeyword(lowerText, ['finishes', 'layup', 'crafty']),
    dunking: scoreKeyword(lowerText, ['dunk', 'slam', 'vertical']),
    inside: scoreKeyword(lowerText, ['paint', 'post', 'interior']),
    midrange: scoreKeyword(lowerText, ['mid-range', 'pull-up', 'elbow jumper']),
    three: scoreKeyword(lowerText, ['three-point', '3pt', 'outside shot']),
    freeThrow: scoreKeyword(lowerText, ['free throw', 'ft line']),
    dribbling: scoreKeyword(lowerText, ['handle', 'ball control', 'dribbling']),
    passing: scoreKeyword(lowerText, ['pass', 'vision', 'playmaking']),
    offReb: scoreKeyword(lowerText, ['offensive rebound', 'second chance']),
    defReb: scoreKeyword(lowerText, ['defensive rebound', 'box out']),
    stealing: scoreKeyword(lowerText, ['steal', 'interception']),
    blocking: scoreKeyword(lowerText, ['block', 'rim protection']),
  };

  const tendencies = {
    postups: frequencyScore(lowerText, ['post up']),
    floaters: frequencyScore(lowerText, ['floater']),
    threePointers: frequencyScore(lowerText, ['three-point', '3pt']),
    spinmoves: frequencyScore(lowerText, ['spin move']),
    pumpfakes: frequencyScore(lowerText, ['pump fake']),
    stepbacks: frequencyScore(lowerText, ['step back']),
    defense: frequencyScore(lowerText, ['defense', 'defender']),
  };

  const physical = {
    speed: scoreKeyword(lowerText, ['quick', 'speed', 'fast']),
    strength: scoreKeyword(lowerText, ['strong', 'strength', 'muscular']),
    stamina: scoreKeyword(lowerText, ['conditioning', 'endurance']),
  };

  const height = matchHeight(text);
  const weight = matchWeight(text);
  const jersey = matchJersey(text);
  const team = matchTeam(text);
  const year = matchYear(text);

  return {
    attributes,
    tendencies,
    physical,
    height,
    weight,
    jersey,
    team,
    year,
    analysis: text,
  };
}

function scoreKeyword(text: string, keywords: string[]) {
  let score = 5;
  for (const keyword of keywords) {
    if (text.includes(keyword)) score += 1;
  }
  return Math.min(score, 10);
}

function frequencyScore(text: string, keywords: string[]) {
  let count = 0;
  for (const keyword of keywords) {
    count += text.split(keyword).length - 1;
  }
  return Math.min(count, 5);
}

function matchHeight(text: string): string | null {
  const match = text.match(/\b(6'?[0-9]|7'0?)\b/);
  return match ? match[0].replace("'", "'") : null;
}

function matchWeight(text: string): string | null {
  const match = text.match(/\b(1[5-9][0-9]|2[0-5][0-9])\s?(lbs|pounds)?\b/i);
  return match ? match[0] : null;
}

function matchJersey(text: string): string | null {
  const match = text.match(/#\d{1,2}/);
  return match ? match[0].replace('#', '') : null;
}

function matchTeam(text: string): string | null {
  const match = text.match(/\b(Alabama|Duke|Kansas|UCLA|USC|Michigan|Oregon|Kentucky|Texas|UNC)\b/i);
  return match ? match[0] : null;
}

function matchYear(text: string): string | null {
  const match = text.match(/\b(freshman|sophomore|junior|senior)\b/i);
  return match ? match[0] : null;
}

function defaultAttributes() {
  return {
    layup: 5, dunking: 5, inside: 5, midrange: 5,
    three: 5, freeThrow: 5, dribbling: 5, passing: 5,
    offReb: 5, defReb: 5, stealing: 5, blocking: 5
  };
}
