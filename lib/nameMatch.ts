// FILE: lib/nameMatch.ts

import axios from 'axios';
import Fuse from 'fuse.js';

let nameCache: string[] = [];

async function fetchPlayerDatabase(): Promise<string[]> {
  if (nameCache.length > 0) return nameCache;

  try {
    const res = await axios.get(
      'https://raw.githubusercontent.com/caden3412/HoopLanddd/main/data/players.json'
    );
    const names = res.data.map((p: any) => p.name);
    nameCache = names;
    return names;
  } catch {
    return [];
  }
}

export async function getCleanedName(input: string): Promise<string> {
  const names = await fetchPlayerDatabase();

  if (!names.length) return input;

  const fuse = new Fuse(names, { threshold: 0.3 });
  const result = fuse.search(input);
  return result.length > 0 ? result[0].item : input;
}
