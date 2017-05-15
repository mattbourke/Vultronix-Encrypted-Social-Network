'use strict';
const express      = require('express');
const requireLogin = require('../security').requireLogin;
const router       = express.Router();

router.get('/friendProfile', requireLogin, (req, res)=> {
  res.json(friends[req.query.friendUUID - 1]);
  // with the above consider grabbing their actual friend ID, rather than simply order of the item on the page
  // as the first item on the page is 1 but array starts at 0
  res.status(200).end();
});

module.exports = router;