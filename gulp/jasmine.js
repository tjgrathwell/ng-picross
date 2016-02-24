var gulp = require('gulp');
var jasmineBrowser = require('gulp-jasmine-browser');
var conf = require('./conf');
var _ = require('lodash');
var wiredep = require('wiredep');
var path = require('path');
var merge2 = require('merge2');
var webpack = require('webpack-stream');
var $ = require('gulp-load-plugins')();

function listFiles(options) {
  var wiredepOptions = _.extend({}, conf.wiredep, {
    dependencies: true,
    devDependencies: true
  });

  var JasminePlugin = require('gulp-jasmine-browser/webpack/jasmine-plugin');
  var plugin = new JasminePlugin();

  var webpackConfig = {
    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel?presets[]=es2015',
        }
      ]
    },
    output: {
      filename: 'spec.js'
    },
    plugins: [plugin]
  };

  webpackConfig.watch = options && options.watch;

  var templates = gulp.src([
    path.join(conf.paths.src, '/app/**/*.html'),
  ]).pipe($.angularTemplatecache('templateCacheHtml.js', {
    module: 'ngPicrossApp',
    root: 'app'
  }));

  var srcFiles = path.join(conf.paths.src, '/app/**/*.js');

  var mergedStreams = merge2(
    gulp.src(wiredep(wiredepOptions).js),
    gulp.src(srcFiles).pipe($.angularFilesort()),
    gulp.src(path.join(conf.paths.src, '/**/specHelper.js')),
    templates,
    gulp.src(path.join(conf.paths.src, '/test/spec/**/*.spec.js'))
      .pipe(webpack(webpackConfig))
  );

  if (options && options.watch) {
    return mergedStreams.pipe($.watch(srcFiles));
  } else {
    return mergedStreams;
  }
}

gulp.task('jasmine', function() {
  return listFiles({watch: true})
    .pipe(jasmineBrowser.specRunner())
    .pipe(jasmineBrowser.server());
});

gulp.task('jasmine-phantom', function() {
  return listFiles()
    .pipe(jasmineBrowser.specRunner({console: true}))
    .pipe(jasmineBrowser.headless());
});
