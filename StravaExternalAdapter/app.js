const { createRequest, createNewUserRequest } = require('./index');

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.EA_PORT || 8080

app.use(bodyParser.json())

app.post('/', (req, res) => {
  console.log('POST Data: ', req.body)
  createRequest(req.body, (status, result) => {
    console.log('Result: ', result)
    res.status(status).json(result)
  })
})

app.post('/create-new-user', (req, res) => {
  const { code: accessCode } = req.body
  createNewUserRequest(accessCode, (result) => {
    if (result.status !== 200) {
      return res.status(result.status).json('create user error');
    }

    return res.status(200).json('create user success');
  });
});

app.listen(port, () => console.log(`Listening on port ${port}!`))
