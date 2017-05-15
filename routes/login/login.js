'use strict';
const express      = require('express');
const User         = require('./userModel').User;
const utils        = require('../../utils');
const requireLogin = require('../security').requireLogin;
const router       = express.Router();

let userBruteforce = new ExpressBrute(store, {
  freeRetries     : 10,
  proxyDepth      : 1,
  minWait         : 5*60*1000, // 5 minutes
  maxWait         : 60*60*1000, // 1 hour,
  failCallback    : failCallback,
  handleStoreError: handleStoreError
});

router.get('/isLoggedOut', requireLogin, (req, res)=> {
  res.json({logoutStatus:false});
  res.status(200).end();
});


router.get('/', (req, res)=> {
  res.render('login');
  res.status(200).end();
});

router.post('/login', userBruteforce.prevent, (req, res)=> {
  if( req.body.loginHash !== undefined){
    User.find({loginHash:req.body.loginHash}, (err, docs)=> {
      if(err){
        res.json({loginStatus:"failure"});
      }else if( docs[0] !== undefined){
        const credentials = {
          privateKeyString : docs[0].privateKeyString,
          publicKeyString  : docs[0].publicKeyString,
          UUID             : docs[0].UUID,
          loginHash        : docs[0].loginHash,
          loginStatus      : "success"
        };
        const user = {
          loginHash:  credentials.loginHash,
        };
        utils.createUserSession(req, res, user);
        res.json(credentials);
      }else{
        res.json({loginStatus:"failure"});
      }
    });
  }else{
    res.json({loginStatus:"failure"});
  }
});

module.exports = router;