// lib/playerEngine.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

const axiosInstance = axios.create({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; HoopLandBot/1.0)',
  },
});

// 🏀 Keywords for tendencies
const tendenciesKeywords: Record<string, string[]> = {
  postups: ['post up', 'backs down'],
  floaters: ['floater'],
  threePointers: ['3pt', 'three‑point', 'shoots threes'],
  spinmoves: ['spin move'],
  pumpfakes: ['pump fake'],
  stepbacks: ['stepback'],
  defense: ['steal', 'block', 'defensive'],
};

function extractTendencies(text: string) {
  const t: Record<string, number> = {};
  const lower = text.toLowerCase();
  for (const [k, arr] of Object.entries(tendenciesKeywords)) {
    t[k] = arr.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0);
    t[k] = Math.min(5, t[k]);
  }
  return t;
}

async function scrapeSportsRef(name: string) {
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
  const variants = [`${slug}.html`, `${slug}-1.html`, `${slug}-2.html`];
  for (const v of variants) {
    const url = `https://www.sports-reference.com/cbb/players/${v}`;
    try {
      const res = await axiosInstance.get(url);
      const $ = cheerio.load(res.data);
      const comments = $('body').contents().filter((_, el) => el.type === 'comment')
        .map((_, el) => el.data).get().join('');
      const $$ = cheerio.load(comments);
      const row = $$('table#players_per_game tbody tr.full_table').last();
      if (!row.length) continue;
      const get = (s: string) => parseFloat(row.find(`td[data-stat="${s}"]`).text()) || 0;
      return {
        g: get('g'),
        fg: get('fg'),
        fga: get('fga'),
        fg3: get('fg3'),
        fg3a: get('fg3a'),
        ft: get('ft'),
        fta: get('fta'),
        orb: get('orb'),
        drb: get('drb'),
        ast: get('ast'),
        stl: get('stl'),
        blk: get('blk'),
        mp: get('mp'),
      };
    } catch (e: any) {
      console.warn('[SportsRef]', url, e.message);
    }
  }
  console.warn('[SportsRef] no data for', name);
  return null;
}

async function scrape247(name: string) {
  const url = `https://247sports.com/Search/?q=${encodeURIComponent(name)}`;
  try {
    const res = await axiosInstance.get(url);
    const $ = cheerio.load(res.data);
    const link = $('a[data-sport="basketball"]').attr('href');
    if (!link) throw new Error('no link');
    const profile = await axiosInstance.get(`https://247sports.com${link}`);
    const $$ = cheerio.load(profile.data);
    const stars = parseInt($$('.rating').first().text()[0]) || 0;
    const summary = $$('.player-summary').text().trim() || '';
    return { stars, summary };
  } catch (e: any) {
    console.warn('[247Sports]', e.message);
    return null;
  }
}

async function scrapeESPN(name: string) {
  try {
    const res = await axiosInstance.get(`https://www.espn.com/search/results?q=${encodeURIComponent(name)}&type=article`);
    const $ = cheerio.load(res.data);
    let txt = '';
    $('section.search-results article').each((_, el) => {
      txt += $(el).find('h1,h2,h3').text() + ' ' + $(el).find('p').text() + ' ';
    });
    return txt.trim();
  } catch (e: any) {
    console.warn('[ESPN]', e.message);
    return '';
  }
}

async function scrapeRivals(name: string) {
  try {
    const res = await axiosInstance.get(`https://n.rivals.com/search?query=${encodeURIComponent(name)}`);
    const $ = cheerio.load(res.data);
    const link = $('a.player-card__link').attr('href');
    if (!link) throw new Error('no link');
    const prof = await axiosInstance.get(`https://n.rivals.com${link}`);
    const $$ = cheerio.load(prof.data);
    const stars = parseInt($$('.rating-stars').attr('data-stars') || '') || 0;
    const summary = $$('.profile-bio__text').text().trim() || '';
    return { stars, summary };
  } catch (e: any) {
    console.warn('[Rivals]', e.message);
    return null;
  }
}

async function scrapeTwitter(name: string) {
  try {
    const user = name.trim().toLowerCase().replace(/\s+/g, '');
    const res = await axiosInstance.get(`https://twitter.com/${user}`);
    const $ = cheerio.load(res.data);
    return $('meta[name="description"]').attr('content') || '';
  } catch {
    return '';
  }
}

export async function scoutPlayer(name: string) {
  const [stats, rec24, news, rivals, twitter] = await Promise.all([
    scrapeSportsRef(name),
    scrape247(name),
    scrapeESPN(name),
    scrapeRivals(name),
    scrapeTwitter(name),
  ]);

  const text = `${rec24?.summary || ''} ${news} ${rivals?.summary || ''} ${twitter}`;

  if (!stats && !rec24 && !rivals) {
    throw new Error(`🚨 No data sources returned for "${name}"`);
  }

  const tendency = extractTendencies(text);

  const scale = (x: number) => Math.min(10, Math.max(1, Math.round(x)));

  const attributes = stats
    ? {
        layup: scale((stats.fg / stats.fga) * 10),
        dunking: scale((stats.blk / (stats.g || 1)) * 10),
        inside: scale((stats.orb + stats.drb) / (stats.g || 1)),
        midrange: 5,
        three: stats.fg3a > 3 && stats.fg3 / stats.fg3a > 0.35 ? 8 : 4,
        freeThrow: scale((stats.ft / stats.fta) * 10),
        dribbling: 5,
        passing: scale(stats.ast / (stats.g || 1) * 2),
        offReb: scale(stats.orb / (stats.g || 1)),
        defReb: scale(stats.drb / (stats.g || 1)),
        stealing: scale(stats.stl / (stats.g || 1) * 10),
        blocking: scale(stats.blk / (stats.g || 1) * 10),
      }
    : {
        layup: 5, dunking: 5, inside: 5, midrange: 5,
        three: 5, freeThrow: 5, dribbling: 5,
        passing: 5, offReb: 5, defReb: 5,
        stealing: 5, blocking: 5,
      };

  return {
    name,
    starRating: rec24?.stars || rivals?.stars || 0,
    attributes,
    tendencies: tendency,
    analysis: rec24?.summary || rivals?.summary || news || 'Aggregated scouting incomplete.',
    physical: {},
    team: 'NA',
    year: 'NA',
    jersey: 'NA',
    interest: [],
  };
}
