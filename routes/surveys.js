
const express = require('express');
const jwt = require('jsonwebtoken');

const {
  createSurvey,
  getAll,
  getById,
  getByIdWithQs
} = require('../repos/surveys');
const { getJwtSecret } = require('../utils/auth');
const logger = require('../utils/logger');

const router = express.Router()

router.post('/', function (req, res) {
  const surveyData = req.body
  const { emailAddress } = req.user;
  surveyData.adminEmail = emailAddress;
  createSurvey(surveyData, createdSurvey => res.json(createdSurvey))
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

const extractUser = req => {
  let token;
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  }
  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (err) {
    // err
  }
  return decoded;
}

const assignFakeQFromIndexIfAny = (surveyEntity, chosenIndex) => {
  // randomly choose one of the two FQs
  const { questionaresIDsAndTypes } = surveyEntity;
  const fakes = questionaresIDsAndTypes.filter(info => info.type === 'fake');

  if (fakes.length === 2) {
    // by convention, first is rational
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
    surveyEntity.questionaresIDsAndTypes = newQIDsAndTypes;
    surveyEntity.rational = chosenIndex === 0;
  } else if (fakes.length === 0) {
    surveyEntity.rational = null;
  } else {
    throw new Error(`Invalid fake questionare number: ${fakes.length}!`);
  }

}

router.get('/:id/take-shape', (req, res) => {
  const user = extractUser(req);
  const userHasTokenAlready = !!user;

  getById(req.params.id, entity => {
    let chosenIndex;
    if (userHasTokenAlready)
    {
      switch (user.survey.rational) {
        case null:
          chosenIndex = null; // the assignFakeQFromIndexIfAny will work because it is a normall survey with 0 fakes
          break;
        case true:
          chosenIndex = 0;
          break;
        case false:
          chosenIndex = 1;
          break;
        default:
          throw new Error('Invalid value for user.survey.rational');
      }
    } else { // paricipant is here for the first time, must be assign a fakeq
      chosenIndex = (Math.random() < 0.5) ? 0 : 1;
    }
    assignFakeQFromIndexIfAny(entity, chosenIndex);
    res.json(entity);
  });
});

module.exports = router