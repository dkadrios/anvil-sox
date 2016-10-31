(function () {
  'use strict';

  var gulp = require('gulp');

  /**
   * @name fs
   * @property {Function} existsSync
   * @property {Function} readFileSync
   * @property {Function} statSync
   */

  /**
   * @name ts
   * @property {Function} fromNow
   */

  /**
   * @name argv
   */

  try {
    require('gulp-using');
  } catch (E) {}

  require('gulp-help')(gulp, {hideDepsMessage: true});
  require('./lib/report').use(gulp);
  require('./lib/validate').use(gulp);
  require('./lib/wavs').use(gulp);

  gulp.task('default', false, ['help']);
})();
