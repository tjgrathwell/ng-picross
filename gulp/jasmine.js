var gulp = require('gulp');
var jasmineBrowser = require('gulp-jasmine-browser');
var conf = require('./conf');
var _ = require('lodash');
var wiredep = require('wiredep');
var path = require('path');
var angularFilesort = require('gulp-angular-filesort');
var merge2 = require('merge2');

function listFiles() {
  var wiredepOptions = _.extend({}, conf.wiredep, {
    dependencies: true,
    devDependencies: true
  });

  return merge2(
    gulp.src(wiredep(wiredepOptions).js),
    gulp.src(path.join(conf.paths.src, '/app/**/*.js')).pipe(angularFilesort()),
    gulp.src([
      path.join(conf.paths.src, '/**/specHelper.js'),
      path.join(conf.paths.src, '/test/spec/**/*.spec.js'),
      path.join(conf.paths.src, '/**/*.html')
    ])
  );
}

gulp.task('jasmine', function() {
  return listFiles()
    .pipe(jasmineBrowser.specRunner())
    .pipe(jasmineBrowser.server({port: 8888}));
});

gulp.task('jasmine-phantom', function() {
  return listFiles()
    .pipe(jasmineBrowser.specRunner({console: true}))
    .pipe(jasmineBrowser.headless());
});
