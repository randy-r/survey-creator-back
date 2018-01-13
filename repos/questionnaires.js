const { provideDB } = require('./db');
const { adjustObjectId } = require('./utils');

const collName = 'questionneres';
const aoid = adjustObjectId;

exports.create = (entity, callback) => {
  const db = provideDB();

  db.collection(collName).insert(entity)
    .then(result => callback(aoid(result.ops[0])))
    .catch(x => console.log('error', x)
    );
};

exports.getAll = callback => {
  const db = provideDB();

  db.collection(collName).find({})
    .toArray()
    .then(results => {
      console.log(results)
      callback(results.map(s => aoid(s)))
    })
    .catch(x => console.log('error', x)
    );
}