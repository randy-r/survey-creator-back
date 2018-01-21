const { ObjectID } = require('mongodb');

const { provideDB } = require('./db');
const { adjustObjectId } = require('./utils');


const collName = 'surveys';
const aoid = adjustObjectId;

exports.createSurvey = (survey, callback) => {
  survey.participantUrl = 'something';
  const db = provideDB();

  db.collection(collName).insert(survey)
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

exports.getById = (id, callback) => {
  const db = provideDB();
  db.collection(collName).findOne({ _id: new ObjectID(id) })
    .then(result => callback(aoid(result)))
    .catch(x => console.log('error', x)
    );
}