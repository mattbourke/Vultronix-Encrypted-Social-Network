
module.exports.requireLogin = function(req, res, next) {
  if (!req.user) {
  	let response          = {};
  	response.logoutStatus = "loggedOut";
    res.json(response);
  } else {
    next();
  }
};
