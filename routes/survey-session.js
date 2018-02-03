const express = require('express');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/auth');
const { saveSurveyEntry } = require('../repos/results');

const router = express.Router();

const mapToSurveyEntry = (user, questionnairesResults) => {
  const {
    firstName,
    lastName,
    gender,
    email,
    age,
    survey,
  } = user;

  return {
    user: {
      email,
      firstName,
      lastName,
      gender,
      age,
      rational: survey.rational,
    },
    survey: {
      id: survey.id,
      questionnaires: questionnairesResults,
    }
  };
};

router.post('/begin-survey-session', function (req, res) {
  const body = req.body;
  console.log('begin session data: ', body);

  const token = jwt.sign(body, getJwtSecret());
  res.json(token);
})


router.post('/end-survey-session', function (req, res) {
  const body = req.body;
  const { questionnairesResults, surveyId } = body;
  const user = req.user;
  console.log('user', JSON.stringify(user));
  console.log('allItemAnswers', JSON.stringify(questionnairesResults));

  const surveyEntry = mapToSurveyEntry(user, questionnairesResults);
  saveSurveyEntry(surveyEntry, () => {
    res.json({});
  });

})

module.exports = router;