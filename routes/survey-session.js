const express = require('express');
const jwt = require('jsonwebtoken');
const { scheduleJob } = require('node-schedule');
const google = require('googleapis');

const { saveSurveyEntry } = require('../repos/results');
const { getById } = require('../repos/surveys');
const { getAdminUser } = require('../repos/admin-user');
const { sendEmail } = require('../utils/emails');
const {
  getJwtSecret, CLIENT_ID, CLIENT_SECRET,
  REDIRECT_URL, SURVEY_URL } = require('../utils/auth');

const OAuth2 = google.auth.OAuth2;
const router = express.Router();

const mapToSurveyEntry = (user, questionnairesResults, followUpDate) => {
  const {
    firstName,
    lastName,
    gender,
    email,
    age,
    survey,
  } = user;

  const { followUpInfo: { followUpMilliseconds, surveyId } } = survey

  return {
    user: {
      email,
      firstName,
      lastName,
      gender,
      age,
    },
    survey: {
      id: survey.id,
      questionnaires: questionnairesResults,
      rational: survey.rational,
      followUpDateInfo: {
        date: followUpDate,
        surveyId,
      }
    }
  };
};

router.post('/begin-survey-session', function (req, res) {
  const body = req.body;
  console.log('begin session data: ', body);

  const token = jwt.sign(body, getJwtSecret());
  res.json(token);
})

const registerFollowUpEmailJob = (email, followUpDate, currentServeyId, followUpSurveyId) => {
  const oauth2Client = new OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
  );

  // get admin who created the survey, pass its credentials
  getById(currentServeyId, (survey) => {
    getAdminUser(survey.adminEmail, (user) => {

      oauth2Client.setCredentials(user.gmailTokens);

      const mailObject = {
        to: email,
        subject: 'follow-up survey',
        message: `Please follow the link to the next survey: ${SURVEY_URL}/${followUpSurveyId} .`
      };

      const j = scheduleJob(followUpDate, function () {
        console.log('go job go.');
        sendEmail(oauth2Client, mailObject, (err, res) => {
          if (err) console.error(err)
          else {
            console.log('send email ', res);
          }
        }); // sendEmail
      }); // scheduleJob

    }); // getAdmin
  }); // getById
};

router.post('/end-survey-session', function (req, res) {
  const body = req.body;
  const { questionnairesResults, surveyId } = body;
  const user = req.user;
  const x = '';
  const { followUpMilliseconds } = user.survey.followUpInfo;
  console.log('user', JSON.stringify(user));
  /*
  user.survey {
    followUpInfo:Object { surveyId: "5a75d62a02e56079ac6a3117", followUpMilliseconds: 180120000}
    id:"5a92cc0c35956e726f6f1e0a"
    questionaresIDsAndTypes:Array(2) [Object, Object]
    rational:false
  }
  */
  console.log('allItemAnswers', JSON.stringify(questionnairesResults));

  // transform the offset into the actual date
  const followUpDate = new Date(Date.now() + followUpMilliseconds);

  // no real reason for waiting for the email job
  registerFollowUpEmailJob(user.email, followUpDate, user.survey.id, user.survey.followUpInfo.surveyId);

  const surveyEntry = mapToSurveyEntry(user, questionnairesResults, followUpDate);

  // the fake qs are not saved in the db
  saveSurveyEntry(surveyEntry, () => {
    res.json({});
  });
})

module.exports = router;