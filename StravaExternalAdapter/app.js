/* eslint-disable no-mixed-operators */
const {
  createAthleteActivityRequest,
  createRefreshTokenRequest
} = require('./index');

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.EA_PORT || 8080

app.use(bodyParser.json());

app.post('/get-athlete-activity/:id', (req, res) => {
  const { id } = req.params

  createRefreshTokenRequest({ data: { userAddress: id } }, (status, result) => {
    const { jobRunID, data, result: { accessToken, userID }, statusCode } = result || {};

    // console.log('refresh token request result', accessToken);

    createAthleteActivityRequest({ data: { id: userID, accessToken } }, (status, result) => {
      // console.log('Result: ', result.data.result.distance);

      const { distance } = result.data.result || {};

      if (isNaN(distance) && !distance) {
        return res.status(404).json(result)
      }

      res.status(200).json({
        distance,
        id,
        timestamp: Date.now() // TODO
      });
    });
  });
});

app.listen(port, () => console.log(`Listening on port ${port}!`))
