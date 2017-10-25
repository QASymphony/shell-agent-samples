var gulp = require("gulp");
var ts = require("gulp-typescript");
var del = require('del');
var runSequence = require('run-sequence');
var tsProject = ts.createProject("tsconfig.json");

// Clean all scripts in 'dist' directory
gulp.task('build-clean', function () {
  return del('.dist/*');
});

// Compile all *.ts files
gulp.task('compile-ts-scripts', function () {
  return tsProject.src()
    .pipe(tsProject())
    .pipe(gulp.dest(".dist"));
});

gulp.task('default', function (callback) {
  runSequence('build-clean', 'compile-ts-scripts', callback);
});