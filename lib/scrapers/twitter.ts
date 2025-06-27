import fetch from 'node-fetch';

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

if (!BEARER_TOKEN) {
  throw new Error('TWITTER_BEARER_TOKEN not set in environment variables');
}

export async function scrapeTwitter(playerName: string): Promise<string> {
  // URL encode player name for query
  const query = encodeURIComponent(`"${playerName}" -is:retweet lang:en`);

  // Build Twitter recent search API URL
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10&tweet.fields=text,created_at&expansions=author_id&user.fields=name,username,description,public_metrics`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Twitter API error:', err);
      return '';
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) return '';

    // Collect text from tweets and user descriptions to aggregate info
    let combinedText = '';

    // Add user descriptions (bios)
    if (data.includes && data.includes.users) {
      for (const user of data.includes.users) {
        combinedText += `${user.description} `;
      }
    }

    // Add tweet texts
    for (const tweet of data.data) {
      combinedText += `${tweet.text} `;
    }

    return combinedText.trim();

  } catch (error) {
    console.error('Error fetching Twitter data:', error);
    return '';
  }
}
