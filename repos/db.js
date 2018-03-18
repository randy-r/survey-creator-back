const { MongoClient } = require('mongodb');

const logger = require('../utils/logger');

// keep the db as a singleton dependecy
let _db;
let _client;

exports.connectToDB = (callback) => {
  const dbName = 'survey-creator';
  MongoClient.connect('mongodb://localhost:27017', (err, client) => {
    if (err) throw new Error('Got error on mongo connection!')
    logger.info("Connected successfully to MongoDB server.");
    _db = client.db(dbName);
    _client = client;
    callback();
  });
}

exports.provideDB = () => {
  if (!_db) throw new Error('No connection to DB established!')
  return _db;
}

process.on('SIGINT', () => {
  _client.close()
    .then(() => {
      logger.info('MongoClient connection closed.');
      process.exit();
    })
    .catch(e => {
      logger.error('Error at closing MongoClient connection: ', e);
      process.exit();      
    });
});
