const mongoose = require("mongoose");
require("dotenv").config();
const async = require("async");
const _ = require("lodash");

const calcStats = async () => {
  const james = [
    0, 1, 0.9253705585449039, 0.7761116756347115, 0.5778998317544551,
    0.3780879878741986, 0.21887851276999337,
  ];
  await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB has been connected"))
    .catch((error) => {
      console.log(error);
    });
  const db = mongoose.connection;
  const collection = db.collection("Wordle");
  collection.find({}).toArray((err, result) => {
    if (err) throw err;
    mongoose.connection.close();
    // console.log(result)
    let golfScores = [];
    result.forEach((stat) =>
      golfScores.push(_.pick(stat, ["user", "wordleGolf"]))
    );
    console.log(golfScores);
    golfScores.forEach((user) => {
      let username = user.user;
      console.log(username);
      let wordleGolf = Object.entries(user.wordleGolf);
      wordleGolf.forEach((week) => {
        let weekNum = week[0]
        let scores = Object.entries(week[1].scores);
        let stats = week[1].stats;
        // console.log(scores);
        // console.log(stats);
        let total = 0;
        let jamesTotal = 0;
        scores.forEach((score) => {
          let s = score[1];
          total += s;
          s = s === 8 ? 0 : s;
          jamesTotal += james[s];
        });
        let avg = total / scores.length;
        let jamesScore = (jamesTotal / scores.length) * 10;
        stats.average = avg;
        stats.jamesScore = jamesScore;
        // console.log(week[1].stats);
        user.wordleGolf[weekNum].stats = week[1].stats;
        console.log(user.wordleGolf[weekNum].stats);
          let newValues = {
            $set: {
              wordleGolf: user.wordleGolf
            },
        };

        updateScores(newValues,username)
        




      });
    });
  });
};

const updateScores = async(newValues, username, id) => {
  await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB has been connected"))
    .catch((error) => {
      console.log(error);
    });
  const db = mongoose.connection;
  const collection = db.collection("Wordle");
  collection.updateOne(
    { user: username },
    newValues,
    { upsert: true },
    (err, res) => {
      console.log(res);
      if (err) throw err;
    }
  );
}
calcStats();
