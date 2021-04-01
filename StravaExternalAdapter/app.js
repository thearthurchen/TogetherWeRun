const {
  createAthleteActivityRequest,
  createRefreshTokenRequest
} = require('./index');

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.EA_PORT || 8080

app.use(bodyParser.json());

app.post('/get_athlete_activity/:id', (req, res) => {
  console.log('POST Data: ', req.body)
  const { id } = req.params

  res.status(200).json({
    requestId: 123,
    distance: 100,
    id,
    timestamp: Date.now()
  });

  // createAthleteActivityRequest({ id }, (status, result) => {
  //   console.log('Result: ', result)

  //   if (status === 400) {
  //     createRefreshTokenRequest()
  //   }

  //   const { distance } = result.all_run_totals || {}
  //   if (!distance) {
  //     return res.status(404).json(result)
  //   }

  //   res.status(200).json({
  //     distance,
  //     id,
  //     timestamp: Date.now() // TODO
  //   })
  // })
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
