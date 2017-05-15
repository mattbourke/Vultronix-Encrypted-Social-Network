'use strict';
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;

module.exports.friendRequest = mongoose.model('friendRequest', new Schema({
  id:                      ObjectId,
  friendShipToken:         { type: String, required: '{PATH} is required.' },
  friendshipUUID:          { type: String, required: '{PATH} is required.' },
  sendersFriendshipUUID:   { type: String, required: '{PATH} is required.' },
  acceptersFriendshipUUID: { type: String, required: '{PATH} is required.' },
  requestersName:          { type: String, required: '{PATH} is required.' },
  requestersPGP:           { type: String, required: '{PATH} is required.' },
  requestMessage:          { type: String, required: '{PATH} is required.' },
  thumbnail:               { type: String, required: '{PATH} is required.' },
}));

module.exports.acceptedFriendRequest = mongoose.model('acceptedFriendRequest', new Schema({
  id:                      ObjectId,
  friendShipToken:         { type: String, required: '{PATH} is required.' },
  encryptedFriendRequest:  { type: String, required: '{PATH} is required.' },
}));

module.exports.friendRequestTokenList = mongoose.model('friendRequestTokenList', new Schema({
  id:           ObjectId,
  myUUID:      { type: String, required: '{PATH} is required.' },
  tokensJSON:  { type: String, required: '{PATH} is required.' },
}));