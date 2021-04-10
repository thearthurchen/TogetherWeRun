const { createRequest, createNewUserRequest } = require("./index");

const { createNewUser } = require("./strava");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.EA_PORT || 8080;

app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/", (req, res) => {
  console.log("POST Data: ", req.body);
  createRequest(req.body, (status, result) => {
    console.log("Result: ", result);
    res.status(status).json(result);
  });
});

app.post("/create-new-user", async (req, res) => {
  try {
    const { userAddress, accessCode } = req.body;
    await createNewUser(userAddress.toLowerCase(), accessCode);
    res.json({ message: "good shit" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

app.listen(port, () => console.log(`Listening on port ${port}!`));
