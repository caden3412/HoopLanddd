import axios from 'axios';
import * as cheerio from 'cheerio';

// Tendencies keyword map covering all requested categories:
const tendenciesKeywords: Record<string, string[]> = {
  dunks: ['dunk', 'slam'],
  floaters: ['floater', 'teardrop'],
  postups: ['post up', 'backs down', 'low post'],
  hookshots: ['hook shot', 'skyhook'],
  twopointers: ['two-point', 'midrange', 'inside the arc'],
  threepointers: ['three-point', '3pt', 'beyond the arc'],
  pumpfakes: ['pump fake', 'head fake'],
  fades: ['fadeaway', 'fade'],
  passes: ['pass', 'feeder', 'assist'],
  lobs: ['lob', 'alley-oop'],
  crossovers: ['crossover', 'crosses over'],
  spinmoves: ['spin move', 'spins around'],
  stepbacks: ['step-back', 'stepback'],
  offensiverebounds: ['offensive rebound', 'putback'],
  defensiverebounds: ['defensive rebound', 'clears the board'],
  runplay: ['calls play', 'run the offense'],
  onballsteals: ['on-ball steal', 'strips'],
  offballsteals: ['intercepts', 'steals off ball'],
  blocks: ['block', 'swats', 'rejects'],
  takecharge: ['takes the charge', 'draws contact'],
};

// Extract tendencies based on keyword frequency:
function extractTendencies(text = ''): Record<string, number> {
  const out: Record<string, number> = {};
  const txt = text.toLowerCase();
  Object.entries(tendenciesKeywords).forEach(([k, kws]) => {
    const cnt = kws.reduce((acc, kw) => acc + (txt.includes(kw) ? 1 : 0), 0);
    out[k] = Math.min(5, cnt); // cap at 5
  });
  return out;
}

// Multi-source web search via SerpAPI (need your API key in env)
async function searchWeb(name: string): Promise<string> {
  const resp = await axios.get('https://serpapi.com/search.json', {
    params: { engine: 'google', q: `${name} basketball scouting`, api_key: process.env.SERPAPI_KEY }
  });
  const snippets = resp.data.organic_results?.map((r: any) => r.snippet).filter(Boolean);
  return snippets?.join(' ') || '';
}

// Scraper: Sports Reference
async function scrapeSportsRef(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  for (const v of [`${slug}.html`, `${slug}-1.html`, `${slug}-2.html`]) {
    const url = `https://www.sports-reference.com/cbb/players/${v}`;
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data),
            comments = $('body').contents().filter((_,el) => el.type==='comment').map((_,el)=>el.data).get().join(''),
            $$ = cheerio.load(comments),
            row = $$('table#players_per_game tbody tr.full_table').last();

      if (!row.length) continue;
      const get = (s: string) => parseFloat(row.find(`td[data-stat="${s}"]`).text()) || 0;
      return {
        g: get('g') || 1, fg: get('fg'), fga: get('fga') || 1,
        fg3: get('fg3'), fg3a: get('fg3a') || 1,
        ft: get('ft'), fta: get('fta') || 1,
        orb: get('orb'), drb: get('drb'),
        ast: get('ast'), stl: get('stl'),
        blk: get('blk'), mp: get('mp') || 20
      };
    } catch {}
  }
  return null;
}

// Scraper: 247Sports
async function scrape247(name: string) {
  try {
    const sr = await axios.get(`https://247sports.com/Search/?q=${encodeURIComponent(name)}`);
    const $s = cheerio.load(sr.data),
          link = $s('a[data-sport="basketball"]').attr('href');
    if (!link) return null;
    const pr = await axios.get(`https://247sports.com${link}`),
          $p = cheerio.load(pr.data),
          stars = parseInt($p('.rating').first().text(),10) || 0,
          summary = $p('.player-summary').text() || '';
    return { stars, summary };
  } catch { return null; }
}

export async function scoutPlayer(name: string) {
  const stats = await scrapeSportsRef(name),
        recruit = await scrape247(name),
        web = await searchWeb(name),
        textPool = `${recruit?.summary || ''} ${web}`;

  const tendencies = extractTendencies(textPool);
  const scale = (n: number) => Math.min(10, Math.max(1, Math.round(n)));
  const defaultAttrs = { layup:5,dunking:5,inside:5,midrange:5,three:5,freeThrow:5,dribbling:5,passing:5,offReb:5,defReb:5,stealing:5,blocking:5 };

  if (!stats) return { name, attributes: defaultAttrs, tendencies, analysis: recruit?.summary || web || 'No information found.', starRating: recruit?.stars || 0 };

  const { g, fg, fga, fg3, fg3a, ft, fta, orb, drb, ast, stl, blk } = stats,
        total = (v: number) => Math.round(v * g),
        attributes = {
          layup: scale((fg / fga) * 10),
          dunking: scale((fg / 2)),
          inside: scale(fg - fg3),
          midrange: scale(((fg - fg3) / (fga - fg3a)) * 10),
          three: scale(stats.fg3a >= 2 ? statPercent(fg3, fg3a)*10 : 4),
          freeThrow: scale((ft/fta) * 10),
          dribbling: scale(6 + Math.log10(g)),
          passing: scale(ast * 2),
          offReb: scale(total(orb) / 10),
          defReb: scale(total(drb) / 10),
          stealing: scale(total(stl) / 10),
          blocking: scale(total(blk) / 10)
        };

  function statPercent(a: number, b: number) { return b? a/b : 0; }

  return { name, attributes, tendencies, analysis: recruit?.summary || web, starRating: recruit?.stars || 0 };
}
