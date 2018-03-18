const express = require('express');
const jwt = require('jsonwebtoken');
const { getAdminUser, updateAdminUser } = require('../repos/admin-user');
const { sendEmail } = require('../utils/emails');
const { getJwtSecret, CLIENT_ID, CLIENT_SECRET, REDIRECT_URL } = require('../utils/auth');
const logger = require('../utils/logger');

const btoa = require('btoa');

const google = require('googleapis');

const OAuth2 = google.auth.OAuth2;


const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly'
];

const router = express.Router()


router.get('/oauthcallback', (req, res) => {
  const { code } = req.query;

  const oauth2Client = new OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
  );

  oauth2Client.getToken(code, function (err, tokens) {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (!err) {
      /*
      access_token,
      expiry_date:1517740034110,
      id_token:,
      refresh_token,
      token_type:"Bearer"
      */
      oauth2Client.setCredentials(tokens);
      const gmail = google.gmail({
        version: 'v1',
        auth: oauth2Client
      });

      gmail.users.getProfile({
        userId: 'me'
      }, (er, re) => {
        if (!er) {
          const { data: { emailAddress } } = re;
          const refreshToken = tokens.refresh_token;

          const dbCallback = user => {
            // create application specific jwt and redirect
            const tokenContent = {
              emailAddress,
              isAdmin: true,
            };
            const token = jwt.sign(tokenContent, getJwtSecret());
            res.redirect(`/setsession/${token}`);
          };

          if (refreshToken) {
            // refresh_token should be present at first login, so it will populate the value in db (initially is null)
            updateAdminUser({ email: emailAddress, gmailTokens: tokens }, dbCallback);
          } else {
            // valid user is persisted in db already
            getAdminUser(emailAddress, dbCallback);
          }
        }
      })

    } // if(!err)
  }); // getToken
}); // get('/oauthcallback'

router.get('/login', (req, res) => {
  const oauth2Client = new OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
  );
  const authUrl = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',

    // If you only need one scope you can pass it as a string
    scope: scopes,

    // Optional property that passes state parameters to redirect URI
    // state: 'foo'
  });
  res.redirect(authUrl);
});

router.get('/setsession/:jwt', (req, res) => {
  const { jwt } = req.params;
  logger.info('/setsession/:jwt', jwt);
  res.send(
    `<script>
    window.onload = () => {
      console.log('onload');
      localStorage.setItem('access_token', '${jwt}');
      window.location = '/admin/';
    }
    </script>`
  );
});

module.exports = router