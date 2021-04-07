/* eslint-disable standard/no-callback-literal */
const { Requester, Validator } = require('@chainlink/external-adapter');
const dynamoose = require('dynamoose');
const moment = require('moment');

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
    accessToken: true,
    timestamp: true
  };

  const validator = new Validator(cb, input, customParams)
  const { data: { id: userID, accessToken, timestamp }, id: jobRunID } = validator.validated;

  const todayStart = moment(timestamp).startOf('day').unix();
  const now = moment(timestamp).unix();
  
  const config = {
    url: `https://www.strava.com/api/v3/athlete/activities`,
    params: {
      before: now,
      after: todayStart
    },
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${accessToken}`
    }
  }

  Requester.request(config, customError)
    .then(response => {
      const distance = response.data
        .filter(item => item.type === 'Run')
        .reduce((target, item) => {
          return target += +item.distance
        }, 0)

      Object.assign(response, {
        data: {
          result: {
            distance
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
              response.data.result = {
                accessToken: response.data.access_token,
                userID
              }

              cb(response.status, Requester.success(jobRunID, response))
            })
            .catch(500, error => {
              cb(500, Requester.errored(jobRunID, error));
            });
        })
        .catch(error => {
          cb(500, Requester.errored(jobRunID, error));
        })
    })
    .catch(500, error => {
      cb(500, Requester.errored(jobRunID, error));
    });
}

const createNewUserRequest = (input, cb) => {
  const customParams = {
    accessCode: true
  }
  const validator = new Validator(cb, input, customParams)
  const { data: { accessCode }, id: jobRunID } = validator.validated

    const config = {
      url: 'https://www.strava.com/oauth/token',
      params: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: accessCode,
        grant_type: 'authorization_code'
      },
      method: 'post'
    }

    Requester.request(config, customError)
      .then(response => {
        if (!response || !response.data || !response.data.athlete) {
          return cb(500, Requester.errored(jobRunID, 'no athlete data found'));
        }

        const { athlete: { username, firstname, id }, refresh_token, access_token } = response.data;

        // create new user
        const newUser = new stravaUsers({
          userAddress: username || firstname,
          accessToken: access_token,
          refreshToken: refresh_token,
          userID: '' + id
        })
        newUser.save()
          .then(res => {
            cb(response.status, res)
          })
          .catch(500, error => {
            cb(500, Requester.errored(jobRunID, error));
          });
      })
      .catch(error => {
        cb(500, Requester.errored(jobRunID, error));
      })
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
  createNewUserRequest,
  gcpservice,
  handler,
  handlerv2
};
