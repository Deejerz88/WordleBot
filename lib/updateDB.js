const mongoose = require("mongoose");

const updateDB = async (
  numGames,
  avg,
  jamesScore,
  dist,
  gScores,
  username,
  id
) => {
  let newValues = {
    $set: {
      games: numGames,
      average: Number(avg),
      jamesScore: Number(jamesScore),
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
};

module.exports = updateDB;
