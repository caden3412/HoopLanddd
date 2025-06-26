// lib/scraper.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

const SOURCES = [
  (name: string) => `https://www.on3.com/db/search/${encodeURIComponent(name)}/`,
  (name: string) => `https://www.espn.com/search/results?q=${encodeURIComponent(name)}`,
  (name: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`,
  (name: string) => `https://247sports.com/SearchResults/?Query=${encodeURIComponent(name)}`,
  (name: string) => `https://twitter.com/search?q=${encodeURIComponent(name)}&src=typed_query`,
];

export async function scrapePlayerBio(name: string): Promise<string> {
  let combinedText = '';

  for (const getUrl of SOURCES) {
    try {
      const url = getUrl(name);
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      const $ = cheerio.load(res.data);
      const pageText = $('body').text().replace(/\s+/g, ' ').trim();
      combinedText += `\n---\n[${url}]\n` + pageText;
    } catch (err) {
      console.warn(`❌ Failed to scrape ${getUrl(name)}`);
    }
  }

  if (!combinedText) throw new Error('No live scraping results');
  return combinedText;
}
