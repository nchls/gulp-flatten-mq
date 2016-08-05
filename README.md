# gulp-flatten-mq
**A Gulp task to unwrap CSS rules from inside width-based media queries.**

This can be useful for creating a static-width variant of a responsive or adaptive design. Your output stylesheet will contain any CSS outside viewport media queries first. Following that, rules from inside min-width media queries will be appended in ascending order of viewport size to ensure correct precedence. Rules from inside max-width media queries are stripped out entirely.

## Installation
```npm install --save-dev gulp-flatten-mq```

## Usage
```
var gulp = require('gulp');
var flattenMq = require('gulp-flatten-mq');

gulp.task('flatten', function() {
  gulp.src('./*.css')
    .pipe(flattenMq())
    .pipe(gulp.dest('./dist'));
});
```
