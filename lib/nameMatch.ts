import Fuse from 'fuse.js';

const playersList = [
  // Populate with known player names from scraped sources or static list
  'Bronny James',
  'Ziaire Williams',
  'Victor Wembanyama',
  // add more as you expand...
];

const fuse = new Fuse(playersList, {
  includeScore: true,
  threshold: 0.3,
});

export async function getCloseMatch(name: string): Promise<string> {
  const result = fuse.search(name);
  if (result.length > 0) return result[0].item;
  return name; // fallback to original if no close match
}
