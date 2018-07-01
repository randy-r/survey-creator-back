const { ObjectID } = require('mongodb');

const { provideDB } = require('./db');
const { adjustObjectId } = require('./utils');
const logger = require('../utils/logger');

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
  mappedSurvey.dateTaken = new Date(Date.now());
  // prefetch at provided e-mail
  // TODO might want to use the 'upsert' option on findOneAndUpdate

  // TODO check if there is already a survey in the result at that id and deny the new one 
  db.collection(collName).findOne({
    "surveys.id": mappedSurvey.id,
    email: user.email,
  })
    .then(existing => {
      if (existing) {
        callback(null, { msg: `User ${user.email} already took the survey ${mappedSurvey.id}!` })
      } else {
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
                  logger.error('error', x);
                });
            } else {
              // else: result is already updated
              callback(aoid(updatedResult))
            }
          });

      } // else
    })
    .catch(x => {
      logger.error('error', x);
    });

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
          educationLevel: 1,
        }
      }
    ]) // aggregate
    .toArray()
    .then(array => {
      return array;
    })
    .catch(e => {
      logger.error(e);
    })
};

exports.getParticipantAtId = (id, callback) => {
  const db = provideDB();
  db.collection(collName).findOne({ _id: new ObjectID(id) })
    .then(result => (result ? callback(aoid(result)) : callback(null)))
    .catch(x => logger.error(x))
    ;
};

exports.getFollowUpFor = (email, surveyId) => {
  const db = provideDB();


  return db.collection(collName)
    .aggregate([
      {
        $unwind: {
          path: '$surveys',
        }
      },
      {
        $match: {
          "surveys.id": new ObjectID(surveyId),
          "email": email
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
          educationLevel: 1,
        }
      }
    ]) // aggregate
    .toArray()
    .then(array => {
      if (array.length > 1) {
        throw new Error(`There are more than 1 results in db with email ${email} and taken survey id ${surveyId}!`);
      } else if (array.length === 0) {
        return null;
      }
      return array[0];
    })
    .catch(e => {
      logger.error(e);
    })
}