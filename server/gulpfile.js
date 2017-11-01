'use strict'

const del = require('del')
const gulp = require('gulp')
const path = require('path')
const ts = require('gulp-typescript')
const sourcemaps = require('gulp-sourcemaps')

const DIR_FOLD = path.join(__dirname, '/../dist')
const SRC_FOLD = path.join(__dirname, '/src')

const tsProject = ts.createProject(path.join(__dirname, '/tsconfig.json'))

gulp.task('copy-config', (callback) => {
    return gulp.src(path.join(__dirname, '/../config/*'))
        .pipe(gulp.dest(path.join(DIR_FOLD, '/config')))
})

gulp.task('build-models', (callback) => {
    return gulp.src(path.join(__dirname, '/../models/*'))
        .pipe(ts())
        .pipe(gulp.dest(path.join(DIR_FOLD, '/models')))
})

gulp.task('build', ['build-models', 'copy-config'],  (callback) => {
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .js
        .pipe(sourcemaps.write('.', { sourceRoot: './../../../server/src/' }))
        .pipe(gulp.dest(path.join(DIR_FOLD, '/server/src')))
})

gulp.task('clean', () => {
    return del([path.join(DIR_FOLD, '/server')])
})
