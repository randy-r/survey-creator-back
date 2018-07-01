const express = require('express')
const {
  create,
  getAll,
  getById
} = require('../repos/fake-questionaires');
const shuffle = require('../utils/shuffle');

const router = express.Router()

router.post('/', function (req, res) {
  const body = req.body
  create(body, created => {
    res.json(created)
  })
});

router.get('/', function (req, res) {
  getAll(all => res.json(all));
});

router.get('/:id', (req, res) => {
  getById(req.params.id, entity => {
    entity.trickitems.forEach(trickItem => {
      const { answersPool, correctAnswersPool } = trickItem;
      trickItem.allAnswersShuffled = shuffle(answersPool.concat(correctAnswersPool));
    })
    entity.trickitems = shuffle(entity.trickitems); // the order is not important as this trickitems do not end up in results
    res.json(entity);
  });
});

module.exports = router