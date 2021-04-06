/* eslint-disable standard/no-callback-literal */
const { Requester, Validator } = require('@chainlink/external-adapter');
const dynamoose = require('dynamoose');

// #region DB setup
dynamoose.aws.sdk.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.REGION
});

const stravaUsers = dynamoose.model('StravaUsers', {
  userAddress: String,
  accessToken: String,
  refreshToken: String,
  userID: String
}, { create: false });
// #endregion

// #region endpoints
// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
  if (data.Response === 'Error') {
    return true;
  }

  return false;
}

const createAthleteActivityRequest = (input, cb) => {
  const customParams = {
    id: true,
    accessToken: true
  };

  const validator = new Validator(cb, input, customParams)
  const { data: { id: userID, accessToken }, id: jobRunID } = validator.validated;

  // console.log('userID: ', userID, ' accessToken: ', accessToken);

  const config = {
    url: `https://www.strava.com/api/v3/athletes/${userID}/stats`,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${accessToken}`
    }
  }

  Requester.request(config, customError)
    .then(response => {
      // console.log(response.data);
      Object.assign(response, {
        data: {
          result: {
            distance: response.data.all_run_totals.distance,
            userID
          }
        }
      });

      cb(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      cb(500, Requester.errored(jobRunID, error))
    })
}

const createRefreshTokenRequest = (input, cb) => {
  const customParams = {
    userAddress: true
  }
  const validator = new Validator(cb, input, customParams)
  const { data: { userAddress }, id: jobRunID } = validator.validated

  // get current user refresh token from DB
  stravaUsers.get(userAddress)
    .then(res => {
      const userID = res.userID;

      const config = {
        url: 'https://www.strava.com/oauth/token',
        params: {
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          refresh_token: res.refreshToken,
          grant_type: 'refresh_token'
        },
        method: 'post'
      }

      Requester.request(config, customError)
        .then(response => {
          const { data } = response || {};
          if (!data || !data.refresh_token || !data.access_token) {
            return cb(500, Requester.errored(jobRunID, 'no tokens on response'));
          }

          // update user refresh token and access token
          stravaUsers.update({
            userAddress,
            refreshToken: response.data.refresh_token,
            accessToken: response.data.access_token
          })
            .then(res => {
              // console.log(res);
              response.data.result = {
                accessToken: response.data.access_token,
                userID
              }

              cb(response.status, Requester.success(jobRunID, response))
            })
            .catch(500, error => {
              // console.log(error, 'error on DB update')
              cb(500, Requester.errored(jobRunID, error));
            });
        })
        .catch(error => {
          // console.log(error, 'error on request');
          cb(500, Requester.errored(jobRunID, error));
        })
    })
    .catch(500, error => {
      // console.log(error, 'error on DB access')
      cb(500, Requester.errored(jobRunID, error));
    });
}
// #endregion

// #region wrapper functions
// This is a wrapper to allow the function to work with
// GCP Functions
const gcpservice = (req, res) => {
  // createRequest(req.body, (statusCode, data) => {
  //   res.status(statusCode).send(data)
  // })
}

// This is a wrapper to allow the function to work with
// AWS Lambda
const handler = (event, context, callback) => {
  // createRequest(event, (statusCode, data) => {
  //   callback(null, data)
  // })
}

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
const handlerv2 = (event, context, callback) => {
  // createRequest(JSON.parse(event.body), (statusCode, data) => {
  //   callback(null, {
  //     statusCode: statusCode,
  //     body: JSON.stringify(data),
  //     isBase64Encoded: false
  //   })
  // })
}
// #endregion

module.exports = {
  createAthleteActivityRequest,
  createRefreshTokenRequest,
  gcpservice,
  handler,
  handlerv2
};
