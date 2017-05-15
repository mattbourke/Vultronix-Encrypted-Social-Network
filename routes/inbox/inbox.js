'use strict';
const express             = require('express');
const inboxMessageHeaders = require('./inboxModel').inboxMessageHeaders;
const inboxMessages       = require('./inboxModel').inboxMessages;
const socketListener      = require('../socketListener');
const inboxSocket         = require('./inboxSocket');
const requireLogin        = require('../security').requireLogin;
const router              = express.Router();

router.get('/getMessagesByFriendship', requireLogin, (req, res)=> {
  if( req.query.UUID !== undefined){
    let fields    = null;
    const options = {sort: {_id:-1},limit:6};
    let query     = {'time': {$lt:req.query.oldestCommentsTime}, 'receiverUUID':req.query.UUID};
    let messages  = inboxMessages.find(query, fields, options);

    messages.exec( (err, docs)=> {
      if( docs[0] !== undefined){
        _upsertHeader(req.query.UUID, false, true);
        res.json(docs);
        res.status(200).end();
      }else{
        res.json({empty:true});
        res.status(200).end();
      }
    });
  }else{
    res.json({loginStatus:"failure"});
    res.status(200).end();
  }
});

router.get('/getConversationHeaders', requireLogin, (req, res)=> {
  let passedIntokens = [];
  if( typeof req.query.tokens === "string" && req.query.tokens.length ){
    passedIntokens.push(req.query.tokens);
  }else{
    passedIntokens = req.query.tokens;
  }

  if( req.query.tokens !== undefined){
    inboxMessageHeaders.find({ receiverUUID : { $in : passedIntokens } }, (err, docs)=> {
      if( docs[0] !== undefined){
        res.json(docs);
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

let _upsertHeader = (receiverUUID, read, ignoreDate)=> {
  const dateTime = new Date().getTime();
  let header     = null;
  if( receiverUUID !== undefined){
    //TODO: temp Hack
    if( ignoreDate ){
      header = inboxMessageHeaders.findOneAndUpdate({receiverUUID:receiverUUID}, {unread:read}, {upsert:true}, (err)=> {
        if (err){
          console.log('failed upsert');
        }
      });
    }else{
      header = inboxMessageHeaders.findOneAndUpdate({receiverUUID:receiverUUID}, {createdDate:dateTime, unread:read}, {upsert:true}, (err)=> {
        if (err){
          console.log('failed upsert');
        }
      });
    }
  }

};


router.post('/upsertConversationHeaders', (req, res)=> {
  _upsertHeader(req.body.receiverUUID, req.body.read);

  res.json({success:true});
  res.status(200).end();
});


let _insertConversationMessage = (receiverUUID, messageUUID, message, senderUUID, dateTime, ignoreDate, myCopy)=> {

  if( receiverUUID !== undefined ){
    let newMessage           = new inboxMessages();
    newMessage.receiverUUID  = receiverUUID;
    newMessage.messageUUID   = messageUUID;
    newMessage.message       = message;
    newMessage.senderUUID    = senderUUID;
    newMessage.createdDate   = dateTime;

    newMessage.save( (err)=> {
      if (err){
        return err;
      }else{
        let unread = true;
        if(myCopy){
          unread = false;
        }
        let upsert = _upsertHeader(receiverUUID, unread, ignoreDate);
        return upsert;
      }
    });

  }else{
    return "failure details required";
  }
};


router.post('/sendUserTyping', requireLogin, (req, res)=> {
  if( req.body.friendUUID !== undefined){

    inboxSocket.isFriendOnline(req.body.friendUUID, (online, friendsSession)=> {
      if( online ){
        let clients            = socketListener().getClients();
        let friendUUID         = req.body.friendUUID;
        inboxSocket.emitUserIsTyping(friendUUID, friendsSession, clients);
      }

    });
    res.json("success");
    res.status(200).end();
  }else{
    res.json({createThreadStatus:"failure details required"});
    res.status(200).end();
  }

});


router.post('/createConversationMessage', requireLogin, (req, res)=> {

  if( req.body.newMessageForFriend.messageUUID !== undefined && req.body.messageMyCopy.messageUUID !== undefined){
    let datetime           = new Date().getTime();
    // TODO: sort out the below with promises
    try{
      // friends copy
      _insertConversationMessage( req.body.newMessageForFriend.receiverUUID,
                                  req.body.newMessageForFriend.messageUUID,
                                  req.body.newMessageForFriend.message,
                                  req.body.newMessageForFriend.senderUUID,
                                  datetime
                                );
      // my copy
      _insertConversationMessage( req.body.messageMyCopy.receiverUUID,
                                  req.body.messageMyCopy.messageUUID,
                                  req.body.messageMyCopy.message,
                                  req.body.messageMyCopy.senderUUID,
                                  datetime,
                                  true,
                                  true
                                );

      inboxSocket.isFriendOnline(req.body.newMessageForFriend.receiverUUID, (online, friendsSession)=> {
        if( online ){
          let clients            = socketListener().getClients();
          let friendUUID         = req.body.newMessageForFriend.receiverUUID;
          let messageFriendsCopy = req.body.newMessageForFriend.message;
          inboxSocket.emitMessage(friendUUID, messageFriendsCopy, friendsSession, clients);
        }
      });

      res.json("success");
      res.status(200).end();
    }catch(err) {
      res.json({createThreadStatus:"failure"});
      res.status(200).end();
    }
  }else{
    res.json({createThreadStatus:"failure details required"});
    res.status(200).end();
  }

});

// deleteMessage

// createMessage

module.exports = router;
