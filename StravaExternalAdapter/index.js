/* eslint-disable standard/no-callback-literal */
const { Requester, Validator } = require('@chainlink/external-adapter');
// const dynamoose = require('dynamoose');

// dynamoose.aws.sdk.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.REGION
// });

// const stravaUsers = dynamoose.model('StravaUsers', {
//   userAddress: String,
//   accessToken: String,
//   refreshToken: String,
//   userID: String
// }, { create: false });

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

const createAthleteActivityRequest = (input, cb) => {
  const customParams = {
    id: true
  }

  const validator = new Validator(cb, input, customParams)
  const { data: { id: userID, userAddress }, id: jobRunID } = validator.validated;

  const config = {
    url: `https://www.strava.com/api/v3/athletes/${userID}/stats`,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${process.env.ACCESS_TOKEN}`
    }
  }

  // DB connection (TODO)
  stravaUsers.get(userAddress)
    .then(res => console.log(res));

  Requester.request(config, customError)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, [tsyms])
      cb(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      cb(500, Requester.errored(jobRunID, error))
    })
}

const createRefreshTokenRequest = (input, callback) => {
  // Define custom parameters to be used by the adapter.
  // Extra parameters can be stated in the extra object,
  // with a Boolean value indicating whether or not they
  // should be required.
  const customParams = {
    refresh_token: true
  }

  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(callback, input, customParams)

  const { data: { refresh_token: refreshToken }, id: jobRunID } = validator.validated

  const config = {
    url: 'https://www.strava.com/oauth/token',
    params: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    },
    method: 'post'
  }

  // TODO: update user access token
  Requester.request(config, customError)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, [tsyms])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

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
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    })
  })
}

// This allows the function to be exported for testing
// or for running in express
module.exports = {
  createAthleteActivityRequest,
  createRefreshTokenRequest,
  gcpservice,
  handler,
  handlerv2
}
