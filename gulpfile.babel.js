'use strict';
import gulp        from 'gulp';
import concat      from 'gulp-concat';
import cssmin      from 'gulp-cssmin';
import uglify      from 'gulp-uglify';
import babel       from 'gulp-babel';
import sourcemaps  from 'gulp-sourcemaps';
import rename      from 'gulp-rename';
import runSequence from 'run-sequence';
var paths       = {
  JSDirectory     : "public/javascripts/",
  buildDirectory  : 'public/javascripts/build/',
  applicationJS   : "public/app/**/*.js",
  toConcatForBabel: [
                    "public/javascripts/ngapp.js",
                    "public/app/**/*.js",
                    "public/javascripts/main.js"
                  ],
  fileToBabelify  : 'public/javascripts/build/vultronix.min.js',
  toUglify        :["public/javascripts/babelified.js",
                    "public/javascripts/qrcode.js",
                    "public/javascripts/angular-qrcode.js"
                  ],
  jsFilesToConcat : [
                    "public/javascripts/encryption.js",
                    "public/javascripts/emojify.min.js",
                    "public/javascripts/openpgp.min.js",
                    "public/javascripts/socket.io/socket.io-1.3.7.js",
                    "public/javascripts/angular.min.js",
                    "public/javascripts/ui-bootstrap-custom-tpls-0.12.1.min.js",
                    "public/javascripts/angular-route.min.js",
                    "public/javascripts/angular-bootstrap-lightbox.min.js",
                    "public/javascripts/ng-videosharing-embed.min.js",
                    "public/javascripts/socket.js",
                    "public/javascripts/moment.min.js",
                    "public/javascripts/vultronix.min.js",
                   ],
  cssSource       : 'public/stylesheets/tidy.css',
  cssDestination  : 'public/stylesheets/'
};

gulp.task('concatForBabel', ()=> {
  return gulp.src(paths.toConcatForBabel)
      .pipe(concat('vultronix.min.js'))
    .pipe(gulp.dest(paths.buildDirectory));
});

gulp.task("babelify", ()=> {
  return gulp.src(paths.fileToBabelify)
    .pipe(babel({
            presets  : ['es2015']
        }))
        .pipe(rename({
                    basename : "babelified",
                    extname  : ".js"
                }))
    .pipe(gulp.dest(paths.JSDirectory));
});

gulp.task('concatForUglify', ()=> {
  return gulp.src(paths.toUglify)
      .pipe(concat('vultronix.min.js'))
    .pipe(gulp.dest(paths.JSDirectory));
});

gulp.task('uglifyJS', ()=> {
  return gulp.src('public/javascripts/vultronix.min.js')
        .pipe(uglify())
        .pipe(rename({
                    basename : "vultronix.min",
                    extname  : ".js"
                }))
    .pipe(gulp.dest(paths.JSDirectory));
});


gulp.task('concatAllJS', ()=> {
  return gulp.src(paths.jsFilesToConcat)
    .pipe(sourcemaps.init())
    .pipe(concat('lib.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.JSDirectory));
});

gulp.task('css', ()=> {
  return gulp.src(paths.cssSource)
        .pipe(cssmin())
        .pipe(rename({
                    suffix   : '.min',
                    basename : "app",
                    extname  : ".css"
                }))
    .pipe(gulp.dest(paths.cssDestination));
});

gulp.task('scripts', ()=>{
    runSequence('concatForBabel', 'babelify', 'concatForUglify', 'uglifyJS', 'concatAllJS');
});


gulp.task('watch', ()=> {
  gulp.watch([paths.applicationJS, 'gulpfile.babel.js'], ['scripts']);
  gulp.watch(paths.cssSource, ['css']);
});

gulp.task('default', ()=>{
    // 2 taks in first argument (array) will run asynch, the next will wait for the previous before starting
    runSequence(['css', 'concatForBabel'], 'babelify', 'concatForUglify', 'uglifyJS', 'concatAllJS');
});

