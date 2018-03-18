const express = require('express')
const { 
  create,
  getAll
} = require('../repos/answer-templates');

const router = express.Router()


router.use(function (req, res, next) {
  // TODO req.user - isAdmin check
  next()
});

router.post('/', function (req, res) {
  const body = req.body
  create(body, created => res.json(created) )
})

router.get('/', function (req, res) {
  getAll(all => res.json(all));
})

module.exports = router