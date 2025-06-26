// FILE: lib/scrapers.ts

import axios from 'axios';
import * as cheerio from 'cheerio';

const sources = [
  (name: string) => `https://www.espn.com/search/results?q=${encodeURIComponent(name)}`,
  (name: string) => `https://247sports.com/SearchResults/?q=${encodeURIComponent(name)}`,
  (name: string) => `https://www.on3.com/search/?s=${encodeURIComponent(name)}`,
  (name: string) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`,
  (name: string) => `https://n.rivals.com/search#q=${encodeURIComponent(name)}`,
  (name: string) => `https://x.com/search?q=${encodeURIComponent(name)}&src=typed_query`
];

export async function scrapeAllSources(name: string): Promise<string> {
  let fullText = '';

  for (const getUrl of sources) {
    const url = getUrl(name);

    try {
      const res = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        }
      });

      const $ = cheerio.load(res.data);

      // Grab visible paragraph-like text
      $('p, span, li').each((_, el) => {
        const txt = $(el).text().trim();
        if (txt.length > 40 && !txt.startsWith('ADVERTISEMENT')) {
          fullText += txt + '\n';
        }
      });
    } catch (err) {
      console.warn(`❌ Failed to scrape ${url}`);
      continue;
    }
  }

  return fullText.trim();
}
