exports.getJwtSecret = () => process.env.JWT_SECRET;

exports.CLIENT_ID = process.env.CLIENT_ID;
exports.CLIENT_SECRET = process.env.CLIENT_SECRET;
exports.REDIRECT_URL = `${process.env.HOST}/oauthcallback`;
exports.SURVEY_URL = `${process.env.HOST}/user`;


// not used yet, but saving it in the code base
exports.refreshGmailTokens = (oauth2Client, callback) => {
  oauth2Client.refreshAccessToken(function (e, newtokens) {
    // your access_token is now refreshed and stored in oauth2Client
    // store these new tokens in a safe place (e.g. database)
    callback(e, newtokens);
  });
};


// not used yet, but saving it in the code base
const google = require('googleapis');
exports.getUserInfo = (oauth2Client, callback) => {
  const oauth2 = google.oauth2({
    version: 'v1',
    auth: oauth2Client
  });

  oauth2.userinfo.get({
    userId: 'me'
  }, (er, re) => {
    callback(er, re);
  });
}
