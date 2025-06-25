import axios from 'axios';
import * as cheerio from 'cheerio';

const axiosInstance = axios.create({
  timeout: 7000, // 7 seconds timeout for each request
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; HoopLandBot/1.0; +https://yourdomain.com/bot)'
  }
});

// Tendency keywords for NLP extraction from text
const tendenciesKeywords = {
  postups: ['post up', 'post-up', 'backs down', 'backdown', 'backs player down'],
  floaters: ['floater', 'floats', 'floaters', 'shoots floater'],
  threePointers: ['three point', '3pt', 'three-pointer', 'shoots threes', 'deep ball'],
  spinmoves: ['spin move', 'spin moves', 'spinmove', 'spins past'],
  pumpfakes: ['pump fake', 'pump-fake', 'pump fakes', 'fake shot'],
  stepbacks: ['stepback', 'step-back', 'stepbacks', 'step back'],
  defense: ['defense', 'defensive', 'steal', 'steals', 'block', 'blocks', 'disrupt', 'rim protector', 'lockdown'],
};

// Simple tendency extractor
function extractTendencies(text: string): Record<string, number> {
  const tendencies: Record<string, number> = {};
  const lowerText = text.toLowerCase();

  for (const [key, keywords] of Object.entries(tendenciesKeywords)) {
    let count = 0;
    for (const kw of keywords) {
      if (lowerText.includes(kw)) count++;
    }
    tendencies[key] = Math.min(5, count); // max 5 scale per tendency
  }

  return tendencies;
}

// Scrape Sports Reference College stats (with comments parsing)
export async function scrapeSportsRefStats(name: string) {
  const slugBase = name.trim().toLowerCase().replace(/\s+/g, '-');
  const variants = [`${slugBase}.html`, `${slugBase}-1.html`, `${slugBase}-2.html`];

  for (const variant of variants) {
    const url = `https://www.sports-reference.com/cbb/players/${variant}`;
    try {
      const res = await axiosInstance.get(url);
      if (res.status !== 200) continue;

      // Parse comment containing stats table
      const $ = cheerio.load(res.data);
      const comments = $('body').contents()
        .filter((_, el) => el.type === 'comment')
        .map((_, el) => el.data)
        .get().join('');

      const $$ = cheerio.load(comments);
      const row = $$('table#players_per_game tbody tr.full_table').last();
      if (!row.length) continue;

      // Extract stats safely
      const getNum = (selector: string) => parseFloat(row.find(`td[data-stat="${selector}"]`).text()) || 0;

      const g = getNum('g') || 1;
      const fg = getNum('fg');
      const fga = getNum('fga') || 1;
      const fg3 = getNum('fg3');
      const fg3a = getNum('fg3a') || 1;
      const ft = getNum('ft');
      const fta = getNum('fta') || 1;
      const orb = getNum('orb');
      const drb = getNum('drb');
      const ast = getNum('ast');
      const stl = getNum('stl');
      const blk = getNum('blk');
      const mp = getNum('mp') || 20;

      return { g, fg, fga, fg3, fg3a, ft, fta, orb, drb, ast, stl, blk, mp };
    } catch (e) {
      console.warn(`[SportsRef] Failed to fetch ${url}:`, e.message || e);
      continue;
    }
  }

  return null;
}

// Scrape 247Sports recruiting profile and summary
export async function scrape247Sports(name: string) {
  const searchUrl = `https://247sports.com/Search/?q=${encodeURIComponent(name)}`;
  try {
    const searchRes = await axiosInstance.get(searchUrl);
    const $search = cheerio.load(searchRes.data);

    // Find first basketball player profile link
    const firstLink = $search('a[data-sport="basketball"]').attr('href');
    if (!firstLink) return null;

    const profileUrl = `https://247sports.com${firstLink}`;
    const profileRes = await axiosInstance.get(profileUrl);
    const $profile = cheerio.load(profileRes.data);

    const starText = $profile('.rating').first().text() || '';
    const starMatch = starText.match(/(\d)-star/);
    const stars = starMatch ? parseInt(starMatch[1], 10) : 0;

    const summary = $profile('.player-summary').text().trim() || '';

    return { stars, summary };
  } catch (e) {
    console.warn(`[247Sports] Failed for ${name}:`, e.message || e);
    return null;
  }
}

// Scrape ESPN news snippets
export async function scrapeESPNNews(name: string) {
  const searchUrl = `https://www.espn.com/search/results?q=${encodeURIComponent(name)}&type=article`;
  try {
    const res = await axiosInstance.get(searchUrl);
    const $ = cheerio.load(res.data);

    let textContent = '';
    $('section.search-results article').each((_, el) => {
      const title = $(el).find('h1, h2, h3').text();
      const snippet = $(el).find('p').text();
      if (title && snippet) {
        textContent += `${title} ${snippet} `;
      }
    });

    return textContent.trim();
  } catch (e) {
    console.warn(`[ESPN] Failed to fetch news for ${name}:`, e.message || e);
    return '';
  }
}

// Scrape Rivals summary and star rating
export async function scrapeRivals(name: string) {
  // Format search URL, e.g. https://n.rivals.com/search?query=player+name
  const searchUrl = `https://n.rivals.com/search?query=${encodeURIComponent(name)}`;
  try {
    const searchRes = await axiosInstance.get(searchUrl);
    const $search = cheerio.load(searchRes.data);

    // Find player card link - adapt selector as Rivals structure might change
    const firstPlayerLink = $search('a.player-card__link').attr('href');
    if (!firstPlayerLink) return null;

    const profileUrl = `https://n.rivals.com${firstPlayerLink}`;
    const profileRes = await axiosInstance.get(profileUrl);
    const $profile = cheerio.load(profileRes.data);

    // Star rating might be inside .rating-stars or similar class
    const starText = $profile('.rating-stars').attr('data-stars') || '0';
    const stars = parseInt(starText, 10) || 0;

    // Summary text
    const summary = $profile('.profile-bio__text').text().trim() || '';

    return { stars, summary };
  } catch (e) {
    console.warn(`[Rivals] Failed for ${name}:`, e.message || e);
    return null;
  }
}

// Scrape Twitter recent tweets for public profile (best effort, no API)
export async function scrapeTwitter(name: string) {
  // Twitter profile URL guess from name (you may want to map real handles)
  const profileHandle = name.trim().toLowerCase().replace(/\s+/g, '');
  const url = `https://twitter.com/${profileHandle}`;

  try {
    const res = await axiosInstance.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);

    // Twitter heavily uses JS, so static scraping is limited
    // Try to get meta description or visible tweet text in <meta> tags or fallback
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    return metaDesc;
  } catch (e) {
    console.warn(`[Twitter] Failed for ${name}:`, e.message || e);
    return '';
  }
}

// Main scout function aggregates all
export async function scoutPlayer(name: string) {
  try {
    // Parallel scrape all sources
    const [stats, recruit247, news, rivals, twitterText] = await Promise.all([
      scrapeSportsRefStats(name),
      scrape247Sports(name),
      scrapeESPNNews(name),
      scrapeRivals(name),
      scrapeTwitter(name),
    ]);

    // Combine text for tendency extraction
    const combinedText = [
      recruit247?.summary || '',
      news || '',
      rivals?.summary || '',
      twitterText || '',
    ].join(' ');

    const tendencies = extractTendencies(combinedText);

    // Default attributes if no stats found
    const defaultAttrs = {
      layup: 5, dunking: 5, inside: 5, midrange: 5, three: 5, freeThrow: 5,
      dribbling: 5, passing: 5, offReb: 5, defReb: 5, stealing: 5, blocking: 5,
    };

    if (!stats && !recruit247 && !rivals) {
      return {
        name,
        starRating: 0,
        attributes: defaultAttrs,
        tendencies,
        analysis: 'No scouting data available from known sources.',
      };
    }

    // Calculate attribute scaling (simplified example)
    const scale = (val: number) => Math.min(10, Math.max(1, Math.round(val)));

    // Use stats to estimate some attributes (example logic)
    const attributes = {
      layup: stats ? scale((stats.fg / stats.fga) * 10) : defaultAttrs.layup,
      dunking: stats ? scale((stats.blk / (stats.g || 1)) * 10) : defaultAttrs.dunking,
      inside: stats ? scale(((stats.orb + stats.drb) / (stats.g || 1)) / 2) : defaultAttrs.inside,
      midrange: defaultAttrs.midrange,
      three: stats && stats.fg3a > 5 && (stats.fg3 / stats.fg3a) > 0.35 ? 7 : 4,
      freeThrow: stats && stats.fta > 5 ? scale((stats.ft / stats.fta) * 10) : defaultAttrs.freeThrow,
      dribbling: defaultAttrs.dribbling,
      passing: stats ? scale((stats.ast / (stats.g || 1))) : defaultAttrs.passing,
      offReb: stats ? scale(stats.orb / (stats.g || 1)) : defaultAttrs.offReb,
      defReb: stats ? scale(stats.drb / (stats.g || 1)) : defaultAttrs.defReb,
      stealing: stats ? scale(stats.stl / (stats.g || 1)) : defaultAttrs.stealing,
      blocking: stats ? scale(stats.blk / (stats.g || 1)) : defaultAttrs.blocking,
    };

    return {
      name,
      starRating: recruit247?.stars || rivals?.stars || 0,
      attributes,
      tendencies,
      analysis: recruit247?.summary || rivals?.summary || news || 'Scouting info unavailable.',
      physical: {}, // You can extend with height, weight scraping if available
      jersey: 'N/A',
      team: 'Uncommitted',
      year: 'N/A',
      interest: [],
    };
  } catch (err) {
    console.error(`[scoutPlayer] Error:`, err.stack || err.message || err);
    throw err;
  }
}
