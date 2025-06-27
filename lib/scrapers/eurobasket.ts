import fetch from 'node-fetch';
import cheerio from 'cheerio';

export async function scrapeEurobasket(playerName: string): Promise<string> {
  const searchName = playerName.toLowerCase().replace(/\s+/g, '-');
  const url = `https://basketball.eurobasket.com/player/${searchName}/`;

  try {
    const response = await fetch(url);
    if (!response.ok) return '';

    const html = await response.text();
    const $ = cheerio.load(html);

    // Example selectors, adjust based on actual site HTML
    const bio = $('.player-bio, #player-info').text() || '';
    const stats = $('.stats-section, .player-stats').text() || '';

    return `${bio} ${stats}`.trim();

  } catch (error) {
    console.error('Error scraping Eurobasket:', error);
    return '';
  }
}
