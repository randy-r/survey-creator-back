const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Put all API endpoints under '/api'
app.get('/api/foo', (req, res) => {

  // Return them as json
  res.json(['fooA', 'fooB']);

  console.log(`Sent foos.`);
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  console.log('*');
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

const port = process.env.PORT || 5111;
app.listen(port);

console.log(`Express server listening on ${port}`);