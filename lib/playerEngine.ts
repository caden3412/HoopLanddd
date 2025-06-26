import { scrapePlayerData } from './scraper';

export async function scoutPlayer(name: string) {
  const player = await scrapePlayerData(name);
  return player;
}
