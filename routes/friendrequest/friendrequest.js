'use strict';
const express                = require('express');
const friendRequest          = require('./friendrequestModel').friendRequest;
const acceptedFriendRequest  = require('./friendrequestModel').acceptedFriendRequest;
const friendRequestTokenList = require('./friendrequestModel').friendRequestTokenList;
const friendRequestSocket    = require('../friendrequest/friendrequestSocket');
const requireLogin           = require('../security').requireLogin;
const socketListener         = require('../socketListener');
const router                 = express.Router();

router.post('/createFriendRequest', requireLogin, (req, res) => {
  if( req.body.friendShipToken !== undefined){
    let friendRequestInstance                     = new friendRequest();
    friendRequestInstance.friendShipToken         = req.body.friendShipToken;
    friendRequestInstance.friendshipUUID          = req.body.friendshipUUID;
    friendRequestInstance.sendersFriendshipUUID   = req.body.sendersFriendshipUUID;
    friendRequestInstance.acceptersFriendshipUUID = req.body.acceptersFriendshipUUID;
    friendRequestInstance.requestersName          = req.body.requestersName;
    friendRequestInstance.requestersPGP           = req.body.requestersPGP;
    friendRequestInstance.requestMessage          = req.body.requestMessage;
    friendRequestInstance.thumbnail               = req.body.thumbnail;
    friendRequestInstance.save( (err) => {
    if (err){
      res.json({createRequestStatus:"failure"});
    }else{
    }
  });

  friendRequestTokenList.findOneAndUpdate({myUUID:req.body.myUUID}, {tokensJSON:req.body.tokensJSON}, {upsert:true}, (err) => {
    if (err){
      res.json({createRequestStatus:"failure"});
    }else{
      res.json({createRequestStatus:"success"});
    }
  });


  }else{
    res.json({createRequestStatus:"failure details required"});
  }

});


router.get('/getAcceptedFriendRequest', requireLogin, (req, res) => {

  let passedIntokens = [];
  if( typeof req.query.tokens === "string" && req.query.tokens.length ){
    passedIntokens.push(req.query.tokens);
  }else{
    passedIntokens = req.query.tokens;
  }
//TODO: fix this hack above, when a single item comes through its a string, rather than a json array, when its 2 items or more array
// it is interpreted as an array, yes I know techincally the client is sending through JSON as string.

  if( passedIntokens ){
    acceptedFriendRequest.find({ friendShipToken : { $in : passedIntokens } }, (err, docs) => {

      if( docs && docs[0] !== undefined){
        let friendRequests = {"friendRequests":[]};
        let friendRequest  = {};

        for (let prop in docs) {
          if (docs.hasOwnProperty(prop)) {
            friendRequest = {
              friendShipToken         : docs[prop].friendShipToken,
              encryptedFriendRequest  : docs[prop].encryptedFriendRequest
            };
            friendRequests.friendRequests.push(friendRequest);
          }
        }

        res.json(friendRequests);
        res.status(200).end();
      }else{
        res.json(docs);
        res.status(200).end();
      }
    });
  }else{
    res.json({loginStatus:"failure"});
    res.status(200).end();
  }
});

router.post('/removeAcceptedFriendRequest', requireLogin, (req, res) => {

  if( req.body.friendShipTokenToDelete !== undefined){
    acceptedFriendRequest.remove({friendShipToken:req.body.friendShipTokenToDelete},  (err) => {
      if( err ){
        res.json("failure");
        res.status(200).end();
      }else{
        res.json("success");
        res.status(200).end();
      }
    });
  }else{
    res.json({createRequestStatus:"failure details required"});
    res.status(200).end();
  }

});


router.post('/addAcceptedFriendRequest', requireLogin, (req, res) => {
  if( req.body.friendShipToken !== undefined){
    let acceptedFriendRequestInstance                    = new acceptedFriendRequest();
    acceptedFriendRequestInstance.friendShipToken        = req.body.friendShipToken;
    acceptedFriendRequestInstance.encryptedFriendRequest = req.body.encryptedFriendRequest;
    acceptedFriendRequestInstance.save( (err) => {
      if (err){
        res.json("failure");
        res.status(200).end();
      }else{
        let clients = socketListener().getClients();
        friendRequestSocket.notifyFriendOfAcceptance(req.body.friendShipToken, clients);
        friendRequest.remove({friendShipToken:req.body.friendShipToken},  (err) => {
          if( err ){
            res.json("failure");
            res.status(200).end();
          }else{
            res.json("success");
            res.status(200).end();
          }
        });
      }
    });

  }else{
    res.json({createRequestStatus:"failure details required"});
    res.status(200).end();
  }

});


router.get('/getFriendRequestTokenList', requireLogin, (req, res) => {
  if( req.query.myUUID !== undefined){
    friendRequestTokenList.find({myUUID:req.query.myUUID}, (err, docs) => {
      if( docs[0] !== undefined){
        res.json(docs[0]);
        res.status(200).end();
      }else{
        res.json({requestCount:0});
        res.status(200).end();
      }
    });
  }else{
    res.json({loginStatus:"failure"});
    res.status(200).end();
  }
});



router.post('/upsertTokensList', requireLogin, (req, res) => {
  if( req.body.myUUID !== undefined){
    friendRequestTokenList.findOneAndUpdate({myUUID:req.body.myUUID}, {tokensJSON:req.body.tokens}, {upsert:true}, (err) => {
      if (err){
        return res.send(500, { error: err });
      }else{
        return res.send("success");
      }
    });
  }else{
    res.json({loginStatus:"failure details required"});
  }
});

router.get('/enterRequestToken', requireLogin, (req, res) => {
  if( req.query.friendRequestToken !== undefined){
    friendRequest.find({friendShipToken:req.query.friendRequestToken}, (err, docs) => {
      if( docs[0] !== undefined){
        let friendshipRequest = {
          friendShipToken         : docs[0].friendShipToken,
          friendshipUUID          : docs[0].friendshipUUID,
          sendersFriendshipUUID   : docs[0].sendersFriendshipUUID,
          acceptersFriendshipUUID : docs[0].acceptersFriendshipUUID,
          requestersName          : docs[0].requestersName,
          requestersPGP           : docs[0].requestersPGP,
          requestMessage          : docs[0].requestMessage,
          thumbnail               : docs[0].thumbnail,
          found                   : "success"
        };
        res.json(friendshipRequest);
      }else{
        res.json({found:"not found"});
      }
    });
  }else{
    res.json({found:"failure"});
  }
});


router.get('/friendRequests', requireLogin, (req, res) => {
  if( req.query.UUID !== undefined){
    friendRequest.find({UUID:req.body.UUID}, (err, docs) => {
      if( docs[0] !== undefined){
        let requests = {
          UUID         : docs[0].UUID,
          requestData  : docs[0].requestData,
          objectID     : docs[0].objectID,
          requestCount : 1
        };
        res.json(requests);
        res.status(200).end();
      }else{
        res.json({requestCount:0});
        res.status(200).end();
      }
    });
  }else{
    res.json({loginStatus:"failure"});
    res.status(200).end();
  }
});

module.exports = router;