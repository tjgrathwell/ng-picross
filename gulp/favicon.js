var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'uglify-save-license', 'del']
});

var iconFilename;
if (process.env.NODE_ENV == 'production') {
  iconFilename = 'favicon.ico';
} else {
  iconFilename = 'favicon-development.ico';
}

exports.faviconReplacer = $.htmlReplace({
  favicon: {
    src: iconFilename,
    tpl: '<link rel="icon" href="assets/images/%s" type="image/x-icon" />'
  }
});
