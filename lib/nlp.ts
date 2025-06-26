// FILE: lib/nlp.ts

import { NlpManager } from 'node-nlp';

const manager = new NlpManager({ languages: ['en'], forceNER: true });

// Pre-train NLP for detection of roles, skills, tendencies, etc.
// This is a very simple initial model and can be improved further.
manager.addDocument('en', 'great shooter', 'threePoint.high');
manager.addDocument('en', 'good shooter', 'threePoint.mid');
manager.addDocument('en', 'bad shooter', 'threePoint.low');

manager.addDocument('en', 'elite passer', 'passing.high');
manager.addDocument('en', 'strong finisher', 'layup.high');
manager.addDocument('en', 'explosive dunker', 'dunking.high');

manager.addDocument('en', 'very fast', 'physical.speed.high');
manager.addDocument('en', 'very strong', 'physical.strength.high');
manager.addDocument('en', 'high stamina', 'physical.stamina.high');

manager.train();

function scoreLevel(label: string) {
  if (label.endsWith('high')) return 9;
  if (label.endsWith('mid')) return 6;
  if (label.endsWith('low')) return 3;
  return 5;
}

export async function extractProfileFromText(text: string) {
  const result: any = {
    attributes: {
      layup: 5,
      dunking: 5,
      inside: 5,
      midrange: 5,
      three: 5,
      freeThrow: 5,
      dribbling: 5,
      passing: 5,
      offReb: 5,
      defReb: 5,
      stealing: 5,
      blocking: 5
    },
    physical: {
      speed: 5,
      strength: 5,
      stamina: 5
    },
    tendencies: {
      dunks: 0,
      floaters: 0,
      postups: 0,
      hookshots: 0,
      twoPointers: 0,
      threePointers: 0,
      pumpfakes: 0,
      fades: 0,
      passes: 0,
      lobs: 0,
      crossovers: 0,
      spinmoves: 0,
      stepbacks: 0,
      offReb: 0,
      runPlay: 0,
      defReb: 0,
      onBallSteals: 0,
      offBallSteals: 0,
      blocks: 0,
      takeCharge: 0,
    }
  };

  const heightMatch = text.match(/([6-7]'\d{1,2}\"?)/);
  if (heightMatch) result.height = heightMatch[1];

  const weightMatch = text.match(/(\d{3})\s?lbs?/i);
  if (weightMatch) result.weight = weightMatch[1] + ' lbs';

  const jerseyMatch = text.match(/#(\d{1,2})/);
  if (jerseyMatch) result.jersey = jerseyMatch[1];

  const teamMatch = text.match(/(?:at|for)\s([A-Z][a-zA-Z\s]+)/);
  if (teamMatch) result.team = teamMatch[1];

  const yearMatch = text.match(/(Freshman|Sophomore|Junior|Senior)/);
  if (yearMatch) result.year = yearMatch[1];

  // Detect NLP-based traits
  const lines = text.split(/[\n\.]/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const response = await manager.process('en', line);
    response.classifications.forEach((cls: any) => {
      const [category, level] = cls.label.split('.');
      const score = scoreLevel(cls.label);

      if (category in result.attributes) {
        result.attributes[category] = Math.max(result.attributes[category], score);
      } else if (category === 'physical') {
        const trait = level;
        result.physical[trait] = Math.max(result.physical[trait], score);
      }
    });

    // Very basic tendency detection
    const keywords = Object.keys(result.tendencies);
    keywords.forEach((k) => {
      if (line.toLowerCase().includes(k)) {
        result.tendencies[k] += 1;
      }
    });
  }

  result.analysis = lines.slice(0, 5).join('. ');
  return result;
}
