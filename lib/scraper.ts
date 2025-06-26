// FILE: lib/scrapers.ts

import axios from 'axios';
import * as cheerio from 'cheerio';

const sources = [
  async (name: string) => {
    try {
      const res = await axios.get(`https://www.espn.com/search/results?q=${encodeURIComponent(name)}`);
      const $ = cheerio.load(res.data);
      const snippet = $('section article p').first().text();
      return snippet || '';
    } catch {
      return '';
    }
  },
  async (name: string) => {
    try {
      const res = await axios.get(`https://247sports.com/SearchResults/?SearchQuery=${encodeURIComponent(name)}`);
      const $ = cheerio.load(res.data);
      return $('meta[name="description"]').attr('content') || '';
    } catch {
      return '';
    }
  },
  async (name: string) => {
    try {
      const res = await axios.get(`https://www.on3.com/search/?s=${encodeURIComponent(name)}`);
      const $ = cheerio.load(res.data);
      return $('meta[property="og:description"]').attr('content') || '';
    } catch {
      return '';
    }
  },
  async (name: string) => {
    try {
      const res = await axios.get(`https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`);
      const $ = cheerio.load(res.data);
      return $('#mw-content-text p').first().text();
    } catch {
      return '';
    }
  }
];

export async function scrapeAllSources(name: string): Promise<string> {
  const chunks = await Promise.all(sources.map(fn => fn(name)));
  return chunks.filter(Boolean).join('\n\n');
}
