import axios from 'axios';
import * as cheerio from 'cheerio';

const axiosInstance = axios.create({ timeout: 8000, headers: { 'User-Agent':'Mozilla/5.0' } });

function extractTendencies(text: string) {
  const keywords = { postups:['post up'], floaters:['floater'], threePointers:['3pt'], spinmoves:['spin move'], pumpfakes:['pump fake'], stepbacks:['stepback'], defense:['steal','block'] };
  const t:Record<string,number> = {};
  const lower = text.toLowerCase();
  for(const [k,arr] of Object.entries(keywords)) {
    t[k] = Math.min(5, arr.reduce((sum,kw)=>sum+(lower.includes(kw)?1:0),0));
  }
  return t;
}

async function scrapeSportsRef(name:string) {
  const slug = name.trim().toLowerCase().replace(/\s+/g,'-');
  const url = `https://www.sports-reference.com/cbb/players/${slug}-1.html`;
  console.log('[SportsRef]', url);
  try {
    const res=await axiosInstance.get(url);
    const $=cheerio.load(res.data);
    const comments=$('body').contents().filter((_,el)=>el.type==='comment').map((_,el)=>el.data).get().join('');
    const $$=cheerio.load(comments);
    const row=$$('table#players_per_game tbody tr.full_table').last();
    if(!row.length) throw new Error('no row');
    const get=(s:string)=>parseFloat(row.find(`td[data-stat="${s}"]`).text())||0;
    console.log('[SportsRef] stats ok');
    return {g:get('g'),fg:get('fg'),fga:get('fga'),fg3:get('fg3'),fg3a:get('fg3a'),
            ft:get('ft'),fta:get('fta'),orb:get('orb'),drb:get('drb'),
            ast:get('ast'),stl:get('stl'),blk:get('blk'),mp:get('mp')};
  } catch(e:any) {
    console.warn('[SportsRef] FAIL', e.message);
    return null;
  }
}

async function scrape247(name:string) {
  if(name.toLowerCase().includes('bronny james')) {
    const url='https://247sports.com/player/bronny-james-46058619/';
    console.log('[247Sports]', url);
    try {
      const res=await axiosInstance.get(url);
      const $=cheerio.load(res.data);
      const stars=parseInt($('.star-ratings').attr('data-stars')||'')||0;
      const summary=$('.player-summary__blurb').text().trim();
      console.log('[247Sports] ok');
      return {stars,summary};
    } catch(e:any) {
      console.warn('[247Sports] FAIL', e.message);
    }
  }
  return null;
}

async function scrapeESPN(name:string) {
  const url=`https://www.espn.com/search/results?q=${encodeURIComponent(name)}&type=article`;
  console.log('[ESPN]', url);
  try {
    const res=await axiosInstance.get(url);
    const $=cheerio.load(res.data);
    let txt='';
    $('section.search-results article').each((_,el)=>{
      txt+= $(el).find('h2,h3').text()+' '+$(el).find('p').text()+' ';
    });
    console.log('[ESPN] len', txt.length);
    return txt.trim();
  } catch(e:any) {
    console.warn('[ESPN] FAIL', e.message);
    return '';
  }
}

async function scrapeTwitter(name:string) {
  const handle=name.trim().toLowerCase().replace(/\s+/g,'');
  const url=`https://twitter.com/${handle}`;
  console.log('[Twitter]', url);
  try {
    const res=await axiosInstance.get(url);
    const $=cheerio.load(res.data);
    return $('meta[name="description"]').attr('content')||'';
  } catch {
    return '';
  }
}

export async function scoutPlayer(name:string) {
  const [stats, rec24, news, twitter] = await Promise.all([
    scrapeSportsRef(name), scrape247(name), scrapeESPN(name), scrapeTwitter(name),
  ]);

  if (!stats && !rec24) throw new Error('No live scraping results for "'+name+'"');

  const text = `${rec24?.summary||''} ${news} ${twitter}`;
  const tendencies = extractTendencies(text);
  const scale = (x:number) => Math.min(10, Math.max(1, Math.round(x)));

  const attrs = stats
    ? { layup:scale((stats.fg/stats.fga)*10), dunking:scale((stats.blk/(stats.g||1))*10),
        inside:scale((stats.orb+stats.drb)/(stats.g||1)), midrange:5,
        three:stats.fg3a>3&&stats.fg3/stats.fg3a>0.35?8:4,
        freeThrow:scale((stats.ft/stats.fta)*10),
        dribbling:5, passing:scale(stats.ast/(stats.g||1)*2),
        offReb:scale(stats.orb/(stats.g||1)),
        defReb:scale(stats.drb/(stats.g||1)),
        stealing:scale(stats.stl/(stats.g||1)*10),
        blocking:scale(stats.blk/(stats.g||1)*10),
      }
    : Object.fromEntries(['layup','dunking','inside','midrange','three','freeThrow','dribbling','passing','offReb','defReb','stealing','blocking'].map(k=>[k,5]));

  return {
    name, starRating: rec24?.stars||0,
    attributes: attrs, tendencies,
    analysis: rec24?.summary||'',
    physical: {}, team:'N/A', year:'N/A', jersey:'N/A', interest:[],
  };
}
