import fetch from 'node-fetch';
import cheerio from 'cheerio';

export async function scrapeOn3(playerName: string): Promise<string> {
  const searchName = playerName.toLowerCase().replace(/\s+/g, '-');

  // Example On3 profile URL pattern (adjust if necessary)
  const url = `https://www.on3.com/players/${searchName}/`;

  try {
    const response = await fetch(url);
    if (!response.ok) return '';

    const html = await response.text();
    const $ = cheerio.load(html);

    // Grab bio/description text - adjust selector based on actual On3 layout
    const bio = $('div.bio, section.bio, .player-bio, .content').text() || '';

    // Also try to grab stats or scouting reports if available
    const stats = $('section.stats, .stats, .player-stats').text() || '';

    return `${bio} ${stats}`.trim();

  } catch (error) {
    console.error('Error scraping On3:', error);
    return '';
  }
}
