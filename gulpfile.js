const gulp = require("gulp");

const sass = require("gulp-sass")(require("sass"));
const autoprefixer = require("autoprefixer");
const postcss = require("gulp-postcss");

const htmlmin = require("gulp-htmlmin");
const cssnano = require("cssnano");
const fontmin = require("gulp-fontmin");
const imagemin = require("gulp-imagemin");

const babel = require("gulp-babel");
const terser = require("gulp-terser");
const browserSync = require("browser-sync").create();

const plumber = require("gulp-plumber");

const concat = require("gulp-concat");
const del = require("del");

const paths = {
  src: "src",
  html: {
    src: "src/**/*.html",
    dest: "dist",
  },
  styles: {
    src: "src/scss/**/*.scss",
    dest: "dist/css",
  },
  scripts: {
    src: "src/js/**/*.js",
    dest: "dist/js",
  },
  favicon: {
    src: "src/favicon.ico",
    dest: "dist",
  },
  images: {
    src: "src/assets/images/**/*",
    dest: "dist/assets/images",
  },
  fonts: {
    src: "src/assets/fonts/**/*",
    dest: "dist/assets/fonts",
  },
};


// Copies all html files
const html = () =>
  gulp
    .src(paths.html.src)
    .pipe(plumber())
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(paths.html.dest));

// Convert scss to css, auto-prefix and rename into styles.min.css
const styles = () =>
  gulp
    .src(paths.styles.src, { sourcemaps: true })
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest(paths.styles.dest, { sourcemaps: "." }));

// Minify all javascript files and concat them into a single app.min.js
const scripts = () =>
  gulp
    .src(paths.scripts.src, { sourcemaps: true })
    .pipe(plumber())
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(terser())
    .pipe(concat("app.min.js"))
    .pipe(gulp.dest(paths.scripts.dest, { sourcemaps: "." }));

// Copy the favicon
const favicon = () =>
  gulp
    .src(paths.favicon.src)
    .pipe(plumber())
    .pipe(gulp.dest(paths.favicon.dest));

// Copy and minify images
const images = () =>
  gulp
    .src(paths.images.src)
    .pipe(plumber())
    .pipe(imagemin())
    .pipe(gulp.dest(paths.images.dest));

function minifyFont(text, cb) {
  gulp
    .src(paths.fonts.src)
    .pipe(plumber())
    .pipe(
      fontmin({
        text: text,
      })
    )
    .pipe(gulp.dest(paths.fonts.dest))
    .on("end", cb);
}
// Copy and minify fonts
const fonts = (cb) => {
  var buffers = [];

  gulp
    .src(`${paths.src}/index.html`)
    .on("data", (file) => {
      buffers.push(file.contents);
    })
    .on("end", () => {
      var text = Buffer.concat(buffers).toString("utf-8");
      minifyFont(text, cb);
    });
};

// Clean the dist folder before running the build
const clean = () => del(["dist"]);

// Watches all files changes and executes the corresponding task
function browserSyncServe(cb) {
  browserSync.init({
    server: {
      baseDir: "dist",
    },
    notify: false,
  });
  cb();
}

// Reload the browser when files change
function syncReload(cb) {
  browserSync.reload();
  cb();
}

// Register a watch task
function registerWatch(type, fc) {
  gulp.watch(paths[type].src, gulp.series(fc, syncReload));
}

function watchTask() {
  registerWatch('html', html);
  registerWatch('styles', styles);
  registerWatch('scripts', scripts);
  registerWatch('favicon', favicon);
  registerWatch('images', images);
  registerWatch('fonts', fonts);
}

const build = gulp.series(
  clean,
  gulp.parallel(html, styles, scripts, fonts, favicon, images)
);

const watch = gulp.series(
  clean,
  html,
  styles,
  favicon,
  fonts,
  images,
  scripts,
  syncReload,
  browserSyncServe,
  watchTask
);

exports.clean = clean;
exports.html = html;
exports.styles = styles;
exports.fonts = fonts;
exports.images = images;
exports.scripts = scripts;
exports.watch = watch;
exports.build = build;
exports.default = watch;
