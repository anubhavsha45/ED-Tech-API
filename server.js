require("dotenv").config({ path: "./config.env" });
const app = require("./app");
const mongoose = require("mongoose");

const DB = process.env.MONGO_URL.replace(
  "<db_password>",
  process.env.DB_PASSWORD,
);

mongoose.connect(DB).then(() => {
  console.log("DB connection successfull");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Listening to the port ${PORT}`);
});
