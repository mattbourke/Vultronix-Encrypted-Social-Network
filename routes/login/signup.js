'use strict';
const express    = require('express');
const User       = require('./userModel').User;
const utils      = require('../../utils');
const router     = express.Router();

let userBruteforce = new ExpressBrute(store, {
  freeRetries     : 10,
  proxyDepth      : 1,
  minWait         : 5*60*1000, // 5 minutes
  maxWait         : 60*60*1000, // 1 hour,
  failCallback    : failCallback,
  handleStoreError: handleStoreError
});

let requireLogin = (req, res, next) => {
  if (!req.user) {
    res.json({logoutStatus:"logged Out"});
    res.status(200).end();
  } else {
    next();
  }
};

router.post('/signup', userBruteforce.prevent, (req, res) => {
  if (req.body.loginHash !== undefined) {
    User.find({loginHash:req.body.loginHash}, (err, docs) => {
      if ( docs[0] !== undefined){
        res.json({loginStatus:"failure login already exists"});
      }else{
        let instance = new User();
        instance.privateKeyString = req.body.privateKeyString;
        instance.publicKeyString  = req.body.publicKeyString;
        instance.UUID             = req.body.UUID;
        instance.loginHash        = req.body.loginHash;
        instance.save( (err) => {
          if (err){
            res.json({loginStatus:"failure"});
          }else{
            const user = {
              loginHash:  instance.loginHash,
            };
            utils.createUserSession(req, res, user);
            res.json({loginStatus:"success"});
          }
        });
      }
    });
  }else{
    res.json({loginStatus:"failure details required"});
  }
});


module.exports = router;