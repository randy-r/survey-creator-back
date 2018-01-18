const express = require('express')
const { 
  create,
  getAll
} = require('../repos/trick-items');

const router = express.Router()

router.post('/', function (req, res) {
  const body = req.body
  console.log(body);
  create(body, created => res.json(created) )
})

router.get('/', function (req, res) {
  getAll(all => res.json(all));
})

module.exports = router