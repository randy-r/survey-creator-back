const express = require('express')
const {
  create,
  getAll,
  getById
} = require('../repos/fake-questionaires');

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
  getById(req.params.id, entity => res.json(entity));
});

module.exports = router