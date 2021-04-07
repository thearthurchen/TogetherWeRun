/* eslint-disable no-mixed-operators */
const {
  createAthleteActivityRequest,
  createNewUserRequest,
  createRefreshTokenRequest
} = require('./index');

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.EA_PORT || 8080

app.use(bodyParser.json());

app.post('/get-athlete-activity', (req, res) => {
  const { user, timestamp } = req.body

  createRefreshTokenRequest({ data: { userAddress: user } }, (status, result) => {
    const { jobRunID, data, result: { accessToken, userID }, statusCode } = result || {};

    createAthleteActivityRequest({ data: { id: userID, accessToken, timestamp } }, (status, result) => {
      if (status !== 200) {
        return res.status(status);
      }

      const { distance } = result.data.result || {};

      if (isNaN(distance) && !distance) {
        return res.status(404).json(result)
      }

      res.status(200).json(distance);
    });
  });
});

app.post('/create-new-user', (req, res) => {
  const { code: accessCode } = req.body

  createNewUserRequest({ data: { accessCode } }, (status, result) => {
    if (status !== 200) {
      return res.status(status).json('create user error');
    }

    return res.status(200).json('create user success');
  });
});

app.listen(port, () => console.log(`Listening on port ${port}!`))
