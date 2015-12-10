var gulp = require('gulp'),
	webserver = require('gulp-webserver'),
	htmlValidate = require('gulp-w3cjs'),
	cssValidate = require('gulp-css-validator'),
	jshint = require('gulp-jshint'),
	autoprefix = require('gulp-autoprefixer'),
	// concat = require('gulp-concat'),
	minifyHtml = require('gulp-minify-html'),
	uglify = require('gulp-uglify'),
	minifyCss = require('gulp-minify-css'),
	// gzip = require('gulp-gzip'),
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

var LINK = 'http://1270fa7b.ngrok.io';

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


// Images
gulp.task('resizeImages', function(){
	gulp.src(PATHS.images)
		.pipe(changed('src/images/'))
		.pipe(imageResize({
			width : 113,
			height : 0,
			crop : true,
			imageMagick : true
		}))
		// TODO: add gulp-imagemin?
		.pipe(rename(function(path){
			path.basename += '@2x';
		}))
		.pipe(gulp.dest('src/images/'))
		.pipe(imageResize({
			width : 100,
			height : 0,
			crop : true,
			imageMagick : true
		}))
		.pipe(rename(function(path){
			path.basename += '@1x';
		}))
		.pipe(gulp.dest('src/images/'));
});

// Thought it may be helpful to have the imageResize options here(Values listed are default):

// width : 0, //Pixel or % value
// height : 0,
// crop : false, // crop image to exactly match width and height
// upscale : false, // If false image is copied instead of resized if it would be upscaled
// gravity : Center, // only has effect if crop is true
// quality : 1, // Range from 0(bad) to 1(lossless) - Only affects JPG
// //format : jpeg, // Defaults to input
// filter : Catrom, // Catrom good for reduction, Hermite for enlarge
// imageMagick : false // Set to true when using ImageMagick


// Performance Related Tasks
gulp.task('optimizeHTML', function() {
	gulp.src(PATHS.content, {base: 'src/'})
		.pipe(minifyHtml())
		// .pipe(gzip({ append: false }))
		.pipe(gulp.dest(DIST.content));
});

//TODO: Make sure concat is happening in correct order
gulp.task('optimizeCSS', function() {
		gulp.src(PATHS.styles, {base: 'src/'})
			.pipe(sourcemaps.init())
				.pipe(autoprefix({
					browsers: ['> 5%']
				}))
			// 	.pipe(concat('styles.min.css')) // The problem lies here
				.pipe(minifyCss())
			.pipe(sourcemaps.write('srcmaps/'))
			// .pipe(gzip({ append: false }))
			.pipe(gulp.dest('dist'));
});

//TODO: Make sure concat is happening in correct order
gulp.task('optimizeJS', function() {
	gulp.src(PATHS.scripts, {base: 'src/'})
		.pipe(sourcemaps.init())
			// .pipe(concat('scripts.min.js'))
			.pipe(uglify())
		.pipe(sourcemaps.write('srcmaps/'))
		// .pipe(gzip({ append: false }))
		.pipe(gulp.dest('dist'));
});

// TEMPORARY: Copy images to dist
gulp.task('optimizeImages', function() {
	gulp.src(PATHS.images, {base: 'src/'})
		.pipe(imageResize({
			width : 113,
			height : 0,
			crop : true,
			imageMagick : true
		}))
		.pipe(imageMin({
			// optimizationLevel: 6,
			// progressive: true,
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
	// gulp.watch(paths.images, ['resizeImages']);
});

gulp.task('default', ['webserver', 'watch']);
gulp.task('build', ['optimizeHTML',
					'optimizeCSS',
					'optimizeJS',
					'optimizeImages']);