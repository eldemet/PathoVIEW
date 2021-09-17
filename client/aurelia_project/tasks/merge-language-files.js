import gulp from 'gulp';
import merge from 'gulp-merge-json';
import debug from 'gulp-debug';

/***
 *
 * @param done
 * @param lang
 * @param srcCommon
 * @param srcSpecific
 * @param destination
 * @returns {*}
 */
function mergeLanguageFiles(done, lang, srcCommon, srcSpecific, destination) {
    return gulp.src([
        srcCommon + '/locales/' + lang + '/*.json',
        srcSpecific + '/locales/' + lang + '/*.json'
    ])
        .pipe(debug())
        .pipe(merge({
            fileName: 'translation.json'
        }))
        .pipe(gulp.dest(destination + '/' + lang))
        .on('error', () => console.log('Error occurred...'))
        .on('end', () => done());
}

function de(done) {
    return mergeLanguageFiles(done, 'de', 'node_modules/library-aurelia', '.', './static/locales');
}

function en(done) {
    return mergeLanguageFiles(done, 'en', 'node_modules/library-aurelia', '.', './static/locales');
}

export default gulp.series(
    de,
    en
);
