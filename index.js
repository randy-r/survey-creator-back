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

  app.use('/surveys', surveysRouter)
  app.use('/questionnaires', questionnaireRouter)
  app.use('/items', itemsRouter)
  app.use('/fakequestionnaires', fakeQuestionnaireRouter)
  app.use('/trickitems', trickItemsRouter)
  app.use('/answertemplates', answerTemplatesRouter)

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    console.log('*');
    res.sendFile(path.join(__dirname + '/client/build/index.html'));
  });

  const port = process.env.PORT || 5111;
  app.listen(port);

  console.log(`Express server listening on ${port}`);

});
