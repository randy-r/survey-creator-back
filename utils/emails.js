const btoa = require('btoa');
const google = require('googleapis');

function makeBody(to, subject, message) {
  var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ", to, "\n",
    "subject: ", subject, "\n\n",
    message, "\n\n",
  ].join('');
  return btoa(str);
}

exports.sendEmail = (oauth2Client, mailObject, callback) => {
  const { to, subject, message } = mailObject;

  const gmail = google.gmail({
    version: 'v1',
    auth: oauth2Client
  });

  const body = makeBody(to, subject, message)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
    ;
  gmail.users.messages.send({
    'userId': 'me',
    'resource': {
      'raw': body
    }
  }, (er, re) => {
    callback(er, re);
  });
};
