import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapePlayerData(name: string) {
  const search = name.toLowerCase().replace(/\s+/g, '+');
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  const wikiUrl = `https://en.wikipedia.org/wiki/${slug}`;
  const on3Url = `https://www.on3.com/db/search/?q=${search}`;
  const espnSearchUrl = `https://www.google.com/search?q=${search}+site:espn.com`;
  const rivalsUrl = `https://n.rivals.com/search#query=${search}`;

  const result: any = {
    name,
    slug,
    height: null,
    weight: null,
    jersey: null,
    team: null,
    year: null,
    analysis: null,
    interest: [],
    attributes: {
      layup: 5,
      dunking: 5,
      inside: 5,
      midrange: 5,
      three: 5,
      freeThrow: 5,
      dribbling: 5,
      passing: 5,
      offReb: 5,
      defReb: 5,
      stealing: 5,
      blocking: 5,
    },
    physical: {},
    tendencies: {
      dunks: 0,
      floaters: 0,
      postups: 0,
      hookshots: 0,
      twopointers: 0,
      threePointers: 0,
      pumpfakes: 0,
      fades: 0,
      passes: 0,
      lobs: 0,
      crossovers: 0,
      spinmoves: 0,
      stepbacks: 0,
      offReb: 0,
      runplay: 0,
      defReb: 0,
      onballsteals: 0,
      offballsteals: 0,
      blocks: 0,
      takecharge: 0,
    },
  };

  try {
    // Wikipedia – Bio info
    const wikiRes = await axios.get(wikiUrl).catch(() => null);
    if (wikiRes && wikiRes.status === 200) {
      const $ = cheerio.load(wikiRes.data);
      const infobox = $('.infobox');

      infobox.find('tr').each((i, el) => {
        const label = $(el).find('th').text().trim().toLowerCase();
        const value = $(el).find('td').text().trim();

        if (label.includes('height')) result.height = value;
        if (label.includes('weight')) result.weight = value;
        if (label.includes('number')) result.jersey = value;
        if (label.includes('team')) result.team = value;
      });
    }

    // On3 fallback info
    const on3Res = await axios.get(on3Url).catch(() => null);
    if (on3Res && on3Res.status === 200) {
      // Add On3-specific scraping if needed later
    }

    // ESPN Description for NLP
    const espnRes = await axios.get(espnSearchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).catch(() => null);
    if (espnRes && espnRes.status === 200) {
      const textBlock = espnRes.data.match(/<span class="hgKElc">(.+?)<\/span>/g)?.map(t => t.replace(/<\/?[^>]+(>|$)/g, ''))?.join(' ');
      if (textBlock) {
        result.analysis = textBlock;
        const nlp = await extractNLPProfile(textBlock); // <- you must create this function
        result.attributes = { ...result.attributes, ...nlp.attributes };
        result.tendencies = { ...result.tendencies, ...nlp.tendencies };
        result.physical = nlp.physical;
      }
    }

    // Rivals or more sources could go here...
  } catch (err) {
    console.error('Scraping error:', err);
  }

  return result;
}
