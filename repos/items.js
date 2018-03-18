const { provideDB } = require('./db');
const { adjustObjectId } = require('./utils');
const logger = require('../utils/logger');

const collName = 'items';
const aoid = adjustObjectId;

exports.create = (entity, callback) => {
  const db = provideDB();

  db.collection(collName).insert(entity)
    .then(result => callback(aoid(result.ops[0])))
    .catch(x => logger.error(x)
    );
};

exports.getAll = callback => {
  const db = provideDB();

  db.collection(collName).find({})
    .toArray()
    .then(results => {
      callback(results.map(s => aoid(s)))
    })
    .catch(x => logger.error(x)
    );
}