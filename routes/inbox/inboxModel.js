'use strict';
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;

// inbox stuff
module.exports.inboxMessages = mongoose.model('inboxMessages', new Schema({
  id:           ObjectId,
  messageUUID:  { type: String, required: '{PATH} is required.' },
  receiverUUID: { type: String, required: '{PATH} is required.' },
  senderUUID:   { type: String, required: '{PATH} is required.' },
  message:      { type: String, required: '{PATH} is required.' },
  createdDate:  { type: Date,   required: '{PATH} is required.' },
  time:         { type: Date,   default:  Date.now }
}));

// not sure if the below is a good idea, but will do it anyway, collection space should be kept far smaller than the above
// and queried faster
module.exports.inboxMessageHeaders = mongoose.model('inboxMessageHeaders', new Schema({
  id:           ObjectId,
  receiverUUID: { type: String,  required: '{PATH} is required.' },
  unread:       { type: Boolean, required: '{PATH} is required.' },
  createdDate:  { type: Date,    required: '{PATH} is required.' },
  time:         { type: Date,    default:   Date.now }
}));
