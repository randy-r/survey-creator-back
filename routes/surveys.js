const express = require('express')
const {
  createSurvey,
  getAll,
  getById,
  getByIdWithQs
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
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const { includeQuestionnaires } = req.query;
  const callback = survey => res.json(survey);

  if (req.query.includeQuestionnaires === 'true') {
    getByIdWithQs(id, callback);
    return;
  }
  getById(id, callback);
});

router.get('/:id/take-shape', (req, res) => {
  getById(req.params.id, entity => {
    // randomly choose one of the two FQs
    const { questionaresIDsAndTypes } = entity;
    const fakes = questionaresIDsAndTypes.filter(info => info.type === 'fake');
    // by convention, first is rational
    const chosenIndex = Math.random() < 0.5 ? 0 : 1;
    const fakeToShow = fakes[chosenIndex];
    const newQIDsAndTypes = questionaresIDsAndTypes.filter(info => {
      if (info.type === 'valid') {
        return true;
      }
      if (info === fakeToShow) {
        return true;
      }
      return false;
    });
    entity.questionaresIDsAndTypes = newQIDsAndTypes;
    entity.rational = chosenIndex === 0;
    res.json(entity)
  });
});

module.exports = router