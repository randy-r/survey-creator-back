const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejwt = require('express-jwt');
require('dotenv').config();

const { getJwtSecret } = require('./utils/auth');
const surveysRouter = require('./routes/surveys');
const questionnaireRouter = require('./routes/questionnaires');
const itemsRouter = require('./routes/items');
const fakeQuestionnaireRouter = require('./routes/fake-questionnaires');
const trickItemsRouter = require('./routes/trick-items')
const answerTemplatesRouter = require('./routes/answer-templates');
const surveySessionRouter = require('./routes/survey-session');
const adminLoginRouter = require('./routes/admin-login');
const { connectToDB, provideDB } = require('./repos/db');


// mongodb service needs to be started beforehand
// $ sudo service mongod start
connectToDB(() => {
  const app = express();

  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, 'client/build')));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use(
    ejwt({
      secret: getJwtSecret(),
      credentialsRequired: true,
      getToken: function fromHeaderOrQuerystring(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
          return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
          return req.query.token;
        }
        return null;
      }
    })
      .unless({
        path: [
          '/api/foo', '/begin-survey-session',
          '/oauthcallback',
          /^\/setsession\/.*/,
          /^\/user\/.*/,
          /^\/admin\/.*/,
          '/login',
          '/login/',
        ]
      })
  );

  app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).send('invalid token...');
    }
  });

  // Put all API endpoints under '/api'
  app.get('/api/foo', (req, res) => {

    // Return them as json
    res.json(['fooA', 'fooB']);

    console.log(`Sent foos.`);
  });

  app.use('/', adminLoginRouter)
  app.use('/api/surveys', surveysRouter)
  app.use('/api/questionnaires', questionnaireRouter)
  app.use('/api/items', itemsRouter)
  app.use('/api/fakequestionnaires', fakeQuestionnaireRouter)
  app.use('/api/trickitems', trickItemsRouter)
  app.use('/api/answertemplates', answerTemplatesRouter)
  app.use('/api', surveySessionRouter)

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('/admin/*', (req, res) => {
    console.log('/admin/*');
    // res.send('<h1>here</h1>');
    res.sendFile(path.join(__dirname + '/client/build/admin/index.html'));
  });

  app.get('/user/*', (req, res) => {
    console.log('/user/*');
    res.sendFile(path.join(__dirname + '/client/build/user/index.html'));
  });

  const port = process.env.PORT || 5111;
  app.listen(port);

  console.log(`Express server listening on ${port}.`);

});


process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
  if (options.cleanup) console.log('Clean exit performed.');
  if (err) console.log(err.stack);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));