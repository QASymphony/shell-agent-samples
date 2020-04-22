var gulp = require("gulp");
var ts = require("gulp-typescript");
var del = require("del");
var tsProject = ts.createProject("tsconfig.json");

// Clean all scripts in 'dist' directory
function clean() {
  return del('.dist/*');
};

// Compile all *.ts files
function compileTypeScript() {
  return tsProject.src()
    .pipe(tsProject())
    .pipe(gulp.dest(".dist"));
};

module.exports.default = gulp.series(clean, compileTypeScript);