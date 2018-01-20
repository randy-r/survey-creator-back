const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const surveysRouter = require('./routes/surveys');
const questionnaireRouter = require('./routes/questionnaires');
const itemsRouter = require('./routes/items');
const fakeQuestionnaireRouter = require('./routes/fake-questionnaires');
const trickItemsRouter = require('./routes/trick-items')
const answerTemplatesRouter = require('./routes/answer-templates');
const { connectToDB } = require('./repos/db');

connectToDB(() => {
  const app = express();

  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, 'client/build')));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // Put all API endpoints under '/api'
  app.get('/api/foo', (req, res) => {

    // Return them as json
    res.json(['fooA', 'fooB']);

    console.log(`Sent foos.`);
  });

  app.use('/api/surveys', surveysRouter)
  app.use('/api/questionnaires', questionnaireRouter)
  app.use('/api/items', itemsRouter)
  app.use('/api/fakequestionnaires', fakeQuestionnaireRouter)
  app.use('/api/trickitems', trickItemsRouter)
  app.use('/api/answertemplates', answerTemplatesRouter)

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('/admin/*', (req, res) => {
    console.log('/admin/*');
    res.sendFile(path.join(__dirname + '/client/build/admin/index.html'));
  });

  app.get('/user/*', (req, res) => {
    console.log('/user/*');
    res.sendFile(path.join(__dirname + '/client/build/user/index.html'));
  });

  const port = process.env.PORT || 5111;
  app.listen(port);

  console.log(`Express server listening on ${port}`);

});
