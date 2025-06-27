// Static example or scraping team info from known sites
const teamsDatabase = {
  'Example University': {
    coach: 'John Doe',
    archetype: 'Balanced',
    strengths: ['Leadership', 'Motivation'],
    offenseFocus: 'Balanced',
    tempo: 'Average',
    reboundingApproach: 'Balanced',
    defensiveAggression: 'Physical',
    benchDepth: 'Deep',
    benchUtilization: 'High',
    closingLineup: 'Starters',
    medicalRating: 3,
    trainingRating: 3,
    analyticsRating: 2,
    arenaRating: 4,
  },
  // Add more teams or scrape dynamically
};

export async function getTeamData(teamName: string) {
  return teamsDatabase[teamName] || null;
}
