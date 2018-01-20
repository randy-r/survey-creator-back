const express = require('express')
const {
  createSurvey,
  getAll,
  getById
} = require('../repos/surveys');

const router = express.Router()

router.post('/', function (req, res) {
  const body = req.body
  console.log(body);
  createSurvey(body, createdSurvey => res.json(createdSurvey))
  console.log('Created survey.');
})

router.get('/', function (req, res) {
  getAll(all => res.json(all));
})

router.get('/:id', (req, res) => {
  getById(req.params.id, entity => res.json(entity));
});

module.exports = router