import { NlpManager } from 'node-nlp';

export async function extractNLPProfile(text: string) {
  const manager = new NlpManager({ languages: ['en'], nlu: { useNoneFeature: false } });
  
  // This is where you'd train the model more, but for now we pattern match with RegEx
  const heightMatch = text.match(/(?:height|ht)[^\d]{0,5}(\d{1,2}'\s?\d{1,2}")/i);
  const weightMatch = text.match(/(?:weight|wt)[^\d]{0,5}(\d{2,3})\s?lbs?/i);
  const jerseyMatch = text.match(/(?:jersey|number|#)\s*(\d{1,2})/i);
  const yearMatch = text.match(/(freshman|sophomore|junior|senior)/i);
  const teamMatch = text.match(/(?:for|at|plays for)\s([A-Z][a-zA-Z\s]+(?:University|College|State|Tech)?)/);

  const tendencies = {
    postups: (text.match(/post[-\s]?up/gi) || []).length,
    floaters: (text.match(/floater/gi) || []).length,
    threePointers: (text.match(/three[-\s]?pointer|3pt|3-pointer/gi) || []).length,
    spinmoves: (text.match(/spin move/gi) || []).length,
    pumpfakes: (text.match(/pump fake/gi) || []).length,
    stepbacks: (text.match(/step[-\s]?back/gi) || []).length,
    defense: (text.match(/defense|defensive|lockdown/gi) || []).length,
  };

  // Placeholder logic for attributes until enhanced
  const attributes = {
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
  };

  const physical = {
    speed: 5,
    strength: 5,
    stamina: 5
  };

  return {
    height: heightMatch?.[1],
    weight: weightMatch?.[1],
    jersey: jerseyMatch?.[1],
    year: yearMatch?.[1],
    team: teamMatch?.[1],
    attributes,
    physical,
    tendencies,
    analysis: text
  };
}
