const express = require('express');
const jwt = require('jsonwebtoken');

const { saveSurveyEntry } = require('../repos/results');
const { getJwtSecret } = require('../utils/auth');
const { registerFollowUpEmailJob } = require('./emailer');

const router = express.Router();

const mapToSurveyEntry = (user, questionnairesResults, followUpDate) => {
  const {
    firstName,
    lastName,
    gender,
    email,
    age,
    survey,
    educationLevel,
  } = user;

  const { followUpInfo } = survey

  return {
    user: {
      email,
      firstName,
      lastName,
      gender,
      age,
      educationLevel,
    },
    survey: {
      id: survey.id,
      questionnaires: questionnairesResults,
      rational: survey.rational,
      followUpDateInfo: followUpInfo ? {
        date: followUpDate,
        surveyId: followUpInfo.surveyId,
      } : null,
    }
  };
};

router.post('/begin-survey-session', function (req, res) {
  const body = req.body;
  const token = jwt.sign(body, getJwtSecret());
  res.json(token);
})



router.post('/end-survey-session', function (req, res) {
  const body = req.body;
  const { questionnairesResults, surveyId } = body;
  const user = req.user;

  const { followUpInfo } = user.survey;
  let followUpDate = null;
  if (followUpInfo) {

    const { followUpMilliseconds } = followUpInfo;
    /*
    user.survey {
      followUpInfo:Object { surveyId: "5a75d62a02e56079ac6a3117", followUpMilliseconds: 180120000}
      id:"5a92cc0c35956e726f6f1e0a"
      questionaresIDsAndTypes:Array(2) [Object, Object]
      rational:false
    }
    */

    // transform the offset into the actual date
    followUpDate = new Date(Date.now() + followUpMilliseconds);

    // no real reason for waiting for the email job
    registerFollowUpEmailJob(user.email, followUpDate, user.survey.id, followUpInfo.surveyId);
  }

  const surveyEntry = mapToSurveyEntry(user, questionnairesResults, followUpDate);

  // the fake qs are not saved in the db
  saveSurveyEntry(surveyEntry, () => {
    res.json({});
  });
})

module.exports = router;