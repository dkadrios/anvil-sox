const _ = require('lodash'),
    gutil = require('gulp-util'),

    layerHistogram = [];

function cyan() {
    gutil.log(gutil.colors.cyan.apply(this, arguments));
}

/*function red() {
    gutil.log(gutil.colors.red.apply(this, arguments));
}

function hasMissingLayers(arr) {
    let i;

    for (i = 1; i <= arr.length; i++) {
        if (i !== arr[i - 1].idx) {
            return true;
        }
    }
    return false;
}*/

module.exports.use = gulp => {
    gulp.task('report',
        'Analyzes the input stream and reports on available layers.',
        done => {
            const bytes = require('bytes'),
                consume = require('stream-consume'),
                fs = require('fs'),
                path = require('path'),
                report = require('./report'),
                tap = require('gulp-tap'),
                uniques = require('./uniques'),
                util = require('util'),
                folderIn = process.cwd() + '/wav-in';

            let totalFiles = 0,
                totalSize = 0;

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

            uniques.items = {};
            report.uniques = uniques;

            gulp.src(`${folderIn}/*.wav`)
                .pipe(tap(file => {
                    const filename = path.basename(file.path),
                        srcPath = `${path.dirname(file.path)}/${filename}`,
                        destPath = srcPath.replace('wav-in', 'wav-out'),
                        stats = fs.statSync(file.path);

                    uniques.parseFilename(filename);

                    totalFiles++;
                    totalSize += stats.size;

                    // Don't write out here, just consume the stream.  We write the output in uniques.pairWithTRS()

                    return consume(gulp.src([srcPath, destPath]));
                }))

                .on('end', () => {
                    cyan(util.format('%d total files.', totalFiles));
                    cyan(bytes.format(totalSize));
                    cyan(util.format('%d unique samples', numberOfUniques()));
                    gutil.log('');
                    report.reportUniques();
                    report.reportLayers();

                    uniques.pairWithTRS(folderIn, undefined);

                    done();
                });
        });
};

module.exports.reportLayers = () => {
    let key,
        item,
        i, j,
        s,
        MAX_SLOTS = 33,
        items = module.exports.uniques.items;

    // Clear histogram
    for (i = 0; i < MAX_SLOTS; i++) {
        layerHistogram.push(0);
    }

    for (key in items) {
        if (items.hasOwnProperty(key)) {
            item = items[key];
            layerHistogram[item.layers.length]++;
        }
    }

    for (i = 0; i < MAX_SLOTS; i++) {
        s = i + ' ';
        for (j = 0; j < layerHistogram[i]; j++) {
            s += '|';
        }
        cyan(s);
    }
};

module.exports.uniques = {};

module.exports.reportUniques = noteName => {
    let key,
        item,
        items = module.exports.uniques.items;

    for (key in items) {
        if (items.hasOwnProperty(key)) {
            item = items[key];

            if (!noteName || noteName === item.name) {
                item.layers = _.sortBy(item.layers, ['idx']);

                /*if (hasMissingLayers(item.layers)) {
                 red([item.name, 'is missing layer(s)', _.map(item.layers, 'idx')]);
                 }*/

                cyan(item.name);
                cyan(item.layers.length + ' layers');
                cyan(_.map(item.layers, 'idx'));
            }
        }
    }
};
