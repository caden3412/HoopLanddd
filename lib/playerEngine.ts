// lib/playerEngine.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

const axiosInstance = axios.create({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0 HoopLandBot' },
});

function extractTendencies(text: string) {
  const keywords: Record<string, string[]> = {
    postups: ['post up', 'backs down'],
    floaters: ['floater'],
    threePointers: ['3pt', 'three‑point'],
    spinmoves: ['spin move'],
    pumpfakes: ['pump fake'],
    stepbacks: ['stepback'],
    defense: ['steal', 'block', 'defensive'],
  };
  const t: Record<string, number> = {};
  const lower = text.toLowerCase();
  for (const [k, arr] of Object.entries(keywords)) {
    t[k] = Math.min(5, arr.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0));
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
      const html = res.data;
      const $ = cheerio.load(html);
      const comments = $('body').contents().filter((_, el) => el.type === 'comment')
        .map((_, el) => el.data).get().join('');
      if (!comments) continue;
      const $$ = cheerio.load(comments);
      const row = $$('table#players_per_game > tbody > tr.full_table').last();
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
      console.warn('[SportsRef]', v, e.message);
    }
  }
  console.warn('[SportsRef] no data for', name);
  return null;
}

async function scrape247(name: string) {
  try {
    const res = await axiosInstance.get(`https://247sports.com/Search/?query=${encodeURIComponent(name)}`);
    const $ = cheerio.load(res.data);
    const link = $('a.card a').first().attr('href') ?? $('a.player-name').attr('href');
    if (!link) throw new Error('no link');
    const prof = await axiosInstance.get(`https://247sports.com${link}`);
    const $$ = cheerio.load(prof.data);
    const stars = parseInt($$('.star-ratings').attr('data-stars') || '') || 0;
    const summary = $$('.player-summary__blurb').text().trim();
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
      const title = $(el).find('h2').text();
      const snippet = $(el).find('p').text();
      if (title || snippet) txt += `${title} ${snippet} `;
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
    const link = $('a[data-track="player-profile"]').attr('href');
    if (!link) throw new Error('no link');
    const prof = await axiosInstance.get(`https://n.rivals.com${link}`);
    const $$ = cheerio.load(prof.data);
    const stars = parseInt($$('.stars___').first().text()) || 0;
    const summary = $$('.profile__bio').text().trim();
    return { stars, summary };
  } catch (e: any) {
    console.warn('[Rivals]', e.message);
    return null;
  }
}

async function scrapeTwitter(name: string) {
  const handle = name.trim().toLowerCase().replace(/\s+/g, '');
  try {
    const res = await axiosInstance.get(`https://twitter.com/${handle}`);
    const $ = cheerio.load(res.data);
    return $('meta[name="description"]').attr('content') || '';
  } catch {
    return '';
  }
}

export async function scoutPlayer(name: string) {
  const [stats, r24, news, rivals, twitter] = await Promise.all([
    scrapeSportsRef(name),
    scrape247(name),
    scrapeESPN(name),
    scrapeRivals(name),
    scrapeTwitter(name),
  ]);

  const combinedText = `${r24?.summary || ''} ${news} ${rivals?.summary || ''} ${twitter}`;

  if (!stats && !r24 && !rivals) {
    throw new Error(`No live scraping results for "${name}"`);
  }

  const tendencies = extractTendencies(combinedText);
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
    : Array.from({ length: 12 }).reduce((acc, _, i) => {
        const keys = ['layup','dunking','inside','midrange','three','freeThrow','dribbling','passing','offReb','defReb','stealing','blocking'];
        acc[keys[i]] = 5;
        return acc;
      }, {} as Record<string, number>);

  return {
    name,
    starRating: r24?.stars || rivals?.stars || 0,
    attributes,
    tendencies,
    analysis: r24?.summary || rivals?.summary || news || 'No analysis found.',
    physical: {},
    team: 'N/A',
    year: 'N/A',
    jersey: 'N/A',
    interest: [],
  };
}
