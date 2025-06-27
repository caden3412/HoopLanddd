import { scrapeTwitter } from './twitter';
import { scrapeOn3 } from './on3';
import { scrape247Sports } from './247sports';
import { scrapeEurobasket } from './eurobasket';
import { scrapeInstagram } from './instagram';
import { scrapeYouTube } from './youtube';

export async function getBioFromSources(playerName: string): Promise<string> {
  const sources = [
    scrapeTwitter,
    scrapeOn3,
    scrape247Sports,
    scrapeEurobasket,
    scrapeInstagram,
    scrapeYouTube,
  ];

  const results = await Promise.all(sources.map(fn => fn(playerName).catch(() => '')));

  // Combine and return all text
  return results.filter(Boolean).join(' ');
}
