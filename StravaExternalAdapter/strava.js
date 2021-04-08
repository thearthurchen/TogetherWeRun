const dynamoose = require("dynamoose");
const moment = require("moment");

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
  },
  { create: false }
);

const createAthleteActivityRequest = async (accessToken, timestamp) => {
  const todayStart = moment(timestamp).startOf("day").unix();
  const now = moment(timestamp).unix();

  const config = {
    url: `https://www.strava.com/api/v3/athlete/activities`,
    params: {
      before: now,
      after: todayStart,
    },
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
  };

  Requester.request(config, customError)
    .then((response) => {
      const distance = response.data
        .filter((item) => item.type === "Run")
        .reduce((target, item) => {
          return (target += +item.distance);
        }, 0);

      return { distance };
    })
    .catch((error) => {
      throw new Error(error);
    });
};

const createRefreshTokenRequest = async (userAddress, timestamp) => {
  // get current user refresh token from DB
  stravaUsers
    .get(userAddress)
    .then((res) => {
      const { userID } = res;

      const config = {
        url: "https://www.strava.com/oauth/token",
        params: {
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          refresh_token: res.refreshToken,
          grant_type: "refresh_token",
        },
        method: "post",
      };

      Requester.request(config, customError)
        .then((response) => {
          const { data } = response || {};
          if (!data || !data.refresh_token || !data.access_token) {
            throw new Error("no tokens on response");
          }

          // update user refresh token and access token
          stravaUsers
            .update({
              userAddress,
              refreshToken: response.data.refresh_token,
              accessToken: response.data.access_token,
            })
            .then((res) => {
              return { accessToken };
            })
            .catch(500, (error) => {
              throw new Error(error);
            });
        })
        .catch((error) => {
          throw new Error(error);
        });
    })
    .catch(500, (error) => {
      throw new Error(error);
    });
};

exports.getStravaDistance = async (user, timestamp) => {
  const { accessToken } = await createRefreshTokenRequest(user);
  const { distance } = await createAthleteActivityRequest(
    timestamp,
    accessToken
  );
  return distance;
};
