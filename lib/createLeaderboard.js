const _ = require("lodash");

const createLeaderboard = async (msg, result, week, james) => {
  let golfScores = [];
  result.forEach((stat) =>
    golfScores.push(_.pick(stat, ["user", "wordleGolf"]))
  );
  // console.log(golfScores);
  let numHoles = {};
  let jamesScores = {};
  golfScores.forEach((userStats) => {
    //  console.log(userStats.wordleGolf[`week${week}`]);
    let weekStats = userStats.wordleGolf[`week${week}`];
    if (!weekStats) return;
    //  console.log(weekStats.stats)
    jamesScores[userStats.user] = weekStats.stats.jamesScore;

    let weekObj = weekStats.scores;
    // console.log({ weekObj });
    if (!weekObj) return;
    let thisWeek = Object.values(weekObj);
    numHoles[userStats.user] = thisWeek.length;
    // console.log(thisWeek);
    let weekPM = thisWeek.reduce((a, b) => a + (b - 4), 0);
    // console.log(weekPM);
    userStats.wordleGolf = weekPM;
    // console.log(userStats)
  });
  console.log({ jamesScores });
  // console.log({ numHoles });
  let lbStr = `\n__**Week ${week} Leaderboard**__\n`;
  let pos = 1;
  golfScores = _.chain(golfScores)
    .groupBy("wordleGolf")
    .map((value, key) => ({ weekScore: Number(key), users: value }))
    .value();
  console.log({ golfScores });
  let leaderBoard = _.sortBy(golfScores, ["weekScore"]);
  console.log({ leaderBoard });
  console.log(leaderBoard[0].users);
  leaderBoard.forEach((leader, i) => {
    let users = leader.users;
    console.log({ users });
    users.forEach((user) => {
      user.jamesScore = jamesScores[user.user];
    });
    //  console.log({users})
    users = _.orderBy(users, ["jamesScore"], ["desc"]);
    //  console.log('ordered users',users)
    leaderBoard[i].users = users;
  });
  console.log(leaderBoard[0].users);
  leaderBoard.forEach((leader) => {
    let users = leader.users;
    let weekScore = leader.weekScore;
    if (!weekScore && weekScore !== 0) return;
    weekScore = weekScore > 0 ? `+ ${weekScore}` : weekScore;
    let emoji = pos === 1 ? "    🏆" : "";
    // console.log(value);
    // console.log(weekScore);
    users.forEach((user) => {
      // console.log(users.length);
      let posStr = users.length > 1 ? "T" + pos : "   " + pos;
      lbStr += `   **${posStr}. ${user.user.substring(
        0,
        user.user.indexOf("-")
      )}**   |   ${
        numHoles[user.user]
      } played   |   **${weekScore}**${emoji}\n`;
      let js =
        pos === 1
          ? "       " + `   ↳ **James Score**: ${user.jamesScore.toFixed(3)}\n`
          : "";
      lbStr += js;
    });
    pos += users.length;
  });
  // console.log(lbStr);
  let pinned = await msg.channel.messages.fetchPinned();
  pinned = pinned.filter((m) => m.content.includes(`Leaderboard`));
  // console.log(pinned.first())
  if (!pinned.first()) {
    msg.channel.send(`${lbStr}`).then((msg) => msg.pin());
  } else {
    pinned.first().edit(`${lbStr}`);
  }
};

module.exports = createLeaderboard