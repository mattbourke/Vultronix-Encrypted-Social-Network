'use strict';
const express             = require('express');
const myProfile           = require('./myprofileModel').myProfile;
const myAlbums            = require('./myprofileModel').myAlbums;
const myPhoto             = require('./myprofileModel').myPhoto;
const myBiography         = require('./myprofileModel').myBiography;
const headerImage         = require('./myprofileModel').headerImage;
const profileImage        = require('./myprofileModel').profileImage;
const myprofileSocket     = require('../myprofile/myprofileSocket');
const requireLogin        = require('../security').requireLogin;
const socketListener      = require('../socketListener');
const router              = express.Router();

router.get('/myProfile', requireLogin, (req, res)=> {
  if( req.query.UUID !== undefined){
    myProfile.find({UUID:req.query.UUID}, (err, docs)=> {
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

router.get('/getBiography', requireLogin, (req, res)=> {
  if( req.query.UUID !== undefined){
    myBiography.find({UUID:req.query.UUID}, (err, docs)=> {
      if( docs[0] !== undefined){
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


router.get('/getHeaderImage', requireLogin, (req, res)=> {
  if( req.query.UUID !== undefined){
    headerImage.find({UUID:req.query.UUID}, (err, docs)=> {
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

router.get('/getProfileImage', requireLogin, (req, res)=> {
  if( req.query.UUID !== undefined){
    profileImage.find({UUID:req.query.UUID}, (err, docs)=> {
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

router.post('/upsertHeaderImage', requireLogin, (req, res)=> {
  let headerImageArray = req.body;
  let clients          = socketListener().getClients();
  if( headerImageArray !== undefined && headerImageArray[0] !== undefined){
    let doUpdate   = null;
    let loopLength = headerImageArray.length - 1;

    headerImageArray.forEach( (entry, i)=> {
      myprofileSocket.notifyOnlineFriendsOfCoverImageUpdate(entry.UUID, clients);
      doUpdate = headerImage.findOneAndUpdate({UUID:entry.UUID}, {headerImageData:entry.headerImageData}, {upsert: true}, (err)=> {
        if (err){
          return res.send(500, { error: err });
        }else{
          if( i >= loopLength ){
            return res.send("success");
          }
        }
      });
    });

  }else{
    return res.send("failure");
  }
});

router.post('/upsertProfileImage', requireLogin, (req, res)=> {
  let profileImageArray = req.body;
  let clients           = socketListener().getClients();
  if( profileImageArray !== undefined && profileImageArray[0] !== undefined){
    let doUpdate   = null;
    let loopLength = profileImageArray.length - 1;

    profileImageArray.forEach( (entry, i)=> {
      myprofileSocket.notifyOnlineFriendsOfProfileImageUpdate(entry.UUID, clients);
      doUpdate = profileImage.findOneAndUpdate({UUID:entry.UUID}, {profileImageData:entry.profileImageData}, {upsert: true}, (err)=> {
        if (err){
          return res.send(500, { error: err });
        }else{
          if( i >= loopLength ){
            return res.send("success");
          }
        }
      });
    });

  }else{
    return res.send("failure");
  }
});

router.post('/upsertMyProfile', requireLogin, (req, res)=> {
  let profilesArray = req.body;
  let clients       = socketListener().getClients();
  if( profilesArray !== undefined && profilesArray[0] !== undefined){
    let doUpdate   = null;
    let loopLength = profilesArray.length - 1;

    profilesArray.forEach( (entry, i)=> {
      myprofileSocket.notifyOnlineFriendsOfProfileUpdate(entry.UUID, clients);
      doUpdate = myProfile.findOneAndUpdate({UUID:entry.UUID}, {profileJSON:entry.myProfile}, {upsert: true}, (err)=> {
        if (err){
          return res.status(500).end();
        }else{
          if( i >= loopLength ){
            return res.status(200).send("success");
          }
        }
      });
    });

  }else{
    return res.send("failure");
  }
});

router.post('/upsertMyBiography', requireLogin, (req, res)=> {
  let biographyArray = req.body;
  let clients        = socketListener().getClients();
  if( biographyArray !== undefined && biographyArray[0] !== undefined){
    let doUpdate   = null;
    let loopLength = biographyArray.length - 1;

    biographyArray.forEach( (entry, i)=> {
      myprofileSocket.notifyOnlineFriendsOfBiographyUpdate(entry.UUID, clients);
      ( (cnt)=> {
        doUpdate = myBiography.findOneAndUpdate({UUID:entry.UUID}, {biography:entry.biography}, {upsert: true}, (err)=> {
          if (err){
            return res.status(500).end();
          }else{
            if( cnt >= loopLength ){
              return res.status(200).send("success");
            }
          }
        });
      })(i);

    });

  }else{
    return res.send("failure");
  }
});

router.get('/getAlbums', requireLogin, (req, res)=> {
  if( req.query.UUID !== undefined){
    myAlbums.find({friendUUID:req.query.UUID}, (err, docs)=> {
      if( docs[0] !== undefined){
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

router.get('/getAlbum', requireLogin, (req, res)=> {
  if( req.query.myUUID !== undefined){
    myAlbums.find({friendUUID:req.query.myUUID, albumUUID:req.query.albumUUID}, (err, docs)=> {
      if( docs[0] !== undefined){
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

router.get('/getPhotos', requireLogin, (req, res)=> {
  if( req.query.UUID !== undefined){
    myPhoto.find({albumUUID:req.query.UUID}, (err, docs)=> {
      if( docs[0] !== undefined){
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


router.post('/saveMyPhoto', requireLogin, (req, res)=> {
  myPhoto.create(req.body, (err)=> {
    if (err) {
      res.json(err);
      res.status(200).end();
    }else{
      return res.status(200).send("success").end();
    }
  });
});


router.post('/upsertMyAlbum', requireLogin, (req, res)=> {
  let myAlbumsArray  = req.body;
  if( myAlbumsArray !== undefined && myAlbumsArray[0] !== undefined){
    let doUpdate;
    let loopLength = myAlbumsArray.length - 1;

    myAlbumsArray.forEach( (entry, i)=> {
      ( (cnt)=> {
        doUpdate = myAlbums.findOneAndUpdate({
            albumUUID           : entry.albumUUID,
            authorHashForUpdate : entry.authorHashForUpdate,
            friendUUID          : entry.friendUUID
        }, entry, {upsert: true}, (err)=> {

          if (err){
            return res.status(500).end();
          } else{
            if( cnt >= loopLength ){
              return res.status(200).send("success");
            }
          }
        });
      })(i);

    });

  }else{
      return res.send("failure");
  }
});


module.exports = router;