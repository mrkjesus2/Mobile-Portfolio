var gulp = require('gulp'),
	webserver = require('gulp-webserver'),
	htmlValidate = require('gulp-w3cjs'),
	cssValidate = require('gulp-css-validator'),
	jshint = require('gulp-jshint'),
	autoprefix = require('gulp-autoprefixer'),
	minifyHtml = require('gulp-minify-html'),
	uglify = require('gulp-uglify'),
	minifyCss = require('gulp-minify-css'),
	inlineSource = require('gulp-inline-source'),
	sourcemaps = require('gulp-sourcemaps'),
	through2 = require('through2'), // required by the code supplied by w3cjs
	imageResize = require('gulp-image-resize'),
	imageMin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	jpegoptim = require('imagemin-jpegoptim'),
	rename = require('gulp-rename'),
	changed = require('gulp-changed'),
	beep = require('beepbeep'), //provide audio feedback on errors
	chalk = require('chalk'),//; //color console log output
	ngrok = require('ngrok'), //Here in case a update happens soon
	pageSpeed = require('psi');

// Set your paths here
var PATHS = {
	scripts: ['src/js/*.js', 'src/views/js/*.js'],
	styles: ['src/css/*.css', 'src/views/css/*.css'],
	images: ['src/img/*.{gif,jpg,png,svg}', 'src/views/images/*.{gif,jpg,png,svg}'],
	content: ['src/*.html', 'src/views/*.html']
}

var DIST = {
	scripts: 'dist/js/',
	styles: 'dist/css/',
	images: 'dist/',
	content: 'dist',
	srcmaps: 'dist/srcmaps'
}

// Change the link for ngrok (Here due to ngrok api bug)
var LINK = 'http://913138f0.ngrok.io';

// Our live reload webserver
gulp.task('webserver', function(){
	gulp.src('src/')
		.pipe(webserver({
			livereload: true,
			open: true,
			host: '0.0.0.0',
			port: 8080,
		}));
});


// Validators
gulp.task('validateHtml', function(){
	gulp.src(PATHS.content)
		.pipe(htmlValidate())
		// code from w3cjs documentation - except if contents
		.pipe(through2.obj(function(file, enc, cb){
			cb(null, file);
			if (!file.w3cjs.success){
			    beep();
				console.log(chalk.bgRed.bold('HTML validation error(s) found'));
			}
		}));
});

gulp.task('validateCss', function(){
	gulp.src(PATHS.styles)
		.pipe(cssValidate())
		.on('error', function(err){
			beep();
			console.log(chalk.bgRed.bold('CSS validation error(s) found'));
		});
});

gulp.task('jshint', function(){
	gulp.src(PATHS.scripts)
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(through2.obj(function(file, enc, cb){
			cb(null, file);
			if (!file.jshint.success){
			    beep();
				console.log(chalk.bgRed.bold('Javascript validation error(s) found'));
			}
		}));
});

// Performance Related Tasks
gulp.task('optimizeHTML', function() {
	gulp.src(PATHS.content, {base: 'src/'})
		.pipe(inlineSource())
		.pipe(minifyHtml())
		.pipe(gulp.dest(DIST.content));
});

gulp.task('optimizeCSS', function() {
		gulp.src(PATHS.styles, {base: 'src/'})
			.pipe(sourcemaps.init())
				.pipe(autoprefix({
					browsers: ['> 5%']
				}))
				.pipe(minifyCss())
			.pipe(sourcemaps.write('srcmaps/'))
			.pipe(gulp.dest('dist'));
});

gulp.task('optimizeJS', function() {
	gulp.src(PATHS.scripts, {base: 'src/'})
		.pipe(sourcemaps.init())
			.pipe(uglify())
		.pipe(sourcemaps.write('srcmaps/'))
		.pipe(gulp.dest('dist'));
});

gulp.task('optimizeImages', function() {
	gulp.src(PATHS.images, {base: 'src/'})
		.pipe(imageResize({
			width : 113,
			height : 0,
			crop : true,
			imageMagick : true
		}))
		.pipe(imageMin({
			use: [pngquant({ quality: '45-55'}),
				  jpegoptim({ progressive: true, max: 30 })]
		}))
		.pipe(gulp.dest('dist'));
})

gulp.task('speed', function() {
	pageSpeed(LINK).then(function (data) {
		console.log(data.pageStats);
	});
	pageSpeed.output(LINK, {threshold: 95});
	pageSpeed.output(LINK, {strategy: 'desktop', threshold: 95});
});

// Watch function to tie it all together
gulp.task('watch', function(){
	gulp.watch(PATHS.content, ['validateHtml']);
	gulp.watch(PATHS.styles, ['validateCss']);
	gulp.watch(PATHS.scripts, ['jshint']);
});

gulp.task('default', ['webserver', 'watch']);
gulp.task('build', ['optimizeHTML',
					'optimizeCSS',
					'optimizeJS',
					'optimizeImages']);