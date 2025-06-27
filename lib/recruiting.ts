import fetch from 'node-fetch';
import cheerio from 'cheerio';

export async function getRecruitingInterest(playerName: string): Promise<{ school: string; percent: number }[]> {
  // Example: scrape On3 offers for player (adjust URL and selectors)
  const searchName = playerName.toLowerCase().replace(/\s+/g, '-');
  const url = `https://www.on3.com/players/${searchName}/offers/`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);

    const offers: { school: string; percent: number }[] = [];

    $('.offer-row').each((_, el) => {
      const school = $(el).find('.offer-school').text().trim();
      const percentText = $(el).find('.offer-percent').text().trim().replace('%', '');
      const percent = parseInt(percentText) || 0;
      if (school) offers.push({ school, percent });
    });

    return offers;

  } catch (error) {
    console.error('Error scraping recruiting interest:', error);
    return [];
  }
}
