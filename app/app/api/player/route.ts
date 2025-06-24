export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { globalResearchPlayer } from '@/lib/globalResearcher';

async function trySlugVariants(baseSlug: string) {
  const variants = [`${baseSlug}.html`, `${baseSlug}-1.html`, `${baseSlug}-2.html`];
  for (const slug of variants) {
    const url = `https://www.sports-reference.com/cbb/players/${slug}`;
    const res = await fetch(url);
    if (res.ok) {
      const html = await res.text();
      return { html, slug };
    }
  }
  return null;
}

function parseStats(html: string) {
  const $ = cheerio.load(html);
  const comments = $('body').contents().filter((_, e) => e.type === 'comment').map((_, e) => e.data).get().join('');
  const $$ = cheerio.load(comments);
  const lastRow = $$('table#players_per_game tbody tr.full_table').last();
  const stats = {
    g: 0, mp_per_g: 0, fg_per_g: 0, fga_per_g: 0,
    fg3_per_g: 0, fg3a_per_g: 0, ft_per_g: 0, fta_per_g: 0,
    orb_per_g: 0, drb_per_g: 0, ast_per_g: 0,
    stl_per_g: 0, blk_per_g: 0
  };
  for (let stat in stats) {
    stats[stat] = parseFloat(lastRow.find(`td[data-stat="${stat}"]`).text()) || 0;
  }
  return stats;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name') || '';
  const baseSlug = name.trim().toLowerCase().replace(/\\s+/g, '-');
  let attributes = {}, tendencies = {}, slug = '', stats = null, physical = {};

  try {
    const result = await trySlugVariants(baseSlug);
    if (result) {
      const tot = parseStats(result.html);
      slug = result.slug;
      stats = tot;
      const games = tot.g || 1;
      attributes = {
        layup: Math.min(10, (tot.fg_per_g / tot.fga_per_g) * 10 || 5),
        dunking: Math.min(10, tot.fg_per_g / 2 || 5),
        inside: Math.min(10, (tot.fg_per_g - tot.fg3_per_g)),
        midrange: Math.min(10, ((tot.fg_per_g - tot.fg3_per_g) / (tot.fga_per_g - tot.fg3a_per_g)) * 10 || 5),
        three: Math.min(10, (tot.fg3_per_g / tot.fg3a_per_g >= 0.40 ? 10 : tot.fg3_per_g / tot.fg3a_per_g >= 0.35 ? 7 : 5)),
        freeThrow: Math.round((tot.ft_per_g / tot.fta_per_g) * 10),
        dribbling: 6 + Math.log10(games || 1),
        passing: Math.min(10, tot.ast_per_g * 2),
        offReb: Math.min(10, tot.orb_per_g * 10),
        defReb: Math.min(10, tot.drb_per_g * 10),
        stealing: Math.min(10, tot.stl_per_g * 10),
        blocking: Math.min(10, tot.blk_per_g * 10),
      };
      physical = {
        speed: Math.min(10, 4 + tot.mp_per_g / 10),
        strength: 6,
        stamina: Math.min(10, 4 + tot.mp_per_g / 5),
      };
    }

    const research = await globalResearchPlayer(name);
    for (const k in research.inferredAttributes) {
      attributes[k] = Math.min(10, (attributes[k] || 5) + research.inferredAttributes[k]);
    }
    tendencies = research.inferredTendencies;

    return NextResponse.json({ name, slug, attributes, physical, tendencies });
  } catch (err) {
    return NextResponse.json({ error: 'Player not found or fetch failed' }, { status: 500 });
  }
}
