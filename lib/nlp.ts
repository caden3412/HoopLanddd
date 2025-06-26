// lib/nlp.ts
import { NlpManager } from 'node-nlp';

const manager = new NlpManager({ languages: ['en'], forceNER: true });

export async function extractNLPProfile(text: string) {
  await manager.train(); // Required for some basic entity recognition
  const result = await manager.process('en', text);

  const extractAttributeScore = (keyword: string) => {
    const match = new RegExp(`${keyword}\\s*[:\\-]?\\s*(\\d{1,2})`, 'i').exec(text);
    return match ? Math.min(parseInt(match[1]), 10) : 5;
  };

  return {
    height: /(\d{1,2}'\d{1,2}")/.exec(text)?.[1] || null,
    weight: /(\d{2,3})\s?lbs/.exec(text)?.[1] || null,
    jersey: /#(\d+)/.exec(text)?.[1] || null,
    team: /team\s?:?\s?([A-Za-z ]+)/i.exec(text)?.[1] || null,
    year: /(freshman|sophomore|junior|senior)/i.exec(text)?.[1] || null,

    attributes: {
      layup: extractAttributeScore('layup'),
      dunking: extractAttributeScore('dunk'),
      inside: extractAttributeScore('inside'),
      midrange: extractAttributeScore('mid'),
      three: extractAttributeScore('three'),
      freeThrow: extractAttributeScore('free'),
      dribbling: extractAttributeScore('dribble'),
      passing: extractAttributeScore('pass'),
      offReb: extractAttributeScore('offensive reb'),
      defReb: extractAttributeScore('defensive reb'),
      stealing: extractAttributeScore('steal'),
      blocking: extractAttributeScore('block'),
    },

    physical: {
      speed: extractAttributeScore('speed'),
      strength: extractAttributeScore('strength'),
      stamina: extractAttributeScore('stamina'),
    },

    tendencies: {
      dunks: extractAttributeScore('dunks tendency'),
      floaters: extractAttributeScore('floaters'),
      postups: extractAttributeScore('post ups'),
      hookshots: extractAttributeScore('hook shots'),
      twopointers: extractAttributeScore('two pointers'),
      threePointers: extractAttributeScore('three pointers'),
      pumpfakes: extractAttributeScore('pump fakes'),
      fades: extractAttributeScore('fadeaways'),
      passes: extractAttributeScore('passes'),
      lobs: extractAttributeScore('lobs'),
      crossovers: extractAttributeScore('crossovers'),
      spinmoves: extractAttributeScore('spin moves'),
      stepbacks: extractAttributeScore('step backs'),
      offReb: extractAttributeScore('offensive rebounding'),
      runPlay: extractAttributeScore('run play'),
      defReb: extractAttributeScore('defensive rebounding'),
      onballsteals: extractAttributeScore('on-ball steals'),
      offballsteals: extractAttributeScore('off-ball steals'),
      blocks: extractAttributeScore('blocks'),
      takeCharge: extractAttributeScore('take charge'),
      defense: extractAttributeScore('defense'),
    },

    analysis: result.answer || null,
    interest: [], // Placeholder for future logic
  };
}
