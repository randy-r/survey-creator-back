const { scheduleJob } = require('node-schedule');
const google = require('googleapis');

const { getById } = require('../repos/surveys');
const { getAdminUser } = require('../repos/admin-user');
const { sendEmail } = require('../utils/emails');
const {
  CLIENT_ID, CLIENT_SECRET,
  REDIRECT_URL, SURVEY_URL } = require('../utils/auth');
const resultsRepo = require('../repos/results');
const surveysRepo = require('../repos/surveys');

const OAuth2 = google.auth.OAuth2;

exports.registerFollowUpEmailJob = (email, followUpDate, currentServeyId, followUpSurveyId) => {
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

exports.registerAllFollowUpEmailJobs = () => {
  resultsRepo.getAll(results => {
    results.forEach(r => {
      const { email, surveys } = r;
      surveys.forEach(s => {
        const { followUpDateInfo } = s;
        if (followUpDateInfo && (followUpDateInfo.date > Date.now())) {
          exports.registerFollowUpEmailJob(email, followUpDateInfo.date, s.id, followUpDateInfo.surveyId);
        }
      });
    });
  });
};
