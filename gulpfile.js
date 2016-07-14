const gulp = require('gulp')
  , babel = require('gulp-babel')
  , rename = require('gulp-rename');

gulp.task('default', () => {
  return gulp.src('./src/*.js')
    .pipe(babel({
      presets: ['es2015', 'react']
    }))
    .pipe(gulp.dest('./dist'));
});