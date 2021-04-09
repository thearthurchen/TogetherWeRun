const { createRequest, createNewUserRequest } = require('./index');

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.EA_PORT || 8080

app.use(bodyParser.json())

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/', (req, res) => {
  console.log('POST Data: ', req.body)
  createRequest(req.body, (status, result) => {
    console.log('Result: ', result)
    res.status(status).json(result)
  })
})

app.post('/create-new-user', (req, res) => {
  const { code: accessCode } = req.body
  console.log('CREATE NEW USER: ', accessCode)
  createNewUserRequest(accessCode, (result) => {
    if (result.status !== 200) {
      console.log('CREATE NEW USER ERROR: ', result.status || 400)
      return res.status(result.status || 400).json('create user error');
    }

    console.log('CREATE NEW USER SUCCESS: ', result.status)
    return res.status(200).json('create user success');
  });
});

app.listen(port, () => console.log(`Listening on port ${port}!`))
