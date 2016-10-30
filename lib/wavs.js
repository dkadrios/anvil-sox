(function () {
  'use strict';

  module.exports.use = function (gulp) {
    var _ = require('lodash'),
        bytes = require('bytes'),
        consume = require('stream-consume'),
        del = require('del'),
        fs = require('fs'),
        gutil = require('gulp-util'),
        path = require('path'),
        report = require('./report'),
        shell = require('gulp-shell'),
        tap = require('gulp-tap'),
        uniques = require('./uniques'),
        util = require('util'),

        folderIn = process.cwd() + '/wav-in/',
        folderTmp = process.cwd() + '/wav-tmp/',
        folderOut = process.cwd() + '/wav-out/';

    function cyan(out) {
      gutil.log(gutil.colors.cyan(out));
    }

    function numberOfUniques() {
      var result = 0,
          key;

      for (key in uniques.items) {
        if (uniques.items.hasOwnProperty(key)) {
          result++;
        }
      }
      return result;
    }

    function HandleError(level, error) {
      if (level === 'error') {
        gutil.log(gutil.colors.red('[FATAL]', error.message));
        process.exit(1);
      } else {
        gutil.log(gutil.colors.yellow('[WARN]', _.has(error, 'message') ? error.message : level));
        //noinspection JSUnresolvedFunction
        if (_.has(this, 'emit)')) {
          this.emit('end');
        }
      }
    }

    function OnWarning(error) {
      HandleError.call(this, 'warning', error);
    }

    gulp.task('preProcess',
        'Splits the TRS files into layers',
        function (done) {
          var totalFiles = 0,
              totalSize = 0;

          uniques.items = {};
          report.uniques = uniques;

          del(folderTmp);
          del(folderOut);

          gulp.src(folderIn + '*.wav')
              .pipe(tap(function (file) {
                var filename = path.basename(file.path),
                    srcPath = path.dirname(file.path) + '/' + filename,
                    destPath = srcPath.replace('wav-in', 'wav-out'),
                    stats = fs.statSync(file.path);

                uniques.parseFilename(filename);

                totalFiles++;
                totalSize += stats.size;

                // Don't write out here, just consume the stream.  We write the output in uniques.pairWithTRS()

                return consume(gulp.src([srcPath, destPath]));
              }))

              .on('end', function () {
                cyan(util.format('%d total files.', totalFiles));
                cyan(bytes.format(totalSize));
                cyan(util.format('%d unique samples', numberOfUniques()));
                gutil.log('');
                //report.reportUniques();
                //report.reportLayers();

                uniques.pairWithTRS(folderIn, folderTmp);

                done();
              });
        });

    gulp.task('preProcess:cleanup',
        ['preProcess'],
        shell.task([
          'mkdir wav-out'
        ], {
          cwd: process.cwd()
        }));

    gulp.task('build',
        'Goes through the wavs and tallies up metrics and builds the library.',
        ['preProcess:cleanup'],
        function () {
          gulp.src(folderTmp + '*.wav')
              .pipe(shell([
                'sox --no-dither ' +
                '<%= file.relative %> ' +
                'tmp.wav ' +
                'channels 2 ' +
                'silence 1 0.1 0.01% ' +
                'reverse ' +
                'silence 1 0.1 0.01% ' +
                'reverse',

                'cp tmp.wav <%= folderOut %><%= file.relative %>',

                'del tmp.wav'
              ], {
                verbose: false,
                quiet: false,
                cwd: folderTmp,
                templateData: {
                  folderOut: folderOut
                }
              }))
              .on('error', OnWarning);
        });

    return this;
  };
})();
