(function () {
  'use strict';

  module.exports.use = function (gulp) {
    var consume = require('stream-consume'),
        eslint = require('gulp-eslint');

    function eslintWantErrors(done) {
      var result = null,
          stream = gulp.src('**/*.js')
              .pipe(eslint())
              .pipe(eslint.format())
              .pipe(eslint.failAfterError())
              .on('error', function (error) {
                result = error;
                //noinspection JSUnresolvedFunction
                this.emit('end');
              })
              .on('end', function () {
                done(result);
              });

      /**
       * Gulp weirdness.  If stream produces no output (e.g. gulp.dest) then on('end') never fires.
       *
       * consume() ensure the stream is fully consumed so the event will fire.
       */
      consume(stream);
    }

    gulp.task('lint',
        'Validates your JS, reporting any encountered problems.',
        function (done) {
          eslintWantErrors(done);
        });

    return this;
  };
})();
