import { scoutPlayer } from './lib/researchEngine';

(async () => {
  const profile = await scoutPlayer('Jalen Suggs');
  console.log(profile);
})();
