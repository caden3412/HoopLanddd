// lib/sources.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

const headers = {
  'User-Agent': 'Mozilla/5.0 (compatible; HoopLandBot/1.0)',
};

async function fetchHTML(url: string): Promise<string> {
  const { data } = await axios.get(url, { headers });
  return data;
}

export async function getSourcesForPlayer(name: string): Promise<string[]> {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const query = encodeURIComponent(name);

  return [
    `https://www.espn.com/search/results?q=${query}`,
    `https://www.on3.com/search/?s=${query}`,
    `https://n.rivals.com/content/athletes/${slug}`, // guessing structure
    `https://en.wikipedia.org/wiki/${slug.replace(/-/g, '_')}`,
    `https://nitter.net/search?f=tweets&q=${query}%20basketball`,
  ];
}

export async function scrapePlayerBio(name: string): Promise<string> {
  const sources = await getSourcesForPlayer(name);
  const combinedText: string[] = [];

  for (const url of sources) {
    try {
      const html = await fetchHTML(url);
      const $ = cheerio.load(html);
      const text = $('body').text();
      if (text.length > 500) combinedText.push(text.trim());
    } catch (e) {
      console.warn(`Failed to fetch from ${url}`);
    }
  }

  return combinedText.join('\n\n').slice(0, 4000); // limit to 4k chars for NLP
}
