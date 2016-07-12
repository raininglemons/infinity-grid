const gulp = require('gulp')
  , babel = require('gulp-babel')
  , rename = require('gulp-rename');

gulp.task('default', () => {
  return gulp.src('infinity-scroller.js')
    .pipe(babel({
      presets: ['es2015', 'react']
    }))
    .pipe(rename("index.js"))
    .pipe(gulp.dest('./'));
});