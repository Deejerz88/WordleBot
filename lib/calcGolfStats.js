const calcGolfStats = (gWeek, james, golfDay) => {
  weekArr = Object.entries(gWeek);
  weekArr.sort((a, b) => a[0].slice(-1) - b[0].slice(-1));
  let gTotal = 0;
  let golfStr = "";
  let weekJamesTotal = 0;
  weekArr.forEach((weekDay) => {
    const s = weekDay[1];
    // console.log({ s });
    weekJamesTotal += !!james[s] ? james[s] : 0;
    // console.log({ weekJamesTotal });
    gTotal += s;
    let hole = s - 4;
    const thisDay = weekDay[0].slice(-1);
    hole = hole > 0 ? "+" + hole : hole;
    golfStr += `**Hole ${thisDay}:** ${hole}`;
    golfStr = thisDay < golfDay ? (golfStr += "  |  ") : golfStr;
  });
  // console.log("gweek length", Object.keys(gWeek));
  weekJamesScore = ((weekJamesTotal / Object.keys(gWeek).length) * 10).toFixed(
    3
  );
  plusMinus = gTotal - golfDay * 4;
  plusMinus = plusMinus > 0 ? `+ ${plusMinus}` : plusMinus;
};

module.exports = calcGolfStats;
