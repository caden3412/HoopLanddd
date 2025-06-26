// lib/scraper.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

const sources = [
  (name: string) => `https://www.espn.com/search/results?q=${encodeURIComponent(name)}`,
  (name: string) => `https://247sports.com/search/?q=${encodeURIComponent(name)}`,
  (name: string) => `https://www.on3.com/search/?s=${encodeURIComponent(name)}`,
  (name: string) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`,
  (name: string) => `https://twitter.com/search?q=${encodeURIComponent(name)}&src=typed_query&f=live`
];

export async function scrapePlayerBio(name: string): Promise<string> {
  const snippets: string[] = [];

  for (const getUrl of sources) {
    const url = getUrl(name);
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const text = $('body').text();
      if (text.length > 100) snippets.push(text.slice(0, 3000));
    } catch (err) {
      console.warn(`Failed to fetch from ${url}`);
    }
  }

  if (snippets.length === 0) throw new Error('No live scraping results');

  return snippets.join('\n---\n');
}
