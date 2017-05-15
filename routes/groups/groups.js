'use strict';
const express                    = require('express');
const group                      = require('./groupsModel').group;
const groupMembers               = require('./groupsModel').groupMembers;
const groupRequestToken          = require('./groupsModel').groupRequestToken;
const groupThreads               = require('./groupsModel').groupThreads;
const groupThreadMessages        = require('./groupsModel').groupThreadMessages;
const groupList                  = require('./groupsModel').groupList;
const groupPrivateMessages       = require('./groupsModel').groupPrivateMessages;
const groupPrivateMessageHeaders = require('./groupsModel').groupPrivateMessageHeaders;
const requireLogin               = require('../security').requireLogin;
const router                     = express.Router();


router.get('/myGroups', requireLogin, (req, res)=> {
  if( req.query.myUUID !== undefined){
    groupList.find({myUUID:req.query.myUUID}, (err, docs)=> {
      if( docs[0] !== undefined){
        const requests = {
          myUUID       : docs[0].myUUID,
          groupsJSON   : docs[0].groupsJSON,
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

router.post('/createNewGroup', requireLogin, (req, res)=> {

  if( req.body.groupUUID !== undefined){
    let newGroup              = new group();
    newGroup.groupUUID        = req.body.groupUUID;
    newGroup.groupName        = req.body.groupName;
    newGroup.groupDescription = req.body.groupDescription;
    newGroup.groupThumb       = req.body.groupThumb;
    newGroup.groupCreatorName = req.body.groupCreatorName;
    newGroup.groupAdminUUID   = req.body.groupAdminUUID;
    newGroup.groupAdminHash   = req.body.groupAdminHash;
    newGroup.createdDate      = req.body.createdDate;

    newGroup.save( (err)=> {
      if (err){
        res.json(err);
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

router.post('/upsertGroupList', requireLogin, (req, res)=> {
  if( req.body.myUUID !== undefined){
    groupList.findOneAndUpdate({myUUID:req.body.myUUID}, {groupsJSON:req.body.groups}, {upsert:true}, (err)=> {
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



router.post('/updateThumbnail', requireLogin, (req, res)=> {
  if( req.body.groupAdminUUID !== undefined){
    group.findOneAndUpdate({groupUUID: req.body.groupUUID, groupAdminUUID:req.body.groupAdminUUID}, {groupThumb:req.body.groupThumb}, {upsert:false}, (err)=> {
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


router.get('/getGroupThumbnail', requireLogin, (req, res)=> {
  if( req.query.groupUUID !== undefined){
    group.find({groupUUID: req.query.groupUUID}, (err, doc)=> {
      if (err){
        return res.send('');
      }else{
        return res.send(doc[0].groupThumb);
      }
    });
  }else{
    res.json({loginStatus:"failure details required"});
  }
});


router.post('/createGroupInvite', requireLogin, (req, res)=> {
  if( req.body.tokenUUID !== undefined){
    let newGroupRequestToken                = new groupRequestToken();
    newGroupRequestToken.tokenUUID          = req.body.tokenUUID;
    newGroupRequestToken.groupName          = req.body.groupName;
    newGroupRequestToken.groupDescription   = req.body.groupDescription;
    newGroupRequestToken.groupThumbnail     = req.body.groupThumbnail;
    newGroupRequestToken.groupUUID          = req.body.groupUUID;
    newGroupRequestToken.invitersName       = req.body.invitersName;
    newGroupRequestToken.invitersThumbnail  = req.body.invitersThumbnail;
    newGroupRequestToken.invitationMessage  = req.body.invitationMessage;
    newGroupRequestToken.groupEncryptionKey = req.body.groupEncryptionKey;
    newGroupRequestToken.createdDate        = new Date().getTime();
    newGroupRequestToken.save( (err)=> {
      if (err){
        res.json({createInviteStatus:"serverside invite error"});
        res.status(200).end();
      }else{
        res.json({createInviteStatus:"success"});
        res.status(200).end();
      }
    });

  }else{
    res.json({createRequestStatus:"failure details required"});
    res.status(200).end();
  }

});

router.get('/enterRequestToken', requireLogin, (req, res)=> {
  if( req.query.groupRequestToken !== undefined){
    groupRequestToken.find({tokenUUID:req.query.groupRequestToken}, (err, docs)=> {
      if( docs[0] !== undefined){
        let groupRequest = {
          tokenUUID          : docs[0].tokenUUID,
          groupName          : docs[0].groupName,
          groupDescription   : docs[0].groupDescription,
          groupThumbnail     : docs[0].groupThumbnail,
          groupUUID          : docs[0].groupUUID,
          invitersName       : docs[0].invitersName,
          invitersThumbnail  : docs[0].invitersThumbnail,
          invitationMessage  : docs[0].invitationMessage,
          groupEncryptionKey : docs[0].groupEncryptionKey,
          createdDate        : docs[0].createdDate,
          found              : "success"
        };
        res.json(groupRequest);
      }else{
        res.json({found:"not found"});
      }
    });
  }else{
    res.json({found:"failure"});
  }
});

router.post('/deleteRequestToken', requireLogin, (req, res)=> {
  if( req.body.groupRequestToken !== undefined){

    groupRequestToken.remove({tokenUUID:req.body.groupRequestToken}, (err)=> {
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


router.post('/removeMyGroupMembershipFromDB', requireLogin, (req, res)=> {
  if( req.body.memberIDForUpdating !== undefined){
    groupMembers.remove({memberIDForUpdating:req.body.memberIDForUpdating}, (err)=> {
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


router.post('/addMemberToGroupMemberList', requireLogin, (req, res)=> {
  if( req.body.groupUUID !== undefined){
    let newGroupMemberInstance                 = new groupMembers();
    newGroupMemberInstance.groupUUID           = req.body.groupUUID;
    newGroupMemberInstance.memberUUID          = req.body.myGroupUUID;
    newGroupMemberInstance.memberName          = req.body.myGroupName;
    newGroupMemberInstance.memberIDForUpdating = req.body.myIDForUpdating;
    newGroupMemberInstance.memberThumb         = req.body.myGroupThumb;
    newGroupMemberInstance.memberPublicPGP     = req.body.myPublicPGP;
    newGroupMemberInstance.save( (err)=> {
      if (err){
        res.json(err);
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

router.get('/getGroupMembers', requireLogin, (req, res)=> {
  if( req.query.groupUUID !== undefined){
    groupMembers.find({groupUUID:req.query.groupUUID}, (err, docs)=> {
      if( docs[0] !== undefined){
        //TODO: work out why I can't simply delete the groupuuid etc with "delete el.groupUUID"
        // this works fine in my browser console, but node doesn't seem to delete it.
        // for now I'm just setting it to blank
        let requests = docs.filter( (el)=> {
          el.memberIDForUpdating = '';
          el.groupUUID           = '';
          return  1 === 1;
        });

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

router.get('/getThreads', requireLogin, (req, res)=> {
  if( req.query.groupUUID !== undefined){
    req.query.currentLoadedCount = req.query.currentLoadedCount || 0;
    // for more efficent pagination see http://stackoverflow.com/questions/5539955/how-to-paginate-with-mongoose-in-node-js

    let groupsThreads = groupThreads.find({groupUUID: req.query.groupUUID})
      .sort('-createdDate')
      .skip(req.query.currentLoadedCount)
      .limit(15);

    groupsThreads.exec( (err, docs)=> {
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

router.get('/getThread', requireLogin, (req, res)=> {
  if( req.query.groupUUID !== undefined){
    groupThreads.find({threadUUID:req.query.threadUUID}, (err, docs)=> {
      if( docs[0] !== undefined){
        let requests = {
          threadUUID   : docs[0].threadUUID,
          threadTitle  : docs[0].threadTitle,
          createdDate  : docs[0].createdDate,
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

router.get('/groupThreadMessages', requireLogin, (req, res)=> {
  if( req.query.threadUUID !== undefined){
    req.query.currentLoadedCount = req.query.currentLoadedCount || 0;

    let messages = groupThreadMessages.find({threadUUID:req.query.threadUUID})
      .sort('-createdDate')
      .skip(req.query.currentLoadedCount)
      .limit(15);

    messages.exec( (err, docs)=> {
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


router.post('/createThread', requireLogin, (req, res)=> {

  if( req.body.groupUUID !== undefined){
    let newThread         = new groupThreads();
    newThread.groupUUID   = req.body.groupUUID;
    newThread.threadUUID  = req.body.threadUUID;
    newThread.threadTitle = req.body.threadTitle;
    newThread.authorUUID  = req.body.authorUUID;
    newThread.createdDate = new Date().getTime();

    newThread.save( (err)=> {
      if (err){
        res.json(err);
        res.status(200).end();
      }else{
        res.json("success");
        res.status(200).end();
      }
    });

  }else{
    res.json({createThreadStatus:"failure details required"});
    res.status(200).end();
  }

});

// below won't work as the threadUUID is encrypted....
let _upsertHeader = (threadUUID)=> {
  let dateTime = new Date().getTime();
  if( threadUUID !== undefined){
    groupThreads.findOneAndUpdate({threadUUID:threadUUID}, {createdDate:dateTime}, {upsert:true}, (err)=> {
      if (err){
        return 'fail';
      }else{
        return 'success';
      }
    });
  }else{
    return 'fail';
  }

};

router.post('/createThreadMessage', requireLogin, (req, res)=> {

  if( req.body.messageUUID !== undefined){
    let newComment           = new groupThreadMessages();
    newComment.threadUUID    = req.body.threadUUID;
    newComment.messageUUID   = req.body.messageUUID;
    newComment.threadMessage = req.body.threadMessage;
    newComment.authorUUID    = req.body.authorUUID;
    newComment.createdDate   = new Date().getTime();

    newComment.save( (err)=> {
      if (err){
        res.json(err);
        res.status(200).end();
      }else{
        _upsertHeader(req.body.threadUUID);
        res.json("success");
        res.status(200).end();
      }
    });

  }else{
    res.json({createThreadStatus:"failure details required"});
    res.status(200).end();
  }

});

router.get('/getPrivateGroupConversationHeaders', requireLogin, (req, res)=> {

  if( req.query.myGroupMemberUUID !== undefined){
    groupPrivateMessageHeaders.find({ receiverUUID : req.query.myGroupMemberUUID, senderUUID: { $ne: req.query.myGroupMemberUUID }  }, (err, docs)=> {
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

let _upsertConversationHeader = (receiverUUID, senderUUID, read, ignoreDate)=> {
  let dateTime = new Date().getTime();
  let header   = null;
  if( receiverUUID !== undefined){
    //TODO: temp Hack
    if( ignoreDate ){
      header = groupPrivateMessageHeaders.findOneAndUpdate({receiverUUID:receiverUUID, senderUUID:senderUUID}, {unread:read}, {upsert:true}, (err)=> {
        if (err){
          console.log('failed upsert');
        }
      });
    }else{
      header = groupPrivateMessageHeaders.findOneAndUpdate({receiverUUID:receiverUUID, senderUUID:senderUUID}, {createdDate:dateTime, unread:read}, {upsert:true}, (err)=> {
        if (err){
          console.log('failed upsert');
        }
      });
    }
  }

};

let _insertPrivateGroupMessage = (receiverUUID, messageUUID, message, senderUUID, dateTime, ignoreDate, senderUUIDUnhashed, receiverUUIDUnhashed)=> {

  if( receiverUUID !== undefined ){
    let newMessage           = new groupPrivateMessages();
    newMessage.receiverUUID  = receiverUUID;
    newMessage.messageUUID   = messageUUID;
    newMessage.message       = message;
    newMessage.senderUUID    = senderUUID;
    newMessage.createdDate   = dateTime;

    newMessage.save( (err)=> {
      if (err){
        return err;
      }else{
        let upsert = _upsertConversationHeader(receiverUUIDUnhashed, senderUUIDUnhashed, true, ignoreDate);
        return upsert;
      }
    });

  }else{
    return "failure details required";
  }
};


router.post('/createPrivateConversationMessage', requireLogin, (req, res)=> {

  if( req.body.newMessageForFriend.messageUUID !== undefined && req.body.messageMyCopy.messageUUID !== undefined){
    let datetime = new Date().getTime();
    // TODO: sort out the below with promises
    try{
      _insertPrivateGroupMessage( req.body.newMessageForFriend.receiverUUID,
                                  req.body.newMessageForFriend.messageUUID,
                                  req.body.newMessageForFriend.message,
                                  req.body.newMessageForFriend.senderUUID,
                                  datetime,
                                  false,
                                  req.body.newMessageForFriend.senderUUIDUnhashed,
                                  req.body.newMessageForFriend.receiverUUIDUnhashed
                                );

      _insertPrivateGroupMessage( req.body.messageMyCopy.receiverUUID,
                                  req.body.messageMyCopy.messageUUID,
                                  req.body.messageMyCopy.message,
                                  req.body.messageMyCopy.senderUUID,
                                  datetime,
                                  true,
                                  req.body.messageMyCopy.senderUUIDUnhashed,
                                  req.body.messageMyCopy.receiverUUIDUnhashed
                                );

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

router.get('/getPrivateMessagesByMemberFriendship', requireLogin, (req, res)=> {

  if( req.query.receiverUUID !== undefined){
    req.query.currentLoadedCount = req.query.currentLoadedCount || 0;

    let messages = groupPrivateMessages.find({receiverUUID:req.query.receiverUUID})
      .sort('-createdDate')
      .skip(req.query.currentLoadedCount)
      .limit(8);

    messages.exec( (err, docs)=> {
      if( docs[0] !== undefined){
        _upsertConversationHeader(req.query.receiverUUIDUnhashed, req.query.senderUUIDUnhashed, false, true);
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


module.exports = router;