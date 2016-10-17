var gulp = require('gulp');
var jasmineBrowser = require('gulp-jasmine-browser');
var conf = require('./conf');
var _ = require('lodash');
var path = require('path');
var merge2 = require('merge2');
var webpack = require('webpack-stream');
var $ = require('gulp-load-plugins')();
var nodeModules = require('./nodeModules');

function listFiles(options) {
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

  var testOnlyScripts = ['node_modules/angular-mocks/angular-mocks.js'];
  var npmScripts = nodeModules.paths.concat(testOnlyScripts);

  var mergedStreams = merge2(
    gulp.src(npmScripts),
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
  var headlessOptions = {};
  if (process.argv.length > 3 && process.argv[3] == '--spec') {
    headlessOptions.spec = process.argv[4];
  }
  return listFiles()
    .pipe(jasmineBrowser.specRunner({console: true}))
    .pipe(jasmineBrowser.headless(headlessOptions));
});
