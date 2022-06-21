const Discord = require("discord.js");
const axios = require("axios");
var async = require("async");
const { SlashCommandBuilder } = require("@discordjs/builders");
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
    var opts = interaction.options;
    var value = opts["_hoistedOptions"].map((e) => e["value"])[0];
    console.log(value);
    var user = interaction.user;
    var username = user.username;
    var id = user.id;
    if (value[0].toLowerCase() == "w") {
      console.log("wordle");
      value = value.replace(", ", ",").replace(" , ", ",").replace(" ,", ",");
      var scores = value.split(",");
      console.log(scores);

      for (var i = 0; i < scores.length; i++) {
        var stringArr = scores[i]
          .substring(0, value.indexOf("/") + 2)
          .trim()
          .split(" ");
        var score = stringArr[2][0];
        var day = stringArr[1];
        try {
          var blocks = value.substring(value.indexOf("/") + 3).split(" ");
          blocks = "\n" + blocks.join("\n");
        } catch (err) {
          var blocks = "";
        }
        var reply = scores.length > 1 ? "" : stringArr.join(" ") + blocks;
        console.log("sending score " + day);
        await axios
          .post(
            "https://script.google.com/macros/s/AKfycbzptskOotdqLKE_6fH4c83kmzN9UCh89KVrKgoDs5UDEq-mG3yG_FVF_OomMgRLavYc/exec?score=" +
              score +
              "&day=" +
              day +
              "&username=" +
              username +
              "&id=" +
              id,
            {
              score: [score, day],
            }
          )

          .then((res) => {
            console.log(`statusCode: ${res.status}`);
            // console.log(res.data);
            if (i == scores.length - 1) {
              var data = res.data; //.split(",");
              console.log({ data });
              var average = data["average"];
              var played = data["played"];
              var james = data["james"];
              var o = data["one"];
              var t = data["two"];
              var th = data["three"];
              var f = data["four"];
              var fi = data["five"];
              var s = data["six"];
              var fail = data["fails"];
              var plusMinus = data["plusMinus"];
              var todayPM = score - 4;
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
              // let scoresEnd = data.indexOf("leaders");
              // console.log({ scoresEnd });
              let scores = data["golfScores"];
              console.log({ scores });
              let scoreStr = "";
              scores.forEach((s, i) => {
                let hole = s - 4;
                hole = hole > 0 ? "+" + hole : hole;
                scoreStr += `**Hole ${i + 1}**: ${hole}`;
                scoreStr =
                  i + 1 < scores.length ? (scoreStr += "  |  ") : scoreStr;
              });
              console.log({ scores });
              console.log({ scoreStr });
              let week = data["week"];
              let day = data["day"];
              interaction.editReply(
                reply +
                  "\n**New Totals For " +
                  username +
                  "**\n**Total Games:** " +
                  played +
                  "\n**Average:** " +
                  average +
                  "\n**James Score:** " +
                  james +
                  "\n**1's:** " +
                  o +
                  " | **2's:** " +
                  t +
                  " | **3's:** " +
                  th +
                  " | **4's:** " +
                  f +
                  " | **5's:** " +
                  fi +
                  " | **6's:** " +
                  s +
                  " | **Fails** " +
                  fail +
                  `
----------------------------------------------------------------
🏌️  **WORDLE GOLF**   ⛳
**Week** ${week}  **Day** ${day}
**Score**: ${todayPM}
**Total**: ${plusMinus}
${scoreStr}
----------------------------------------------------------------`
              );

              console.log("replied");
              // console.log(total + " " + plusMinus);
            } else {
              interaction.editReply(
                "Wordle " + day + " recorded. Still working..."
              );
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } else if ((value.trim()[0] == "1") | (value.trim()[0] == 1)) {
      console.log("distribution");
      var scores = value;
      console.log(scores);
      await axios
        .post(
          "https://script.google.com/macros/s/AKfycbzptskOotdqLKE_6fH4c83kmzN9UCh89KVrKgoDs5UDEq-mG3yG_FVF_OomMgRLavYc/exec?scores=" +
            scores +
            "&username=" +
            username +
            "&id=" +
            id
        )
        .then((res) => {
          console.log(`statusCode: ${res.status}`);
          console.log(res.data);

          var data = res.data.split(",");
          var average = data[0];
          var played = data[1];
          var james = data[2];
          var o = data[3];
          var t = data[4];
          var th = data[5];
          var f = data[6];
          var fi = data[7];
          var s = data[8];
          var fail = data[9];
          interaction.editReply(
            "**Scores Added:** " +
              value +
              "\n**New Totals For " +
              username +
              "**\n**Total Games:** " +
              played +
              "\n**Average:** " +
              average +
              "\n**James Score:** " +
              james +
              "\n**1's:** " +
              o +
              " | **2's:** " +
              t +
              " | **3's:** " +
              th +
              " | **4's:** " +
              f +
              " | **5's:** " +
              fi +
              " | **6's:** " +
              s +
              " | **Fails** " +
              fail
          );
          console.log("replied");
        })
        .catch((error) => {
          console.error(error);
        });
    } else if (value.toString().toLowerCase() == "stats") {
      await axios

        .post(
          "https://script.google.com/macros/s/AKfycbzptskOotdqLKE_6fH4c83kmzN9UCh89KVrKgoDs5UDEq-mG3yG_FVF_OomMgRLavYc/exec?stats=" +
            value +
            "&username=" +
            username +
            "&id=" +
            id
        )

        .then((res) => {
          console.log(`statusCode: ${res.status}`);

          var data = res.data; //.split(",");
          console.log({ data });
          var average = data["average"];
          var played = data["played"];
          var james = data["james"];
          var o = data["one"];
          var t = data["two"];
          var th = data["three"];
          var f = data["four"];
          var fi = data["five"];
          var s = data["six"];
          var fail = data["fails"];
          var plusMinus = data["plusMinus"];
          var todayPM = score - 4;
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
          // let scoresEnd = data.indexOf("leaders");
          // console.log({ scoresEnd });
          let scores = data["golfScores"];
          console.log({ scores });
          let scoreStr = "";
          scores.forEach((s, i) => {
            let hole = s - 4;
            hole = hole > 0 ? "+" + hole : hole;
            scoreStr += `**Hole ${i + 1}**: ${hole}`;
            scoreStr = i + 1 < scores.length ? (scoreStr += "  |  ") : scoreStr;
          });
          console.log({ scores });
          console.log({ scoreStr });
          let week = data["week"];
          let day = data["day"];
          interaction.editReply(
            "\n**Stats For " +
              username +
              "**\n**Total Games:** " +
              played +
              "\n**Average:** " +
              average +
              "\n**James Score:** " +
              james +
              "\n**1's:** " +
              o +
              " | **2's:** " +
              t +
              " | **3's:** " +
              th +
              " | **4's:** " +
              f +
              " | **5's:** " +
              fi +
              " | **6's:** " +
              s +
              " | **Fails** " +
              fail +
              `
----------------------------------------------------------------
🏌️  **WORDLE GOLF**   ⛳
**Week** ${week}  **Day** ${day}
**Score**: ${todayPM}
**Total**: ${plusMinus}
${scoreStr}
----------------------------------------------------------------`
          );

          console.log("replied");
        })

        .catch((error) => {
          console.error(error);
        });
    }
  },
};
