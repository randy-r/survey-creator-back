
const { ObjectID } = require('mongodb');

const { provideDB } = require('./db');
const { adjustObjectId } = require('./utils');
const logger = require('../utils/logger');


const collName = 'surveys';
const aoid = adjustObjectId;

exports.createSurvey = (survey, callback) => {
  // this is a frontend presentation concern how it would display a survey at that ID
  // survey.participantUrl = 'something';
  const db = provideDB();
  const { questionaresIDsAndTypes } = survey;
  questionaresIDsAndTypes.forEach(e => e.id = new ObjectID(e.id));

  db.collection(collName).insert(survey)
    .then(result => callback(aoid(result.ops[0])))
    .catch(x => loggers.error(x)
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
};

exports.getById = (id, callback) => {
  const db = provideDB();
  db.collection(collName).findOne({ _id: new ObjectID(id) })
    .then(result => callback(aoid(result)))
    .catch(x => logger.error(x)
    );
};

exports.getByIdWithQs = (id, callback) => {
  const db = provideDB();

  db.collection(collName)
    .aggregate([
      {
        $match: { _id: new ObjectID(id) }
      },
      {
        $lookup: {
          from: 'questionneres',
          localField: 'questionaresIDsAndTypes.id',
          foreignField: '_id',
          as: 'qs'
        },
      },
      {
        $lookup: {
          from: 'fakequestionneres',
          localField: 'questionaresIDsAndTypes.id',
          foreignField: '_id',
          as: 'fqs'
        },
      },
      {
        $project: {
          aqs: { $concatArrays: ['$qs', '$fqs'] },
          name: '$name',
          adminEmail: '$adminEmail',
          questionaresIDsAndTypes: '$questionaresIDsAndTypes',
          followUpInfo: '$followUpInfo',
        }
      },
      {
        $unwind: {
          path: '$aqs',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'items',
          localField: 'aqs.itemsIds',
          foreignField: '_id',
          as: 'aqs.items'
        },
      },
      {
        $lookup: {
          from: 'trickitems',
          localField: 'aqs.trickitemsIds',
          foreignField: '_id',
          as: 'aqs.trickitems'
        },
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          adminEmail: { $first: '$adminEmail' },
          questionaresIDsAndTypes: { $first: '$questionaresIDsAndTypes' },
          followUpInfo: { $first: '$followUpInfo' },
          allQuestionnaires: { $push: '$aqs' },
        }
      }
    ]) // aggregate
    .toArray()
    .then(array => {
      if (array.length === 0) {
        callback(null);
        return;
      }
      const survey = array[0];
      const { questionaresIDsAndTypes, allQuestionnaires } = survey;
      // logic to provide the Qs in the correct order, maybe consider this in refactoring the collections
      const idToIndex = new Map();
      questionaresIDsAndTypes.forEach(({ id }, i) => { idToIndex.set(id.toString(), i); });
      const reordered = new Array(allQuestionnaires.length);
      allQuestionnaires.forEach(({ _id }, i) => { reordered[idToIndex.get(_id.toString())] = allQuestionnaires[i] });

      survey.allQuestionnaires = reordered;
      callback(aoid(survey))
    })
    .catch(e => {
      logger.error(e);
    })
}