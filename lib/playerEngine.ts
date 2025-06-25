import axios from 'axios';
import * as cheerio from 'cheerio';

// --- Set up axios instance with timeout ---
const axiosInstance = axios.create({
  timeout: 8000, // 8 seconds timeout per request
});

// Simplified tendencies keywords for NLP extraction:
const tendenciesKeywords = {
  postups: ['post up', 'post-up', 'postups', 'backs down'],
  floaters: ['floater', 'floats', 'floaters'],
  threePointers: ['three point', '3pt', 'three-pointer', 'shoots threes'],
  spinmoves: ['spin move', 'spin moves', 'spinmove'],
  pumpfakes: ['pump fake', 'pump-fake', 'pump fakes'],
  stepbacks: ['stepback', 'step-back', 'stepbacks'],
  defense: ['defense', 'defensive', 'steal', 'block', 'blocks', 'disrupt'],
};

// Basic helper for tendency extraction
function extractTendencies(text: string): Record<string, number> {
  const tendencies: Record<string, number> = {};
  const lowerText = text.toLowerCase();

  for (const [tendency, keywords] of Object.entries(tendenciesKeywords)) {
    tendencies[tendency] = keywords.reduce((score, kw) =>
      score + (lowerText.includes(kw) ? 1 : 0), 0);
  }

  return tendencies;
}

// Scrape Sports Reference college stats for player
export async function scrapeSportsRefStats(name: string) {
  const baseSlug = name.trim().toLowerCase().replace(/\s+/g, '-');
  const variants = [`${baseSlug}.html`, `${baseSlug}-1.html`, `${baseSlug}-2.html`];

  for (const v of variants) {
    const url = `https://www.sports-reference.com/cbb/players/${v}`;
    try {
      const res = await axiosInstance.get(url);
      if (res.status === 200) {
        // SportsRef embeds stats table in comments, parse safely:
        const $ = cheerio.load(res.data);
        const comments = $('body').contents()
          .filter((_, el) => el.type === 'comment')
          .map((_, el) => el.data)
          .get().join('');
        const $$ = cheerio.load(comments);
        const row = $$('table#players_per_game tbody tr.full_table').last();
        if (!row.length) continue; // try next variant

        const parseFloatSafe = (selector: string) =>
          parseFloat(row.find(`td[data-stat="${selector}"]`).text()) || 0;

        const g = parseFloatSafe('g') || 1;
        const fg = parseFloatSafe('fg');
        const fga = parseFloatSafe('fga') || 1;
        const fg3 = parseFloatSafe('fg3');
        const fg3a = parseFloatSafe('fg3a') || 1;
        const ft = parseFloatSafe('ft');
        const fta = parseFloatSafe('fta') || 1;
        const orb = parseFloatSafe('orb');
        const drb = parseFloatSafe('drb');
        const ast = parseFloatSafe('ast');
        const stl = parseFloatSafe('stl');
        const blk = parseFloatSafe('blk');
        const mp = parseFloatSafe('mp') || 20;

        return { g, fg, fga, fg3, fg3a, ft, fta, orb, drb, ast, stl, blk, mp };
      }
    } catch (e) {
      // Log error but keep trying other variants
      console.warn(`SportsRef fetch error for ${url}:`, e.message || e);
      continue;
    }
  }

  return null;
}

// Scrape 247Sports recruiting profile snippet
export async function scrape247Sports(name: string) {
  const searchUrl = `https://247sports.com/Search/?q=${encodeURIComponent(name)}`;
  try {
    const searchRes = await axiosInstance.get(searchUrl);
    const $search = cheerio.load(searchRes.data);

    // Find first recruiting profile link in search results:
    const firstProfileLink = $search('a[data-sport="basketball"]').attr('href');
    if (!firstProfileLink) return null;

    // Fetch recruiting profile
    const profileUrl = `https://247sports.com${firstProfileLink}`;
    const profileRes = await axiosInstance.get(profileUrl);
    const $profile = cheerio.load(profileRes.data);

    // Extract star rating (e.g., 4-star, 5-star)
    const starText = $profile('.rating').first().text() || '';
    const starMatch = starText.match(/(\d)-star/);
    const stars = starMatch ? parseInt(starMatch[1], 10) : 0;

    // Extract summary text for tendencies
    const summary = $profile('.player-summary').text() || '';

    return { stars, summary };
  } catch (e) {
    console.warn(`247Sports fetch error for ${name}:`, e.message || e);
    return null;
  }
}

// Scrape ESPN player news snippets (basic)
export async function scrapePlayerNews(name: string) {
  const query = encodeURIComponent(name);
  const searchUrl = `https://www.espn.com/search/results?q=${query}&type=article`;
  try {
    const res = await axiosInstance.get(searchUrl);
    const $ = cheerio.load(res.data);

    const articles: string[] = [];
    $('section.search-results article').each((_, el) => {
      const title = $(el).find('h1, h2, h3').text();
      const snippet = $(el).find('p').text();
      if (title && snippet) {
        articles.push(`${title} ${snippet}`);
      }
    });

    return articles.join(' ');
  } catch (e) {
    console.warn(`ESPN news fetch error for ${name}:`, e.message || e);
    return '';
  }
}

// Aggregate all sources into a player scouting profile
export async function scoutPlayer(name: string) {
  try {
    // 1. Get stats
    const stats = await scrapeSportsRefStats(name);

    // 2. Get recruiting data
    const recruit = await scrape247Sports(name);

    // 3. Get news text
    const newsText = await scrapePlayerNews(name);

    // 4. Extract tendencies keywords from recruiting summary + news
    const tendenciesFromRecruit = recruit?.summary ? extractTendencies(recruit.summary) : {};
    const tendenciesFromNews = extractTendencies(newsText);

    // Combine tendencies by summing
    const combinedTendencies: Record<string, number> = {};
    for (const key of Object.keys(tendenciesKeywords)) {
      combinedTendencies[key] = (tendenciesFromRecruit[key] || 0) + (tendenciesFromNews[key] || 0);
    }

    // Normalize tendencies to max 5 scale
    for (const key of Object.keys(combinedTendencies)) {
      combinedTendencies[key] = Math.min(5, combinedTendencies[key]);
    }

    // Default fallback attributes if no stats found:
    const defaultAttributes = {
      layup: 5, dunking: 5, inside: 5, midrange: 5, three: 5, freeThrow: 5,
      dribbling: 5, passing: 5, offReb: 5, defReb: 5, stealing: 5, blocking: 5,
    };

    if (!stats && !recruit) {
      return {
        name,
        attributes: defaultAttributes,
        tendencies: combinedTendencies,
        analysis: 'No data available from known sources.',
        starRating: 0,
      };
    }

    // Helper scale function
    const scale = (val: number) => Math.min(10, Math.max(1, Math.round(val)));

    // Calculate attributes from stats (simplified, scaled by games played)
    const total = (val: number) => Math.round(val * (stats?.g || 1));

    const attributes = {
      layup: scale((stats?.fg ?? 0) / (stats?.fga ?? 1) * 10),
      dunking: scale((stats?.fg ?? 0) / 2),
      inside: scale((stats?.fg ?? 0) - (stats?.fg3 ?? 0)),
      midrange: scale(((stats?.fg ?? 0) - (stats?.fg3 ?? 0)) / ((stats?.fga ?? 1) - (stats?.fg3a ?? 0)) * 10),
      three: stats?.fg3a && stats.fg3a >= 2
        ? (stats.fg3 / stats.fg3a >= 0.4 ? 10 : stats.fg3 / stats.fg3a >= 0.35 ? 7 : 5)
        : 4,
      freeThrow: scale((stats?.ft ?? 0) / (stats?.fta ?? 1) * 10),
      dribbling: scale(6 + Math.log10(stats?.g ?? 1)),
      passing: scale((stats?.ast ?? 0) * 2),
      offReb: scale(total(stats?.orb ?? 0) / 10),
      defReb: scale(total(stats?.drb ?? 0) / 10),
      stealing: scale(total(stats?.stl ?? 0) / 10),
      blocking: scale(total(stats?.blk ?? 0) / 10),
    };

    // You can add physical info if you scrape it or leave empty
    const physical = {};

    // Final profile object
    return {
      name,
      starRating: recruit?.stars || 0,
      attributes,
      physical,
      tendencies: combinedTendencies,
      analysis: recruit?.summary || 'Aggregated data scouting report.',
    };
  } catch (e: any) {
    console.error(`[scoutPlayer] Failed for ${name}:`, e.stack || e.message || e);
    return {
      name,
      attributes: {
        layup: 5, dunking: 5, inside: 5, midrange: 5, three: 5, freeThrow: 5,
        dribbling: 5, passing: 5, offReb: 5, defReb: 5, stealing: 5, blocking: 5,
      },
      tendencies: {},
      analysis: 'Error retrieving player data.',
      starRating: 0,
    };
  }
}
