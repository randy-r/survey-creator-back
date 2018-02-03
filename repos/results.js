const { ObjectID } = require('mongodb');

const { provideDB } = require('./db');
const { adjustObjectId } = require('./utils');

const collName = 'results';
const aoid = adjustObjectId;

const convertIdsToObjectIds = survey => {
  return {
    id: new ObjectID(survey.id),
    questionnaires: survey.questionnaires.map(q => {
      return {
        id: new ObjectID(q.id),
        items: q.items.map(a => {
          return {
            id: new ObjectID(a.id),
            answer: a.answer,
          }
        })
      }
    })
  }
}

exports.saveSurveyEntry = (entry, callback) => {
  const db = provideDB();
  const { user, survey } = entry;
  // prefetch at provided e-mail
  // TODO might want to use the 'upsert' option on findOneAndUpdate
  db.collection(collName).findOneAndUpdate(
    {
      email: user.email
    },
    {
      $push: { surveys: survey }
    },
    {
      returnOriginal: false
    }).then(r1 => {
      const updatedResult = r1.value;
      if (updatedResult === null) {
        const toInsert = {
          ...user,
          surveys: [
            convertIdsToObjectIds(survey)
          ]
        };
        db.collection(collName).insert(toInsert)
          .then(r => {
            callback(aoid(r.ops[0]))
          })
          .catch(x => {
            console.log('error', x);
          });
      } else {
        // else: result is already updated
        console.log(updatedResult.surveys);
        callback(aoid(updatedResult))
      }
    });

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