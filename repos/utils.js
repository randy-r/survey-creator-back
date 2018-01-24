exports.adjustObjectId = object => {
  object.id = object._id;//.toString();
  delete object._id;
  return object;
}

