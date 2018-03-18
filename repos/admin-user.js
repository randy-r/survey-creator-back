const { provideDB } = require('./db');
const { adjustObjectId } = require('./utils');
const logger = require('../utils/logger');

const collName = 'adminusers';
const aoid = adjustObjectId;



exports.getAdminUser = (email, callback) => {
  const db = provideDB();
  db.collection(collName).findOne({ email })
    .then(result => callback(aoid(result))) // must check for null
    .catch(x => logger.error(x))
    ;
};

exports.updateAdminUser = (user, callback) => {
  const db = provideDB();
  db.collection(collName).findOneAndReplace(
    {
      email: user.email,
    },
    user,
    {
      returnOriginal: false
    }).then(r1 => {
      const updatedUser = r1.value;
      callback(updatedUser);
    }).catch(x => logger.error(x))
    ;
};
