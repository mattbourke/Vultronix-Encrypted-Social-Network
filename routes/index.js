'use strict';
const express    = require('express');
const router     = express.Router();

let requireLogin = (req, res, next)=> {
  if (!req.user) {
    res.json({logoutStatus:"logged Out"});
    res.status(200).end();
  } else {
    next();
  }
};


router.get('/', (req, res)=> {
  res.render('index', { title: "Use the product, don't become the product", age:10 });
  res.status(200).end();
});

module.exports = router;