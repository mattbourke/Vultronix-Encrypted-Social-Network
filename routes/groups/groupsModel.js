'use strict';
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;


module.exports.group = mongoose.model('group', new Schema({
  id:                ObjectId,
  groupUUID:        { type: String, required: '{PATH} is required.' },
  groupName:        { type: String, required: '{PATH} is required.' },
  groupDescription: { type: String, required: '{PATH} is required.' },
  groupThumb:       { type: String, required: '{PATH} is required.' },
  groupCreatorName: { type: String, required: '{PATH} is required.' },
  groupAdminUUID:   { type: String, required: '{PATH} is required.' },
  groupAdminHash:   { type: String, required: '{PATH} is required.' },
  createdDate:      { type: Date,   required: '{PATH} is required.' },
}));

module.exports.groupMembers = mongoose.model('groupMembers', new Schema({
  id:                    ObjectId,
  groupUUID:            { type: String, required: '{PATH} is required.' },
  memberUUID:           { type: String, required: '{PATH} is required.' },
  memberName:           { type: String, required: '{PATH} is required.' },
  memberIDForUpdating:  { type: String, required: '{PATH} is required.' },
  memberThumb:          { type: String, required: '{PATH} is required.' },
  memberPublicPGP:      { type: String, required: '{PATH} is required.' },

}));


module.exports.groupRequestToken = mongoose.model('groupRequestToken', new Schema({
  id:                  ObjectId,
  tokenUUID:          { type: String, required: '{PATH} is required.' },
  groupUUID:          { type: String, required: '{PATH} is required.' },
  groupName:          { type: String, required: '{PATH} is required.' },
  groupDescription:   { type: String, required: '{PATH} is required.' },
  groupThumbnail:     { type: String, required: '{PATH} is required.' },
  invitersName:       { type: String, required: '{PATH} is required.' },
  invitersThumbnail:  { type: String, required: '{PATH} is required.' },
  invitationMessage:  { type: String, required: '{PATH} is required.' },
  groupEncryptionKey: { type: String, required: '{PATH} is required.' },
  createdDate:        { type: Date,   required: '{PATH} is required.' },
}));

module.exports.groupList = mongoose.model('groupList', new Schema({
  id:          ObjectId,
  myUUID:     { type: String, required: '{PATH} is required.' },
  groupsJSON: { type: String, required: '{PATH} is required.' },
}));

module.exports.groupThreads = mongoose.model('groupThreads', new Schema({
  id:           ObjectId,
  groupUUID:   { type: String, required: '{PATH} is required.' },
  threadUUID:  { type: String, required: '{PATH} is required.' },
  threadTitle: { type: String, required: '{PATH} is required.' },
  authorUUID:  { type: String, required: '{PATH} is required.' },
  createdDate: { type: Date,   required: '{PATH} is required.' },
}));


module.exports.groupThreadMessages = mongoose.model('groupThreadMessages', new Schema({
  id:            ObjectId,
  threadUUID:    { type: String, required: '{PATH} is required.' },
  messageUUID:   { type: String, required: '{PATH} is required.' },
  threadMessage: { type: String, required: '{PATH} is required.' },
  authorUUID:    { type: String, required: '{PATH} is required.' },
  createdDate:   { type: Date,   required: '{PATH} is required.' },
}));

module.exports.groupPrivateMessages = mongoose.model('groupPrivateMessages', new Schema({
  id:           ObjectId,
  messageUUID:  { type: String, required: '{PATH} is required.' },
  receiverUUID: { type: String, required: '{PATH} is required.' },
  senderUUID:   { type: String, required: '{PATH} is required.' },
  message:      { type: String, required: '{PATH} is required.' },
  createdDate:  { type: Date,   required: '{PATH} is required.' },
}));

module.exports.groupPrivateMessageHeaders = mongoose.model('groupPrivateMessageHeaders', new Schema({
  id:           ObjectId,
  receiverUUID: { type: String,  required: '{PATH} is required.' },
  senderUUID:   { type: String,  required: '{PATH} is required.' },
  unread:       { type: Boolean, required: '{PATH} is required.' },
  createdDate:  { type: Date,    required: '{PATH} is required.' },
}));

