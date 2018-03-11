const { ObjectID } = require('mongodb');

const { provideDB } = require('./db');
const { adjustObjectId } = require('./utils');

const collName = 'results';
const aoid = adjustObjectId;

const convertIdsToObjectIds = survey => {
  const { id, questionnaires, ...rest } = survey;
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
    }),
    ...rest,
  }
}

exports.saveSurveyEntry = (entry, callback) => {
  const db = provideDB();
  const { user, survey } = entry;
  const mappedSurvey = convertIdsToObjectIds(survey);
  // prefetch at provided e-mail
  // TODO might want to use the 'upsert' option on findOneAndUpdate

  db.collection(collName).findOneAndUpdate(
    {
      email: user.email
    },
    {
      $push: { surveys: mappedSurvey }
    },
    {
      returnOriginal: false
    }).then(r1 => {
      const updatedResult = r1.value;
      if (updatedResult === null) {
        const toInsert = {
          ...user,
          surveys: [mappedSurvey]
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
};

exports.getAllAtSurveyIds = ids => {
  const db = provideDB();

  const objectids = ids.map(id => new ObjectID(id));

  return db.collection(collName)
    .aggregate([
      {
        $unwind: {
          path: '$surveys',
        }
      },
      {
        $match: {
          "surveys.id": { $in: objectids }
        }
      },
      {
        $project: {
          survey: '$surveys',
          firstName: 1,
          lastName: 1,
          email: 1,
          age: 1,
          gender: 1,
        }
      }
    ]) // aggregate
    .toArray()
    .then(array => {
      return array;
    })
    .catch(e => {
      console.error(e);
    })
};