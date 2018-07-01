const { scheduleJob } = require('node-schedule');
const google = require('googleapis');

const { getById } = require('../repos/surveys');
const { getAdminUser, updateAdminUser } = require('../repos/admin-user');
const { sendEmail } = require('../utils/emails');
const {
  CLIENT_ID, CLIENT_SECRET,
  REDIRECT_URL, SURVEY_URL,
  refreshGmailTokens
} = require('../utils/auth');
const { emailSubject, getEmailMessage } = require('../utils/emailContentProvider');
const resultsRepo = require('../repos/results');
const surveysRepo = require('../repos/surveys');
const logger = require('../utils/logger');

const OAuth2 = google.auth.OAuth2;

exports.registerFollowUpEmailJob = (email, userId, followUpDate, currentServeyId, followUpSurveyId) => {
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
        subject: emailSubject,
        message: getEmailMessage(`${SURVEY_URL}/${userId}/take-survey/${followUpSurveyId}`),
      };

      const j = scheduleJob(followUpDate, function () {
        logger.info(`Running registered job for sending email to ${mailObject.to} at the date ${followUpDate.toString()}`);

        // get a new access token based on a refresh token

        refreshGmailTokens(oauth2Client, (refreshErr, newtokens) => {
          updateAdminUser({ email: user.email, gmailTokens: newtokens }, user => {
            sendEmail(oauth2Client, mailObject, (err, res) => {
              if (err) logger.error(`Failed at sending email to ${mailObject.to}.`, err);
              else {
                logger.info(`Successfully send email to ${mailObject.to}.`);
              }
            }); // sendEmail
          }); // updateAdminUser

        }); // refreshGmailTokens
      }); // scheduleJob

    }); // getAdmin
  }); // getById
};

exports.registerAllFollowUpEmailJobs = () => {
  resultsRepo.getAll(results => {
    results.forEach(r => {
      const { email, surveys, id } = r;
      surveys.forEach(s => {
        const { followUpDateInfo } = s;
        if (followUpDateInfo && (followUpDateInfo.date > Date.now())) {
          exports.registerFollowUpEmailJob(email, id.toString(), followUpDateInfo.date, s.id, followUpDateInfo.surveyId);
        }
      });
    });
  });
};
