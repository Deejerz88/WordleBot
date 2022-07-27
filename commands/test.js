const Discord = require("discord.js");
const async = require("async");
require("dotenv").config();
const { SlashCommandBuilder } = require("@discordjs/builders");
const mongoose = require("mongoose");
var _ = require("lodash");

const james = [
  0, 1, 0.9253705585449039, 0.7761116756347115, 0.5778998317544551,
  0.3780879878741986, 0.21887851276999337,
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Record score")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription(
          "Paste Results Here or Enter in format: Wordle 234 5/6. Submit Distr: 1:x,2:x... 6:x,0:x (fails)"
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    let value = interaction.options.getString("input");
    // console.log(value);
    let user = interaction.user;
    let username = user.username;
    // console.log(username);
    let id = user.id;
    // console.log(id);
    if (value[0].toLowerCase() === "w") {
      let stringArr = value
        .substring(0, value.indexOf("/") + 2)
        .trim()
        .split(" ");
      let score = stringArr[2][0];
      score = isNaN(score) ? 0 : score;
      let day = stringArr[1];
      let blocks = "";
      try {
        blocks = value.substring(value.indexOf("/") + 3).split(" ");
        blocks = blocks.join("\n") + "\n";
      } catch (err) {}
      let reply = stringArr.join(" ") + blocks;

      await mongoose
        .connect(process.env.MONGO_URI)
        .then(() => console.log("MongoDB has been connected"))
        .catch((error) => {
          // console.log(error);
        });
      const db = mongoose.connection;
      const collection = db.collection("Wordle");
      collection.find({}).toArray((err, result) => {
        if (err) throw err;
        mongoose.connection.close();
        const stats = _.find(result, ["user", `${username}-${id}`]);

        // console.log(stats);
        const dist = stats.distribution;
        dist[score]++;
        const numGames = dist.reduce((a, b) => a + b, 0);
        let total = 0;
        dist.forEach((s, i) => (total += s * i));
        const avg = (total / numGames).toFixed(3);
        let jamesTotal = 0;
        dist.forEach((s, i) => (jamesTotal += s * james[i]));
        const jamesScore = ((jamesTotal / numGames) * 10).toFixed(3);
        const days = day - 352 + 1;
        const week = Math.ceil(days / 7);
        const rem = days % 7;
        const golfDay = rem === 0 ? 7 : rem;
        const gScores = stats.wordleGolf;
        let gWeek;
        if (golfDay === 1) {
          gScores[`week${week}`] = { scores: {}, stats: {} };
          gWeek = gScores[`week${week}`].scores;
        } else {
          gWeek = gScores[`week${week}`].scores;
        }

        score = !score ? 8 : score;
        gWeek[`day${golfDay}`] = Number(score);
        console.log(gScores);

        let golfDays = Object.keys(gWeek);
        let gDaysPlayed = golfDays.length;
        if (gDaysPlayed !== golfDay) {
          let i = 1;
          golfDays.forEach((day) => {
            if (day.slice(-1) != i) {
              gWeek[`day${i}`] = 8;
              i += 1;
              dist["0"] += 1;
            }
            i += 1;

            // console.log(dist);
          });
        }
        let weekArr = Object.entries(gWeek);
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
        let weekJamesScore = (
          (weekJamesTotal / Object.keys(gWeek).length) *
          10
        ).toFixed(3);
        // console.log({ weekJamesScore });

        gScores[`week${week}`].scores = Object.fromEntries(weekArr);
        gScores[`week${week}`].stats.jamesScore = weekJamesScore;
        // console.log({weekArr})
        // console.log({ gWeek });
        // console.log( JSON.stringify(gScores));

        // console.log(golfStr);
        let plusMinus = gTotal - golfDay * 4;
        plusMinus = plusMinus > 0 ? `+ ${plusMinus}` : plusMinus;
        let todayPM = score - 4;
        if (todayPM == -3) {
          todayPM += `   🎯`;
        } else if (todayPM == -2) {
          todayPM += `   🦅`;
        } else if (todayPM == -1) {
          todayPM += `   🐤`;
        } else if (todayPM == 0) {
          todayPM += `   👏`;
        } else if (todayPM == 1) {
          todayPM = `+ ${todayPM}   😬`;
        } else if (todayPM == 2) {
          todayPM = `+ ${todayPM}   💩`;
        } else if (todayPM == 3) {
          todayPM = `+ ${todayPM}   ☃️ `;
        }
        //  console.log(gScores);

        interaction
          .editReply(
            reply +
              "\n__**New Totals For " +
              username +
              "**__\n> **Total Games:** " +
              numGames +
              "\n> **Average:** " +
              avg +
              "\n> **James Score:** " +
              jamesScore +
              "\n**1's:** " +
              dist[1] +
              " | **2's:** " +
              dist[2] +
              " | **3's:** " +
              dist[3] +
              " | **4's:** " +
              dist[4] +
              " | **5's:** " +
              dist[5] +
              " | **6's:** " +
              dist[6] +
              " | **Fails** " +
              dist[0] +
              `
---------------------------------------------------------------
🏌️  __**WORDLE GOLF**__   ⛳
**Week** ${week}  **Day** ${golfDay}
> **Score**: ${todayPM}
> **Total**: ${plusMinus}
> **James Score**: ${weekJamesScore}
${golfStr}
---------------------------------------------------------------`
          )
          .then(async (msg) => {
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
                    ? "       " +
                      `   ↳ **James Score**: ${jamesScores[user.user]}\n`
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
          })
          .then(async () => {
            let newValues = {
              $set: {
                games: numGames,
                average: avg,
                jamesScore: jamesScore,
                distribution: dist,
                wordleGolf: gScores,
              },
            };
            await mongoose
              .connect(process.env.MONGO_URI)
              .then(() => console.log("MongoDB has been connected"))
              .catch((error) => {
                console.log(error);
              });
            const db = mongoose.connection;
            const collection = db.collection("Wordle");
            collection.updateOne(
              { user: `${username}-${id}` },
              newValues,
              { upsert: true },
              (err, res) => {
                console.log(res);
                if (err) throw err;
              }
            );
          });

        console.log("replied");
      });
    } else if (value.toLowerCase() === "stats") {
      await mongoose
        .connect(process.env.MONGO_URI)
        .then(() => console.log("MongoDB has been connected"))
        .catch((error) => {
          // console.log(error);
        });
      const db = mongoose.connection;
      const collection = db.collection("Wordle");
      collection.find({}).toArray((err, result) => {
        if (err) throw err;
        mongoose.connection.close();
        const stats = _.find(result, ["user", `${username}-${id}`]);
        console.log(stats);
        const dist = stats.distribution;
        const numGames = dist.reduce((a, b) => a + b, 0);
        let total = 0;
        dist.forEach((s, i) => (total += s * i));
        const avg = (total / numGames).toFixed(3);
        let jamesTotal = 0;
        dist.forEach((s, i) => (jamesTotal += s * james[i]));
        const jamesScore = ((jamesTotal / numGames) * 10).toFixed(3);
        const days = day - 352 + 1;
        const week = Math.ceil(days / 7);
        const rem = days % 7;
        const golfDay = rem === 0 ? 7 : rem;
        const gScores = stats.wordleGolf;
        let gWeek = gScores[`week${week}`].scores;
        if (!gWeek) {
          gScores[`week${week}`] = { scores: {}, stats: {} };
          gWeek = gScores[`week${week}`].scores;
        }
        score = !score ? 8 : score;
        gWeek[`day${golfDay}`] = Number(score);
        console.log(gScores);

        let golfDays = Object.keys(gWeek);
        let gDaysPlayed = golfDays.length;
        if (gDaysPlayed !== golfDay) {
          let i = 1;
          golfDays.forEach((day) => {
            if (day.slice(-1) != i) {
              gWeek[`day${i}`] = 8;
              i += 1;
              dist["0"] += 1;
            }
            i += 1;

            // console.log(dist);
          });
        }
        let weekArr = Object.entries(gWeek);
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
        let weekJamesScore = (
          (weekJamesTotal / Object.keys(gWeek).length) *
          10
        ).toFixed(3);
        // console.log({ weekJamesScore });

        gScores[`week${week}`].scores = Object.fromEntries(weekArr);
        gScores[`week${week}`].stats.jamesScore = weekJamesScore;
        // console.log({weekArr})
        // console.log({ gWeek });
        // console.log( JSON.stringify(gScores));

        // console.log(golfStr);
        let plusMinus = gTotal - golfDay * 4;
        plusMinus = plusMinus > 0 ? `+ ${plusMinus}` : plusMinus;
        let todayPM = score - 4;
        if (todayPM == -3) {
          todayPM += `   🎯`;
        } else if (todayPM == -2) {
          todayPM += `   🦅`;
        } else if (todayPM == -1) {
          todayPM += `   🐤`;
        } else if (todayPM == 0) {
          todayPM += `   👏`;
        } else if (todayPM == 1) {
          todayPM = `+ ${todayPM}   😬`;
        } else if (todayPM == 2) {
          todayPM = `+ ${todayPM}   💩`;
        } else if (todayPM == 3) {
          todayPM = `+ ${todayPM}   ☃️ `;
        }
        //  console.log(gScores);

        interaction
          .editReply(
            reply +
              "\n__**New Totals For " +
              username +
              "**__\n> **Total Games:** " +
              numGames +
              "\n> **Average:** " +
              avg +
              "\n> **James Score:** " +
              jamesScore +
              "\n**1's:** " +
              dist[1] +
              " | **2's:** " +
              dist[2] +
              " | **3's:** " +
              dist[3] +
              " | **4's:** " +
              dist[4] +
              " | **5's:** " +
              dist[5] +
              " | **6's:** " +
              dist[6] +
              " | **Fails** " +
              dist[0] +
              `
---------------------------------------------------------------
🏌️  __**WORDLE GOLF**__   ⛳
**Week** ${week}  **Day** ${golfDay}
> **Score**: ${todayPM}
> **Total**: ${plusMinus}
> **James Score**: ${weekJamesScore}
${golfStr}
---------------------------------------------------------------`
          )
          .then(async (msg) => {
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
                let posStr = users.length > 1 ? "T" + pos : "  " + pos;
                lbStr += `   **${posStr}. ${user.user.substring(
                  0,
                  user.user.indexOf("-")
                )}**   |   ${
                  numHoles[user.user]
                } played   |   **${weekScore}**${emoji}\n`;
                let js =
                  pos === 1
                    ? "       " +
                      `   ↳ **James Score**: ${jamesScores[user.user]}\n`
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
          })
          .then(async () => {
            // console.log("saving");
            // let newValues = {
            //   $set: {
            //     games: numGames,
            //     average: avg,
            //     jamesScore: jamesScore,
            //     distribution: dist,
            //     wordleGolf: gScores,
            //   },
            // };
            // await mongoose
            //   .connect(process.env.MONGO_URI)
            //   .then(() => console.log("MongoDB has been connected"))
            //   .catch((error) => {
            //     console.log(error);
            //   });
            // const db = mongoose.connection;
            // const collection = db.collection("Wordle");
            // collection.updateOne(
            //   { user: `${username}-${id}` },
            //   newValues,
            //   { upsert: true },
            //   (err, res) => {
            //     console.log(res);
            //     if (err) throw err;
            //   }
            // );
          });
      });
    }
  },
};
