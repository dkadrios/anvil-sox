module.exports.use = gulp => {
    const _ = require('lodash'),
        argv = require('yargs').argv,
        bytes = require('bytes'),
        consume = require('stream-consume'),
        del = require('del'),
        fs = require('fs'),
        gutil = require('gulp-util'),
        path = require('path'),
        report = require('./report'),
        shell = require('gulp-shell'),
        tap = require('gulp-tap'),
        trs = require('./trs'),
        uniques = require('./uniques'),

        folderIn = process.cwd() + '/wav-in',
        folderTmp = process.cwd() + '/wav-tmp',
        folderOut = process.cwd() + '/wav-out';

    let totalInputFiles = 0,
        totalOutputFiles = 0;

    function cyan(out) {
        gutil.log(gutil.colors.cyan(out));
    }

    function numberOfUniques() {
        let result = 0,
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
            gutil.log(gutil.colors.red(`[FATAL] ${error.message}`));
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
        done => {
            let totalSize = 0,
                noteNum = argv.n || 0,
                noteName = trs.byNote(noteNum),
                pattern = '*.wav';

            totalInputFiles = 0;

            if (noteNum) {
                pattern = noteName + '*.wav';
                pattern = pattern.replace(/_| /g, '*');
            }

            uniques.items = {};
            report.uniques = uniques;

            del(folderTmp);

            if (noteNum) {
                del(`${folderOut}/*${noteName}.wav`);
            } else {
                del(folderOut);
            }

            gulp.src(`${folderIn}/${pattern}`)
                .pipe(tap(file => {
                    const filename = path.basename(file.path),
                        srcPath = `${path.dirname(file.path)}/${filename}`,
                        destPath = srcPath.replace('wav-in', 'wav-out'),
                        stats = fs.statSync(file.path);

                    uniques.parseFilename(filename);

                    totalInputFiles++;
                    totalSize += stats.size;

                    // Don't write out here, just consume the stream.  We write the output in uniques.pairWithTRS()

                    return consume(gulp.src([srcPath, destPath]));
                }))

                .on('end', () => {
                    cyan(`${totalInputFiles} total input files.`);
                    cyan(`${bytes.format(Math.round(totalSize))} in samples.`);
                    cyan(`${numberOfUniques()} unique sample sources.`);

                    if (noteNum) {
                        report.reportUniques(noteName);
                    }
                    //report.reportLayers();

                    totalOutputFiles = uniques.pairWithTRS(folderIn, folderTmp);

                    cyan(`${totalOutputFiles} files to be outputted.\n`);

                    done();
                });
        });

    gulp.task('preProcess:cleanup',
        ['preProcess'],
        done => {
            const noteNum = argv.n || 0;

            if (!noteNum) {
                fs.mkdirSync(folderOut);
            }
            done();
        });

    gulp.task('build',
        'Goes through the input wavs and and compiles the library as output.',
        ['preProcess:cleanup'],
        () => {
            const noteNum = argv.n || 0,
                path = require('path'),
                ProgressBar = require('progress'),
                bar = new ProgressBar(
                    '  processing [:bar] :percent :filename', {
                        total: totalOutputFiles,
                        complete: '=',
                        incomplete: '-',
                        width: 20
                    });

            let pattern = '*.wav';

            if (noteNum) {
                pattern = `*${trs.byNote(noteNum)}.wav`;
            }

            function processEffects(file) {
                let noteName = path.basename(file.path, '.wav'),
                    panningValue;

                bar.tick(1, {
                    filename: noteName
                });

                noteName = noteName.substr(5); // strip WT number
                panningValue = trs.find({name: noteName}).panning;

                file.panLeft = 1;
                file.panRight = 1;
                file.reverb = trs.find({name: noteName}).reverb;

                if (panningValue > 0) {
                    // Calculate "left"
                    file.panLeft = Math.abs((panningValue + 10) / 10 - 2);

                } else if (panningValue < 0) {
                    // Calculate "right"
                    file.panRight = 1 + panningValue / 10;
                }
            }

            return gulp.src(`${folderTmp}/${pattern}`, {read: false})
                .on('error', OnWarning)

                .pipe(tap(file => {
                    processEffects(file);
                }))

                .pipe(shell([
                    // Ensure the file is stereo, trimmed and normalized
                    'sox ' +
                    '--no-dither ' +
                    '--norm ' +
                    '<%= file.relative %> ' +
                    // 'rate 48k ' +
                    //'bits 16 ' +
                    'tmp.m.wav ' +
                    'channels 2 ' +
                    'silence 1 0.1 0% ' +
                    'reverse ' +
                    'silence 1 0.1 0% ' +
                    'reverse ' +
                    'reverb <%= file.reverb %>',

                    // Split the stereo channels into two files, adjusting the volume to pan
                    'sox -v <%= file.panLeft %> tmp.m.wav tmp.l.wav remix 1',
                    'sox -v <%= file.panRight %> tmp.m.wav tmp.r.wav remix 2',

                    // Recombine the two channels into one stereo file
                    'sox -M -c 1 tmp.l.wav -c 1 tmp.r.wav tmp.wav',

                    // Move the file over to output
                    'cp tmp.wav <%= folderOut %>/<%= file.relative %>'
                ], {
                    verbose: false,
                    quiet: false,
                    cwd: folderTmp,
                    templateData: {
                        folderOut: folderOut
                    }
                }));
        }, {
            options: {
                'n': 'Note number to build [all]'
            }
        });

    gulp.task('play',
        'Listens to the wavs, layer by layer for a given note number.',
        () => {
            const noteNum = argv.n || 1,
                noteName = trs.byNote(noteNum),
                pattern = `${folderOut}/*${noteName}.wav`;

            //console.log(pattern);
            //console.log(glob.sync(pattern));

            gulp.src(pattern)
                .pipe(shell([
                    'play ' +
                    '<%= file.relative %>'
                ], {
                    verbose: false,
                    quiet: true,
                    cwd: folderOut + '/'
                }))
                .on('error', OnWarning);
        }, {
            options: {
                'n': 'Note number to play [1]'
            }
        });

    return this;
};
