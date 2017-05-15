'use strict';
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;

module.exports.friendList = mongoose.model('friendList', new Schema({
  id:           ObjectId,
  myUUID:      { type: String, required: '{PATH} is required.' },
  friendsJSON: { type: String, required: '{PATH} is required.' },
}));

// confirmation field in the below will simply be a message encrypted using the friendshipUUID
// if this decrypts succesfully then yes your friend deleted you.
// this should prevent people being able to delete other peoples friendships
module.exports.deletedFriendShips = mongoose.model('deletedFriendShips', new Schema({
  id:           ObjectId,
  friendUUID:   { type: String, required: '{PATH} is required.' },
  confirmation: { type: String, required: '{PATH} is required.' },
}));

