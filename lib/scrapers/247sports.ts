import fetch from 'node-fetch';
import cheerio from 'cheerio';

export async function scrape247Sports(playerName: string): Promise<string> {
  const searchName = playerName.toLowerCase().replace(/\s+/g, '-');
  const url = `https://247sports.com/Player/${searchName}-player/`;

  try {
    const response = await fetch(url);
    if (!response.ok) return '';

    const html = await response.text();
    const $ = cheerio.load(html);

    // Example selector for bio text or scouting notes (adjust as needed)
    const bio = $('.bio, .player-bio, .profile-overview').text() || '';
    const stats = $('.stats-section, .player-stats').text() || '';

    return `${bio} ${stats}`.trim();

  } catch (error) {
    console.error('Error scraping 247Sports:', error);
    return '';
  }
}
