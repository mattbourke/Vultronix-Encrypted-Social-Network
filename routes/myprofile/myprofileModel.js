'use strict';
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;


module.exports.myProfile = mongoose.model('myProfile', new Schema({
  id:           ObjectId,
  UUID:         { type: String, required: '{PATH} is required.' },
  profileJSON:  { type: String, required: '{PATH} is required.' },
}));

module.exports.myBiography = mongoose.model('myBiography', new Schema({
  id:         ObjectId,
  UUID:       { type: String, required: '{PATH} is required.' },
  biography:  { type: String, required: '{PATH} is required.' },
}));

module.exports.headerImage = mongoose.model('headerImage', new Schema({
  id:              ObjectId,
  UUID:            { type: String, required: '{PATH} is required.' },
  headerImageData: { type: String, required: '{PATH} is required.' },
}));

module.exports.profileImage = mongoose.model('profileImage', new Schema({
  id:               ObjectId,
  UUID:             { type: String, required: '{PATH} is required.' },
  profileImageData: { type: String, required: '{PATH} is required.' },
}));


module.exports.myAlbums = mongoose.model('myAlbums', new Schema({
  id                  : ObjectId,
  albumUUID           : { type: String, required: '{PATH} is required.' },
  albumTitle          : { type: String, required: '{PATH} is required.' },
  albumImage          : { type: String, required: '{PATH} is required.' },
  friendUUID          : { type: String, required: '{PATH} is required.' },
  authorHashForUpdate : { type: String, required: '{PATH} is required.' },
  decryptKey          : { type: String, required: '{PATH} is required.' },
}));
// consider using GridFS or similar for future storage of images, for now image size is kept down, so should be ok for a bit.
module.exports.myPhoto = mongoose.model('myPhoto', new Schema({
  id                  : ObjectId,
  albumUUID           : { type: String, required: '{PATH} is required.' },
  photoUUID           : { type: String, required: '{PATH} is required.' },
  photoTitle          : { type: String, required: '{PATH} is required.' },
  photoImage          : { type: String, required: '{PATH} is required.' },
  authorHashForUpdate : { type: String, required: '{PATH} is required.' },
}));

module.exports.myPhotoComments = mongoose.model('myPhotoComments', new Schema({
  id         : ObjectId,
  photoUUID  : { type: String, required: '{PATH} is required.' },
  commentData: Object,
}));