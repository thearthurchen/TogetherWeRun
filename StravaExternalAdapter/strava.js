const { Requester, Validator } = require("@chainlink/external-adapter");
const dynamoose = require("dynamoose");
const moment = require("moment");

const ARTHUR_ETH_ADDRESS = "0xa2d6c4297Eec8a25226AE0dc77344B0BDEBF442a";
const JASON_ETH_ADDRESS = "0xDBbdbcCeDeEb52Bea5cb0042008458378dB32672";
const ERIC_ETH_ADDRESS = "0xA3a229C36e715d96472d6B317beBf79251e4F485";
const TANNER_ETH_ADDRESS = "0xE1fDb74c4c99F5fba0118D90Ac0b63626637d504";

// #region DB setup
dynamoose.aws.sdk.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

const stravaUsers = dynamoose.model(
  "StravaUsers",
  {
    userAddress: String,
    accessToken: String,
    refreshToken: String,
    userID: String,
    name: String,
  },
  { create: false }
);

// // Keep this for creating users
// const createUser = async () => {
//   await stravaUsers.update({
//     userAddress: TANNER_ETH_ADDRESS,
//     name: "Tanman",
//   });
// };

// createUser();

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
  if (data.Response === "Error") return true;
  return false;
};

const createAthleteActivityRequest = async (accessToken, timestamp) => {
  const todayStart = moment(timestamp).startOf("day").unix();
  const now = moment(timestamp).unix();

  const config = {
    url: `https://www.strava.com/api/v3/athlete/activities`,
    // params: {
    //   before: "1617341344",
    //   after: "",
    // },
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
  };

  const response = await Requester.request(config, customError);
  const distance = response.data
    .filter((item) => item.type === "Run")
    .reduce((target, item) => {
      return (target += +item.distance);
    }, 0);

  return distance;
};

const createRefreshTokenRequest = async (userAddress, timestamp) => {
  const user = await stravaUsers.get(userAddress);
  const config = {
    url: "https://www.strava.com/oauth/token",
    params: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      refresh_token: user.refreshToken,
      grant_type: "refresh_token",
    },
    method: "post",
  };
  const response = await Requester.request(config, customError);
  const { data } = response || {};
  if (!data || !data.refresh_token || !data.access_token) {
    throw new Error("no tokens on response");
  }

  // update user refresh token and access token
  const updatedUser = await stravaUsers.update({
    userAddress,
    refreshToken: response.data.refresh_token,
    accessToken: response.data.access_token,
  });
  return updatedUser.accessToken;
};

const createNewUser = async (userAddress, accessCode) => {
  const config = {
    url: "https://www.strava.com/oauth/token",
    params: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: accessCode,
      grant_type: "authorization_code",
    },
    method: "post",
  };

  const response = await Requester.request(config, customError);
  if (!response || !response.data || !response.data.athlete) {
    throw new Error({
      status: response.status,
      msg: "no athlete data found",
    });
  }

  const {
    athlete: { username, firstname, id },
    refresh_token,
    access_token,
  } = response.data;

  // create new user
  await stravaUsers.create({
    userAddress,
    accessToken: access_token,
    refreshToken: refresh_token,
    userID: "" + id,
  });
};

const getStravaDistance = async (user, timestamp) => {
  const accessToken = await createRefreshTokenRequest(user);
  const distance = await createAthleteActivityRequest(accessToken, timestamp);
  return distance + 1;
};

module.exports = {
  createNewUser,
  getStravaDistance,
};
