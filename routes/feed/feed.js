'use strict';
const express              = require('express');
const myStatus             = require('./feedModel').myStatus;
const statusNotifications  = require('./feedModel').statusNotifications;
const myComments           = require('./feedModel').myComments;
const feedSocket           = require('../feed/feedSocket');
const requireLogin         = require('../security').requireLogin;
const socketListener       = require('../socketListener');
const router               = express.Router();

router.post('/myStatus', requireLogin, (req, res) => {
  myStatus.create(req.body.statusData, (err, docs) => {
    if (err) {
      res.json(err);
      res.status(200).end();
    }else{
      res.json(docs);
      res.status(200).end();
    }
  });
});

router.post('/statusNotifications', requireLogin, (req, res) => {
  const clients    = socketListener().getClients();
  const friendData = req.body.friendData;
  statusNotifications.create(friendData, (err) => {
    if (err) {
      res.json(err);
      res.status(200).end();
    }else{
      for (let prop in friendData) {
        if (friendData[prop].friendUUID.hasOwnProperty(prop)) {
          feedSocket.notifyOnlineFriendsOfNewStatus(friendData[prop].friendUUID, clients);
        }
      }
      res.json('success');
      res.status(200).end();
    }
  });
});

router.get('/myStatus', requireLogin, (req, res) => {
  let passedIntokens = [];
  if ( typeof req.query.statusUUID === "string" && req.query.statusUUID.length ) {
    passedIntokens.push(req.query.statusUUID);
  }
  else {
    passedIntokens = req.query.statusUUID;
  }
  myStatus.find({'statusUUID':{$in:passedIntokens}}, (err, docs) => {
    res.json(docs);
    res.status(200).end();
  }).sort({ postDate: 'desc' });
});

router.get('/statusNotifications', requireLogin, (req, res) => {
  let passedIntokens          = [];
  const newestStatusTime      = req.query.newestStatusTime;
  const oldestStatusTime      = req.query.oldestStatusTime;
  const loadMoreButtonClicked = (req.query.loadMoreButtonClicked === "true")?true:false;
  let startSearchFrom         = req.query.currentLoadedCount || 0;
  let limit                   = 6;
  let query;

  if ( typeof req.query.friendUUID === "string" && req.query.friendUUID.length ) {
    passedIntokens.push(req.query.friendUUID);
  } else {
    passedIntokens = req.query.friendUUID;
  }

  if ( typeof newestStatusTime === "string" && ! loadMoreButtonClicked){
    query = {time: {$gt:newestStatusTime }, 'friendUUID':{$in:passedIntokens}};
    startSearchFrom = 0;
  }else{
    query = {'friendUUID': {$in: passedIntokens}};
  }

  if(startSearchFrom > 0){
    limit = 3;
  }

  let statusNotificationsQuery = statusNotifications.find(query)
    .sort('-time')
    .skip(startSearchFrom)
    .limit(limit);

  statusNotificationsQuery.exec( (err, docs)=> {
    res.json(docs);
    res.status(200).end();
  });

});


router.post('/myComments', requireLogin, (req, res) => {
  myComments.create(req.body, (err, docs) => {
    if (err) {
      res.json(err);
      res.status(200).end();
    }else{
      res.json(docs);
      res.status(200).end();
    }
  });
});

router.get('/myComments', requireLogin, (req, res) => {
  let passedIntokens = [];
  if ( typeof req.query.statusUUID === "string" && req.query.statusUUID.length ) {
    passedIntokens.push(req.query.statusUUID);
  } else {
    passedIntokens = req.query.statusUUID;
  }

  let fields;
  let options = {sort: {$natural:1}};
  let query   = {'statusUUID':{$in:passedIntokens}};

  myComments.find(query, fields, options, (err, docs) => {
    res.json(docs);
    res.status(200).end();
  });
});


module.exports = router;