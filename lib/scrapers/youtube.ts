import fetch from 'node-fetch';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function scrapeYouTube(playerName: string): Promise<string> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key missing');
    return '';
  }

  const query = encodeURIComponent(playerName);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}&maxResults=5&type=video`;

  try {
    const response = await fetch(url);
    if (!response.ok) return '';

    const data = await response.json();
    if (!data.items || data.items.length === 0) return '';

    let combinedText = '';

    for (const item of data.items) {
      combinedText += `${item.snippet.title} ${item.snippet.description} `;
    }

    return combinedText.trim();

  } catch (error) {
    console.error('YouTube API error:', error);
    return '';
  }
}
