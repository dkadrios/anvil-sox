(function () {
  'use strict';

  module.exports.use = function (gulp) {
    var _ = require('lodash'),
        argv = require('yargs').argv,
        bytes = require('bytes'),
        consume = require('stream-consume'),
        del = require('del'),
        fs = require('fs'),
        //glob = require('glob'),
        gutil = require('gulp-util'),
        path = require('path'),
        report = require('./report'),
        shell = require('gulp-shell'),
        tap = require('gulp-tap'),
        trs = require('./trs'),
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
        function (done) {
          var totalFiles = 0,
              totalSize = 0,
              noteNum = argv.n || 0,
              noteName = trs.byNote(noteNum);

          uniques.items = {};
          report.uniques = uniques;

          del(folderTmp);

          if (noteNum) {
            del(folderOut + '*' + noteName + '.wav');
          } else {
            del(folderOut);
          }

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

                if (noteNum) {
                  report.reportUniques(noteName);
                }
                //report.reportLayers();

                uniques.pairWithTRS(folderIn, folderTmp);

                done();
              });
        });

    gulp.task('preProcess:cleanup',
        ['preProcess'],
        function () {
          var gulpIf = require('gulp-if'),
              noteNum = argv.n || 0;

          return gulp.src(__filename)
            .pipe(gulpIf(!noteNum, shell.task([
              'mkdir wav-out'
            ], {
              cwd: process.cwd()
            })));
        });

    gulp.task('build',
        'Goes through the input wavs and and compiles the library as output.',
        ['preProcess:cleanup'],
        function () {
          var noteNum = argv.n || 1,
              pattern = '*.wav';

          if (noteNum) {
            pattern = '*' + trs.byNote(noteNum) + 'wav';
          }

          return gulp.src(folderTmp + pattern)
              .pipe(shell([
                'sox ' +
                '--no-dither ' +
                '--norm ' +
                '<%= file.relative %> ' +
                'tmp.wav ' +
                'channels 2 ' +
                'silence 1 0.1 0.01% ' +
                'reverse ' +
                'silence 1 0.1 0.01% ' +
                'reverse',

                'cp tmp.wav <%= folderOut %><%= file.relative %>'
              ], {
                verbose: false,
                quiet: false,
                cwd: folderTmp,
                templateData: {
                  folderOut: folderOut
                }
              }))
              .on('error', OnWarning);
        }, {
          options: {
            'n': 'Note number to build [all]'
          }
        });

    gulp.task('play',
        'Listens to the wavs, layer by layer for a given note number.',
        function () {
          var noteNum = argv.n || 1,
              noteName = trs.byNote(noteNum),
              pattern = folderOut + '*' + noteName + '.wav';

          //console.log(pattern);
          //console.log(glob.sync(pattern));

          gulp.src(pattern)
              .pipe(shell([
                'sox ' +
                '<%= file.relative %> ' +
                '-t waveaudio'
              ], {
                verbose: false,
                quiet: false,
                cwd: folderOut
              }))
              .on('error', OnWarning);
        }, {
          options: {
            'n': 'Note number to play [1]'
          }
        });

    return this;
  };
})();
