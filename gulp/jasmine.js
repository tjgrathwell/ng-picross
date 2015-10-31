var gulp = require('gulp');
var jasmineBrowser = require('gulp-jasmine-browser');
var conf = require('./conf');
var _ = require('lodash');
var wiredep = require('wiredep');
var path = require('path');
var angularFilesort = require('gulp-angular-filesort');
var merge2 = require('merge2');
var webpack = require('webpack-stream');

function listFiles() {
  var wiredepOptions = _.extend({}, conf.wiredep, {
    dependencies: true,
    devDependencies: true
  });

  var JasminePlugin = require('gulp-jasmine-browser/webpack/jasmine-plugin');
  var plugin = new JasminePlugin();

  var webpackConfig = {
    module: {
      loaders: [
        {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
      ]
    },
    output: {
      filename: 'spec.js'
    },
    plugins: [plugin]
  };

  return merge2(
    gulp.src(wiredep(wiredepOptions).js),
    gulp.src(path.join(conf.paths.src, '/app/**/*.js')).pipe(angularFilesort()),
    gulp.src([
      path.join(conf.paths.src, '/**/specHelper.js'),
      path.join(conf.paths.src, '/**/*.html')
    ]),
    gulp.src([
      path.join(conf.paths.src, '/test/spec/**/*.spec.js'),
    ]).pipe(webpack(webpackConfig))
  );
}

gulp.task('jasmine', function() {
  return listFiles()
    .pipe(jasmineBrowser.specRunner())
    .pipe(jasmineBrowser.server());
});

gulp.task('jasmine-phantom', function() {
  return listFiles()
    .pipe(jasmineBrowser.specRunner({console: true}))
    .pipe(jasmineBrowser.headless());
});
