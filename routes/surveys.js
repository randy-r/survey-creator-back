const express = require('express')
const { 
  createSurvey,
  getAll
} = require('../repos/surveys');

const router = express.Router()

router.post('/', function (req, res) {
  const body = req.body
  console.log(body);
  createSurvey(body, createdSurvey => res.json(createdSurvey) )
  console.log('Created survey.');
})

router.get('/', function (req, res) {
  getAll(all => res.json(all));
})

module.exports = router