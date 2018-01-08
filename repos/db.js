const { MongoClient } = require('mongodb');


// keep the db as a singleton dependecy
let _db;

console.log('--------------')

exports.connectToDB = (callback) => {
  const dbName = 'survey-creator';
  MongoClient.connect('mongodb://localhost:27017', (err, client) => {
    if (err) throw new Error('Got error on mongo connection!')
    console.log("Connected successfully to MongoDB server");
    _db = client.db(dbName);
    callback();
  });
}

exports.provideDB = () => {
  if (!_db) throw new Error('No connection to DB established!')
  return _db;
}