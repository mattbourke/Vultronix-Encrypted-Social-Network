'use strict';
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;


module.exports.User = mongoose.model('User', new Schema({
  id:                ObjectId,
  privateKeyString:  { type: String, required: '{PATH} is required.' },
  publicKeyString:   { type: String, required: '{PATH} is required.' },
  UUID:              { type: String, required: '{PATH} is required.' },
  loginHash:         { type: String, required: '{PATH} is required.' },
  data:              Object,
}));
