const { ObjectID } = require('mongodb');

const { provideDB } = require('./db');
const { adjustObjectId } = require('./utils');

const collName = 'questionneres';
const aoid = adjustObjectId;

exports.create = (entity, callback) => {
  const db = provideDB();

  const { itemsIds } = entity;
  entity.itemsIds = itemsIds.map(id => new ObjectID(id));

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

exports.getById = (id, callback) => {
  const db = provideDB();
  db.collection(collName)
    // .findOne({ _id: new ObjectID(id) })
    .aggregate([
      {
        $lookup: {
          from: 'items',
          localField: 'itemsIds',
          foreignField: '_id',
          as: 'items'
        },
      },
      {
        $match: { _id: new ObjectID(id) }
      }
    ])
    .toArray()
    .then(array => {
      if (array.length === 0) {
        callback(null);
      }
      callback(aoid(array[0]))
    })
    .catch(e => {
      console.error(e);
    })
    ;
};
