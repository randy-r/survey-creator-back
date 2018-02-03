const { provideDB } = require('./db');
const { adjustObjectId } = require('./utils');

const collName = 'adminusers';
const aoid = adjustObjectId;


exports.getAdminUser = (email, callback) => {
  const db = provideDB();
  db.collection(collName).findOne({ email })
    .then(result => callback(aoid(result))) // must check for null
    .catch(x => console.log('error', x)
    );
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
      console.log(updatedUser);
      callback(updatedUser);
    });
};
