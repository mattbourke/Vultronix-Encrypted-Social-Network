'use strict';
const express = require('express');
const router  = express.Router();

let requireLogin = (req, res, next)=> {
  if (!req.user) {
    res.json({logoutStatus:"logged Out"});
    res.status(200).end();
  } else {
    next();
  }
};

router.post('/logout', (req, res)=> {
  if (req.session) {
    req.session.reset();
  }
  res.json({logoutStatus:"success"});
  res.status(200).end();
});

module.exports = router;