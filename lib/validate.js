module.exports.use = gulp => {
    const consume = require('stream-consume'),
        eslint = require('gulp-eslint');

    function eslintWantErrors(done) {
        let result;

        const stream = gulp.src('**/*.js')
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(eslint.failAfterError())
            .on('error', function (error) {
                result = error;
                //noinspection JSUnresolvedFunction
                this.emit('end');
            })
            .on('end', () => done(result));

        /**
         * Gulp weirdness.  If stream produces no output (e.g. gulp.dest) then on('end') never fires.
         *
         * consume() ensure the stream is fully consumed so the event will fire.
         */
        consume(stream);
    }

    gulp.task('lint',
        done => eslintWantErrors(done));

    return this;
};
