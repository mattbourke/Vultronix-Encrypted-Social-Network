// Karma configuration
// Generated on Tue Mar 01 2016 09:08:47 GMT+0000 (GMT Standard Time)

module.exports = function(config) {
  config.set({

    // NOTE: we only use Karma for client side JS
    // backend is Mocha + grunt + chai + sinon
    // the reason for using more than one testing framework is solely educational


    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
            "public/javascripts/moment.min.js",
            "public/javascripts/openpgpjs/openpgp.min.js",
            "public/javascripts/openpgpjs/sha256.js",
            "public/javascripts/openpgpjs/sha512.js",
            "public/javascripts/openpgpjs/aes.js",
            "public/javascripts/encryption.js",
            "public/javascripts/emojify.min.js",
            "public/javascripts/qrcode.js",
            'bower_components/angular/angular.js',
            "public/javascripts/angular-idle.min.js",
            "public/javascripts/angular-qrcode.js",
            "public/javascripts/ui-bootstrap-custom-tpls-0.12.1.min.js",
            "public/javascripts/angular-bootstrap-lightbox.min.js",
            "public/javascripts/ng-videosharing-embed.min.js",
            'bower_components/angular-mocks/angular-mocks.js',
            'bower_components/angular-resource/angular-resource.js',
            "public/javascripts/angular-route.min.js",
            "public/javascripts/socket.io/socket.io-1.3.7.js",
            "public/javascripts/socket.js",
            "public/javascripts/ngapp.js",
            'public/app/**/*.js',
            'tests/app/**/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
