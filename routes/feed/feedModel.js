'use strict';
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;


module.exports.myStatus = mongoose.model('status', new Schema({
  id         : ObjectId,
  statusUUID : { type: String, required: '{PATH} is required.' },
  statusData : Object,
}));


module.exports.statusNotifications = mongoose.model('statusNotifications', new Schema({
  id               : ObjectId,
  statusUUID       : { type: String, required: '{PATH} is required.' },
  friendUUID       : { type: String, required: '{PATH} is required.' },
  myFriendshipUUID : { type: String, required: '{PATH} is required.' },
  decryptKey       : { type: String, required: '{PATH} is required.' },
  time             : { type : Date, default: Date.now },
}));


module.exports.myComments = mongoose.model('comments', new Schema({
  id         : ObjectId,
  statusUUID : { type: String, required: '{PATH} is required.' },
  commentData: Object,
}));



