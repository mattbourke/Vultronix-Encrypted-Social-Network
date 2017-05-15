'use strict';
const express            = require('express');
const friendList         = require('./friendsModel').friendList;
const deletedFriendShips = require('./friendsModel').deletedFriendShips;
const requireLogin       = require('../security').requireLogin;
const router             = express.Router();


router.get('/friendProfile', requireLogin, (req, res)=> {
  res.json(friends[req.query.friendUUID - 1]);
  // with the above consider grabbing their actual friend ID, rather than simply order of the item on the page
  // as the first item on the page is 1 but array starts at 0
  res.status(200).end();
});


router.get('/myFriends', requireLogin, (req, res)=> {
  if( req.query.myUUID !== undefined){
    friendList.find({myUUID:req.query.myUUID}, (err, docs)=> {
      if( docs[0] !== undefined){
        const requests = {
            myUUID       : docs[0].myUUID,
            friendsJSON  : docs[0].friendsJSON,
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


router.post('/upsertFriendList', requireLogin, (req, res)=> {
  if( req.body.myUUID !== undefined){
    friendList.findOneAndUpdate({myUUID:req.body.myUUID}, {friendsJSON:req.body.friends}, {upsert:true}, (err, doc)=> {
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

router.post('/deletedFriendShip', requireLogin, (req, res)=> {
  if( req.body.friendUUID !== undefined){
    deletedFriendShips.findOneAndUpdate({friendUUID:req.body.friendUUID}, {confirmation:req.body.confirmation}, {upsert:true}, (err, doc)=> {
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

router.get('/getDeletedFriendShips', requireLogin, (req, res)=> {
  let passedIntokens = [];
  if( typeof req.query.tokens === "string" && req.query.tokens.length ){
    passedIntokens.push(req.query.tokens);
  }else{
    passedIntokens = req.query.tokens;
  }
  //TODO: fix this hack above, when a single item comes through its a string, rather than a json array, when its 2 items or more array
  // it is interpreted as an array, yes I know techincally the client is sending through JSON as string.

  if( req.query.tokens !== undefined){
    deletedFriendShips.find({ friendUUID : { $in : passedIntokens } }, (err, docs)=> {

      if( docs !== undefined && docs[0] !== undefined){
        let deletedFriendShips = [];
        let deletedFriend      = {};

        for (let prop in docs) {
          if (docs.hasOwnProperty(prop)) {
            deletedFriend = {
              friendUUID   : docs[prop].friendUUID,
              confirmation : docs[prop].confirmation
            };
            deletedFriendShips.push(deletedFriend);
          }
        }

        res.json(deletedFriendShips);
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


module.exports = router;