const btoa = require('btoa');
const google = require('googleapis');


exports.sendEmail = (oauth2Client, mailObject, callback) => {
  const { to, subject, message } = mailObject;

  const gmail = google.gmail({
    version: 'v1',
    auth: oauth2Client
  });

  const raw = btoa(
    // `From: ${from}\r\n` + // is not relevant with gmail
    `To: ${to}\r\n` +
    `Subject: ${subject} \r\n\r\n` +

    `${message}`
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  gmail.users.messages.send({
    'userId': 'me',
    'resource': {
      'raw': raw
    }
  }, (er, re) => {
    callback(er, re);
  });
};
