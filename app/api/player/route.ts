export async function scoutPlayer(name: string): Promise<PlayerProfile> {
  const baseSlug = name.trim().toLowerCase().replace(/\s+/g, '-');
  const variants = [`${baseSlug}.html`, `${baseSlug}-1.html`, `${baseSlug}-2.html`];
  let html = '';
  let slug = '';
  let found = false;

  for (const v of variants) {
    const url = `https://www.sports-reference.com/cbb/players/${v}`;
    const res = await fetch(url);
    if (res.ok) {
      html = await res.text();
      slug = v.replace('.html', '');
      found = true;
      break;
    }
  }

  if (!found) {
    // Fallback for freshmen or unknown players
    return {
      name,
      slug: baseSlug,
      team: 'TBD',
      year: 'Fr',
      attributes: fill({ layup: 5, dunking: 5, inside: 5, midrange: 5, three: 5, freeThrow: 5, dribbling: 5, passing: 5, offReb: 5, defReb: 5, stealing: 5, blocking: 5 }),
      physical: fill({ speed: 6, strength: 6, stamina: 6 }),
      tendencies: fill({ floaters: 0, postups: 0, threePointers: 0, spinmoves: 0 }),
      analysis: "Freshman or international player. Full scouting will be available once data is reported.",
      interest: [
        { school: 'Duke', percent: 30 },
        { school: 'Kentucky', percent: 25 },
        { school: 'UConn', percent: 15 },
      ],
    };
  }

  // Extract stats table
  const $ = cheerio.load(html);
  const comments = $('body').contents().filter((_, el) => el.type === 'comment').map((_, el) => el.data).get().join('');
  const $$ = cheerio.load(comments);
  const row = $$('table#players_per_game tbody tr.full_table').last();

  console.log('Player URL slug:', slug);
  console.log('Extracted stats row HTML:', row.html());

  const g = parseFloat(row.find('td[data-stat="g"]').text()) || 1;
  const fg = parseFloat(row.find('td[data-stat="fg"]').text()) || 0;
  const fga = parseFloat(row.find('td[data-stat="fga"]').text()) || 1;
  const fg3 = parseFloat(row.find('td[data-stat="fg3"]').text()) || 0;
  const fg3a = parseFloat(row.find('td[data-stat="fg3a"]').text()) || 1;
  const ft = parseFloat(row.find('td[data-stat="ft"]').text()) || 0;
  const fta = parseFloat(row.find('td[data-stat="fta"]').text()) || 1;
  const orb = parseFloat(row.find('td[data-stat="orb"]').text()) || 0;
  const drb = parseFloat(row.find('td[data-stat="drb"]').text()) || 0;
  const ast = parseFloat(row.find('td[data-stat="ast"]').text()) || 0;
  const stl = parseFloat(row.find('td[data-stat="stl"]').text()) || 0;
  const blk = parseFloat(row.find('td[data-stat="blk"]').text()) || 0;
  const mp = parseFloat(row.find('td[data-stat="mp"]').text()) || 20;

  console.log('Parsed stats:');
  console.log('Games played (g):', g);
  console.log('FG:', fg, 'FGA:', fga);
  console.log('3PT FG:', fg3, '3PT FGA:', fg3a);
  console.log('FT:', ft, 'FTA:', fta);
  console.log('Offensive Rebounds (orb):', orb);
  console.log('Defensive Rebounds (drb):', drb);
  console.log('Assists (ast):', ast);
  console.log('Steals (stl):', stl);
  console.log('Blocks (blk):', blk);
  console.log('Minutes Played (mp):', mp);

  const total = (val: number) => Math.round(val * g);

  console.log('Raw attribute calculations before scaling:');
  console.log('Layup:', (fg / fga) * 10);
  console.log('Dunking:', fg / 2);
  console.log('Inside:', fg - fg3);
  console.log('Midrange:', ((fg - fg3) / (fga - fg3a)) * 10);
  console.log('3PT Percentage:', fg3 / fg3a);
  console.log('Free Throw %:', ft / fta);
  console.log('Dribbling:', 6 + Math.log10(g));
  console.log('Passing:', ast * 2);
  console.log('Offensive Reb:', total(orb) / 10);
  console.log('Defensive Reb:', total(drb) / 10);
  console.log('Stealing:', total(stl) / 10);
  console.log('Blocking:', total(blk) / 10);

  const attributes = {
    layup: scale((fg / fga) * 10),
    dunking: scale(fg / 2),
    inside: scale(fg - fg3),
    midrange: scale(((fg - fg3) / (fga - fg3a)) * 10),
    three: fg3a >= 2 ? fg3 / fg3a >= 0.4 ? 10 : fg3 / fg3a >= 0.35 ? 7 : 5 : 4,
    freeThrow: Math.min(10, Math.round((ft / fta) * 10)),
    dribbling: scale(6 + Math.log10(g)),
    passing: scale(ast * 2),
    offReb: scale(total(orb) / 10),
    defReb: scale(total(drb) / 10),
