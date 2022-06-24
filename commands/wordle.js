const Discord = require("discord.js");
const async = require("async");
require("dotenv").config();
const { SlashCommandBuilder } = require("@discordjs/builders");
const mongoose = require("mongoose");
var _ = require("lodash");

const james = [0, 1, 0.92, 0.78, 0.58, 0.38, 0.22];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wordle")
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
      // console.log("test");

      let stringArr = value
        .substring(0, value.indexOf("/") + 2)
        .trim()
        .split(" ");
      let score = stringArr[2][0];
      let day = stringArr[1];
      let blocks = "";
      try {
        blocks = value.substring(value.indexOf("/") + 3).split(" ");
        blocks = "\n" + blocks.join("\n") + "\n";
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
        const avg = total / numGames;
        let jamesTotal = 0;
        dist.forEach((s, i) => (jamesTotal += s * james[i]));
        const jamesScore = (jamesTotal / numGames) * 10;
        const days = day - 352 + 1;
        const week = Math.ceil(days / 7);
        const golfDay = days % 7;
        const gScores = stats.wordleGolf;
        // console.log(gScores);
        let golfScores = [];
        result.forEach((stat) =>
          golfScores.push(_.pick(stat, ["user", "wordleGolf"]))
        );
        // console.log(golfScores);
        golfScores.forEach((userStats) => {
          let weekObj = userStats.wordleGolf[`week${week}`];
          let thisWeek = Object.values(weekObj);
          // console.log(thisWeek);
          let weekPM = thisWeek.reduce((a, b) => a + (b - 4), 0);
          // console.log(weekPM);
          userStats.wordleGolf = weekPM;
          // console.log(userStats)
        });

        let lbStr = `\n**Week ${week} Leaderboard**\n`;
        let pos = 1;
        golfScores = _.chain(golfScores)
          .groupBy("wordleGolf")
          .map((value, key) => ({ weekScore: Number(key), users: value }))
          .value();
        // console.log(golfScores);
        let leaderBoard = _.sortBy(golfScores, ["weekScore"]);
        // console.log(leaderBoard);
        _.forEach(leaderBoard, (value, key) => {
          let users = value.users;
          users.forEach((user) => {
            // console.log(users.length);
            let posStr = users.length > 1 ? "T" + pos : "   " + pos;
            lbStr += `${posStr}. ${user.user.substring(
              0,
              user.user.indexOf("-")
            )}\n`;
          });
          pos += users.length;
        });
        // console.log(lbStr);
        //  console.log(gScores);
        const gWeek = gScores[`week${week}`];

        // console.log(gWeek);
        gWeek[`day${golfDay}`] = Number(score);
        console.log(gScores);
        let gTotal = 0;
        let golfStr = "";
        for (day in gWeek) {
          const s = gWeek[day];
          gTotal += s;
          let hole = s - 4;
          const thisDay = day.slice(-1);
          hole = hole > 0 ? "+" + hole : hole;
          golfStr += `**Hole ${thisDay}:** ${hole}`;
          golfStr = thisDay < golfDay ? (golfStr += "  |  ") : golfStr;
        }
        // console.log(golfStr);
        const plusMinus = gTotal - golfDay * 4;
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
          todayPM += `   😬`;
        } else if (todayPM == 2) {
          todayPM += `   💩`;
        } else if (todayPM == 3) {
          todayPM += `   :drosky: `;
        }
        //  console.log(gScores);
        interaction
          .editReply(
            reply +
              "\n**New Totals For " +
              username +
              "**\n**Total Games:** " +
              numGames +
              "\n**Average:** " +
              avg +
              "\n**James Score:** " +
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
----------------------------------------------------------------
🏌️  **WORDLE GOLF**   ⛳
**Week** ${week}  **Day** ${golfDay}
**Score**: ${todayPM}
**Total**: ${plusMinus}
${golfStr}
----------------------------------------------------------------`
          )
          .then(async (msg) => {
            let pinned = await msg.channel.messages.fetchPinned();
            pinned = pinned.filter((m) =>
              m.content.includes(`Week ${week} Leaderboard`)
            );
            // console.log(pinned.first())
            if (!pinned.first()) {
              msg.channel.send(`${lbStr}`).then((msg) => msg.pin());
            } else {
              pinned.first().edit(`${lbStr}`);
            }
          })
          .then(async () => {
            // console.log(gScores)
            // gScores[`week${week}`][`day${golfDay}`] = Number(score)
            // console.log(gScores)
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
    }
  },
};
