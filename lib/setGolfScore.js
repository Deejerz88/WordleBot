const setGolfScore = (gWeek,gScores,week,golfDay,score) => {
  if (!gWeek) {
    gScores[`week${week}`] = { scores: {}, stats: {} };
    gWeek = gScores[`week${week}`].scores;
  }
  score = !score ? 8 : score;
  gWeek[`day${golfDay}`] = Number(score);

  let golfDays = Object.keys(gWeek);
  let gDaysPlayed = golfDays.length;
  if (gDaysPlayed !== golfDay) {
    let i = 1;
    golfDays.forEach((day) => {
      if (day.slice(-1) != i) {
        gWeek[`day${i}`] = 8;
        i++;
        dist["0"] += 1;
      }
      i++;
    });
  }
};

module.exports = setGolfScore
