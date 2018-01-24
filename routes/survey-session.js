const express = require('express');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/auth');

const router = express.Router();

router.post('/begin-survey-session', function (req, res) {
  const body = req.body;
  console.log('begin session data: ', body);

  const token = jwt.sign(body, getJwtSecret());
  res.json(token);
})


router.post('/end-survey-session', function (req, res) {
  const body = req.body;
  console.log('end session data: ', body);
  const { allItemAnswers} = body;
  const user = req.user;
  res.json({ done: true });
})

module.exports = router;