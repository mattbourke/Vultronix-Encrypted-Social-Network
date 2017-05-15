let flash       = require('connect-flash');
let Memcached   = require('memcached');
ExpressBrute    = require('express-brute');
MemcachedStore  = require('express-brute-memcached');
let config;
try {
  config = require('./config');
} catch(any) {
  //change this to something random.
  config              = {};
  config.cookieSecret = 'abc123';
}
store           = new MemcachedStore('127.0.0.1:11211');

//below is from https://www.npmjs.com/package/express-brute
// consider modifying it to suit our needs, also consider splitting it out into another file....and preventing global vars
// ------------------------------------------
failCallback = function (req, res, next, nextValidRequestDate) {
  req.flash('error', "You've made too many failed attempts in a short period of time");
  //TODO: add client side handling of a response for this
  res.redirect('#/login/'); // brute force protection triggered, send them back to the login page
};

handleStoreError = function (error) {
  console.log(error); // log this error so we can figure out what went wrong
  // cause node to exit, hopefully restarting the process fixes the problem
  throw {
    message: error.message,
    parent: error.parent
  };
};
// cut and paste out the bottom when/where needed
// No more than 100 login attempts per day per IP
const globalBruteforce = new ExpressBrute(store, {
  freeRetries            : 100,
  proxyDepth             : 1,
  attachResetToRequest   : false,
  refreshTimeoutOnRequest: false,
  minWait                : 25*60*60*1000, // 1 day 1 hour (should never reach this wait time)
  maxWait                : 25*60*60*1000, // 1 day 1 hour (should never reach this wait time)
  lifetime               : 24*60*60, // 1 day (seconds not milliseconds)
  failCallback           : failCallback,
  handleStoreError       : handleStoreError
});
// ------------------------------------------


// TODO: work out if the below should actually go here and be global like this or if it should be imported.
// set an environment variable for the address
memcached               = new Memcached("127.0.0.1:11211", {idle:4000});
// flush memcached with this,
// NOTE: this runs each time node restarts, this may eventually be commented out
memcached.flush(function (err) {

});
let express             = require('express');
app                     = express();
app.disable('X-Powered-By');
app.use(function(req, res, next) {
  res.removeHeader("X-Powered-By");
  res.header("X-powered-by", "Freedom")
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});

let http                = require('http').Server(app);
let socketListener      = require('./routes/socketListener')(http);
let compress            = require('compression');
let path                = require('path');
let favicon             = require('serve-favicon');
let logger              = require('morgan');
let cookieParser        = require('cookie-parser');
let bodyParser          = require('body-parser');
let session             = require('client-sessions');
let bcrypt              = require('bcryptjs');
let csrf                = require('csurf');
let mongoose            = require('mongoose');
let routes              = require('./routes/index');
let login               = require('./routes/login/login');
let friendrequest       = require('./routes/friendrequest/friendrequest');
let feed                = require('./routes/feed/feed');
let friends             = require('./routes/friends/friends');
let inbox               = require('./routes/inbox/inbox');
let logout              = require('./routes/login/logout');
let myprofile           = require('./routes/myprofile/myprofile');
let signup              = require('./routes/login/signup');
let users               = require('./routes/users');
let groups              = require('./routes/groups/groups');
let middleware          = require('./middleware');

// error handlers

module.exports.createUserSession = function(req, res, user) {
  let cleanUser = {
    loginHash:  user.loginHash,
    data:       user.data || {},
  };

  req.session.user = cleanUser;
  req.user         = cleanUser;
  res.locals.user  = cleanUser;
};


module.exports.createApp = function() {
  mongoose.connect('mongodb://localhost/svcc');
  app.use(compress());
  app.use(flash());
  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'hjs');
  // uncomment after placing your favicon in /public
  //app.use(favicon(__dirname + '/public/favicon.ico'));
  app.use(logger('dev'));
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));
  app.use(cookieParser());
  app.use(require('less-middleware')(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(session({
    cookieName: 'session',
    secret: config.cookieSecret,
    duration:       48 * 60 * 60 * 1000,
    activeDuration: 48 * 60 * 60 * 1000,
  }));
  // app.use(csrf());
  app.use(middleware.simpleAuth);

  app.use('/',              routes);
  app.use('/login',         login);
  app.use('/friendrequest', friendrequest);
  app.use('/feed',          feed);
  app.use('/friends',       friends);
  app.use('/inbox',         inbox);
  app.use('/logout',        logout);
  app.use('/myprofile',     myprofile);
  app.use('/signup',        signup);
  app.use('/users',         users);
  app.use('/groups',        groups);


  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
      let err    = new Error('Not Found');
      err.status = 404;
      next(err);
  });

  // development error handler
  // will print stacktraceu
  // if (app.get('env') === 'development') {
  //     app.use(function(err, req, res, next) {
  //         res.status(err.status || 500);
  //         res.render('error', {
  //             message: err.message,
  //             error: err
  //         });
  //     });
  // }

  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
  }));

  app.use(bodyParser.json({limit: '50mb'}));


  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
          message: err.message,
          error: {}
      });
  });

  return app;
};


http.listen(9000, function() {

});

module.exports.createApp();
module.exports = app;