const express = require('express');
const jwt = require('jsonwebtoken');
const {
  create,
  getAll,
  getById
} = require('../repos/questionnaires');

const router = express.Router()

router.post('/', function (req, res) {
  const body = { ...req.body };
  create(body, created => {
    res.json(created)
  });
})

router.get('/', function (req, res) {
  getAll(all => res.json(all));
})


router.get('/:id', (req, res) => {
  const { id } = req.params;
  if (req.user.isAdmin) {
    getById(id, entity => res.json(entity));
  } else if (req.user && req.user.survey.questionaresIDsAndTypes.find(v => v.id === id)) {
    getById(id, entity => res.json(entity));
  } else {
    res.status(401).send(`Your survey session does not contain the questionnaire at id ${id}.`);
  }
});

module.exports = router