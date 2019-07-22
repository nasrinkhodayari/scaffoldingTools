const gulp = require("gulp");
const fs = require("fs");
const del = require("del");
const archiver = require("archiver");
const execSync = require("child_process").execSync;
const sequence = require('run-sequence');
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const sourcemaps = require('gulp-sourcemaps');
const webpack = require("webpack");
const cleanCss = require("gulp-clean-css");
const change = require("gulp-change");
const hash = require("hash-generator")(8);

const pkg = JSON.parse(fs.readFileSync("package.json"));
const bb = JSON.parse(fs.readFileSync("bbrc.json"));

const config = {
    name: pkg.name,
    production: false,
    bb: {
        scheme: bb.scheme,
        host: bb.host,
        port: bb.port,
        username: bb.username,
        password: bb.password,
        staticsRoot: "../../../cxp/statics/dist/itemRoot/static",
        contextRoot: "../../../cxp/webapps/portalserver/target/portalserver/static",
    },
    dir: {
        root: __dirname,
        src: "src",
        dist: "dist",
        release: "dist/release"
    }
}

gulp.task("production", () => config.production = true);

gulp.task("clean", () => del.sync(config.dir.dist));

gulp.task("index", () => {
    return gulp.src(`${config.dir.src}/*.*`)
        .pipe(gulp.dest(config.dir.release));
});

gulp.task("index:watch", () => {
    gulp.watch(`${config.dir.src}/*.*`, () => sequence("index", "import"));
});

gulp.task("template", () => {
    return gulp.src(`${config.dir.src}/templates/**/*`)
        .pipe(change(replacePlaceholders))
        .pipe(gulp.dest(`${config.dir.release}/templates`));
});

gulp.task("template:watch", () => {
    gulp.watch(`${config.dir.src}/templates/**/*`, () => sequence("template", "import"));
});

gulp.task("media", () => {
    return gulp.src(`${config.dir.src}/media/**/*`)
        .pipe(gulp.dest(`${config.dir.release}/media`));
});

gulp.task("media:watch", () => {
    gulp.watch(`${config.dir.src}/media/**/*`, () => sequence("media", "import"));
});

gulp.task("fonts", () => {
    return gulp.src(`${config.dir.src}/styles/fonts/**/*`)
        .pipe(gulp.dest(`${config.dir.release}/styles/fonts`));
});

gulp.task("fonts:watch", () => {
    gulp.watch(`${config.dir.src}/styles/fonts/**/*`, () => sequence("fonts", "import"));
});

gulp.task("bb-styles", () => {
    return gulp.src([
        `${config.bb.contextRoot}/portalclient/css/normalize.min.css`,
        `${config.bb.contextRoot}/portalclient/css/backbase-portal.css`
    ])
        .pipe(concat(`bb-style.${hash}.min.css`))
        .pipe(cleanCss())
        .pipe(gulp.dest(`${config.dir.release}/styles`));
});

gulp.task("bb-libs", ["bb-styles"], () => {
    return gulp.src([
        `${config.bb.contextRoot}/ext-lib/jquery.min.js`,
        `${config.bb.contextRoot}/ext-lib/jquery-migrate.js`,
        `${config.bb.contextRoot}/ext-lib/soyutils.js`,
        `${config.bb.contextRoot}/portalclient/client.js`,
        `${config.bb.contextRoot}/portalclient/portal_view.js`,
        `${config.bb.contextRoot}/portalclient/compatibility.js`,
        `${config.bb.contextRoot}/portalclient/controllers/ctrl.portal.js`,
        `${config.bb.contextRoot}/portalclient/controllers/ctrl.preferences.js`,
        `${config.bb.contextRoot}/portalclient/xml-lang/backbase.com.2012.view/js/all.js`,
        `${config.bb.contextRoot}/portalclient/xml-lang/backbase.com.2013/backbase.com.2013.js`,
        `${config.bb.contextRoot}/portalclient/xml-lang/www.w3.org.1999.xhtml/xhtml.js`,
    ])
        .pipe(concat(`bb-lib.${hash}.min.js`))
        .pipe(uglify())
        .pipe(gulp.dest(`${config.dir.release}/scripts`));
});

gulp.task("theme-styles:ltr", () => {
    return gulp.src(`${config.dir.src}/styles/theme-ltr.scss`)
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: config.production ? "compressed" : "nested" }).on("error", sass.logError))
        .pipe(sourcemaps.write())
        .pipe(rename(`theme-ltr.${hash}.min.css`))
        .pipe(gulp.dest(`${config.dir.release}/styles`));
});

gulp.task("theme-styles:rtl", () => {
    return gulp.src(`${config.dir.src}/styles/theme-rtl.scss`)
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: config.production ? "compressed" : "nested" }).on("error", sass.logError))
        .pipe(sourcemaps.write())
        .pipe(rename(`theme-rtl.${hash}.min.css`))
        .pipe(gulp.dest(`${config.dir.release}/styles`));
});


gulp.task("theme-styles:watch", () => {
    gulp.watch(`${config.dir.src}/styles/**/*`, () => sequence("theme-styles:rtl", "theme-styles:ltr", "import"));
});

gulp.task("theme-libs", ["theme-styles:rtl", "theme-styles:ltr"], () => {
    return gulp.src([
        `${config.dir.root}/node_modules/bootstrap/dist/js/bootstrap.min.js`,
    ])
        .pipe(gulp.dest(`${config.dir.release}/scripts`));
});

gulp.task("react-dom", () => {
    return gulp.src(`node_modules/react-dom/umd/react-dom.${config.production ? "production.min" : "development"}.js`)
        .pipe(rename(`react-dom.${hash}.min.js`))
        .pipe(gulp.dest(`${config.dir.release}/scripts`));
});

gulp.task("react", ["react-dom"], () => {
    return gulp.src(`node_modules/react/umd/react.${config.production ? "production.min" : "development"}.js`)
        .pipe(rename(`react.${hash}.min.js`))
        .pipe(gulp.dest(`${config.dir.release}/scripts`));
});

gulp.task("material-ui", () => {
    return compile({
        entry: {
            "material-ui-core": `${config.dir.root}/node_modules/@material-ui/core/index.js`,
        },
        externals: {
            "react": "React",
            "react-dom": "ReactDOM",
        },
        mode: config.production ? "production" : "development",
        devtool: config.production ? "hidden-source-map" : "inline-source-map",
        output: {
            filename: `[name].${hash}.min.js`,
            library: "material-ui-core",
            libraryTarget: 'umd',
            path: `${config.dir.root}/${config.dir.release}/scripts`,
        },
        plugins: [],
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
        },
    });
});

gulp.task("tsc", () => {
    return compile({
        entry: {
            "index": `./${config.dir.src}/scripts/index.tsx`,
        },
        externals: {
            "react": "React",
            "react-dom": "ReactDOM"
        },
        mode: config.production ? "production" : "development",
        devtool: config.production ? "hidden-source-map" : "inline-source-map",
        module: {
            rules: [{
                exclude: /node_modules/,
                test: /\.tsx?$/,
                use: "ts-loader",
            }],
        },
        output: {
            filename: `index.${hash}.min.js`,
            libraryTarget: "umd",
            path: `${config.dir.root}/${config.dir.release}/scripts`,
        },
        plugins: [],
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
        },
    });
});

gulp.task("tsc:watch", () => {
    gulp.watch(`${config.dir.src}/scripts/**/*`, () => sequence("tsc", "import"));
});

gulp.task("import", async () => {
    const filename = `${config.dir.dist}/${config.name}.zip`;
    const archive = archiver("zip");
    try { fs.unlinkSync(filename); } catch (e) { }
    const output = fs.createWriteStream(filename);

    output.on('close', function () {
        execSync(`${config.dir.root}/node_modules/.bin/bb-import ${config.name}.zip --portal-protocol ${bb.scheme} --portal-host ${config.bb.host} --portal-port ${config.bb.port} --portal-username ${config.bb.username} --portal-password ${config.bb.password}`,
            { cwd: config.dir.dist, stdio: "inherit" });
    });

    archive.pipe(output);
    archive.on('error', function (err) {
        throw err;
    });
    archive.directory(config.dir.release, false);
    archive.finalize();
});

const tasks = ["clean", "index", "media", "fonts", "template", "tsc", "bb-libs", "theme-libs", "react", "material-ui", "import"];
const watchers = ["index:watch", "media:watch", "fonts:watch", "template:watch", "tsc:watch", "theme-styles:watch"];

gulp.task("default", () => sequence(...tasks, watchers));

gulp.task("deploy", () => sequence("production", ...tasks));

function replacePlaceholders(content) {
    return content
        .replace(/\[hash\]/g, hash)
        .replace(/\[name\]/g, config.name);
}

function compile(config) {
    return new Promise((resolve, reject) => {
        webpack(config).run((error, stats) => {
            if (error) {
                console.error(error.message);
                reject(error);
            }
            let output = stats.toString();
            if (stats.hasErrors) {
                output = output.substring(0, output.indexOf("ERROR"));
                console.log(output);
                const result = stats.toJson();
                const errors = result.errors;
                for (let i = 0, il = errors.length; i < il; ++i) {
                    const errorLines = errors[i].split("\n");
                    if (errorLines[1].indexOf("vendor-bb-") >= 0) {
                        continue;
                    }
                    console.error(`Error in ${errorLines[0]}\n${errorLines[1]}\n${errorLines[errorLines.length - 1]}\n\n`);
                }
            } else {
                console.log(output);
            }
            resolve();
        });
    });
}