export async function globalResearchPlayer(name: string) {
  return {
    inferredAttributes: {
      layup: 1, dunking: 1, passing: 1, dribbling: 1
    },
    inferredTendencies: {
      floaters: 2, stepbacks: 1, postups: 0, spinmoves: 1
    }
  };
}
