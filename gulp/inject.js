'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var nodeModules = require('./nodeModules');
var faviconReplacer = require('./favicon').faviconReplacer;

var $ = require('gulp-load-plugins')();

var _ = require('lodash');

var browserSync = require('browser-sync');

gulp.task('inject-reload', ['inject'], function() {
  browserSync.reload();
});

gulp.task('inject', ['scripts', 'styles'], function () {
  var injectStyles = gulp.src([
    path.join(conf.paths.tmp, '/serve/app/**/*.css'),
    path.join('!' + conf.paths.tmp, '/serve/app/vendor.css')
  ], { read: false });

  var injectScripts = gulp.src([
    path.join(conf.paths.src, '/app/**/*.module.js'),
    path.join(conf.paths.src, '/app/**/*.js'),
    path.join('!' + conf.paths.src, '/app/**/*.spec.js'),
    path.join('!' + conf.paths.src, '/app/**/*.mock.js'),
  ])
  .pipe($.angularFilesort()).on('error', conf.errorHandler('AngularFilesort'));

  var injectOptions = {
    ignorePath: [conf.paths.src, path.join(conf.paths.tmp, '/serve')],
    addRootSlash: false
  };

  var npmScripts = gulp.src(nodeModules.paths);

  return gulp.src(path.join(conf.paths.src, '/*.html'))
    .pipe(faviconReplacer)
    .pipe($.inject(npmScripts,  {name: 'npm', addPrefix: '..', addRootSlash: false}))
    .pipe($.inject(injectStyles, injectOptions))
    .pipe($.inject(injectScripts, injectOptions))
    .pipe(gulp.dest(path.join(conf.paths.tmp, '/serve')));
});
