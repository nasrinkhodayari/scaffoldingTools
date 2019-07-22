const gulp = require("gulp");
const fs = require("fs");
const del = require("del");
const archiver = require("archiver");
const execSync = require("child_process").execSync;
const sequence = require("run-sequence");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");
const webpack = require("webpack");
const change = require("gulp-change");
const hash = require("hash-generator")(8);

const pkg = JSON.parse(fs.readFileSync("package.json"));
const bb = JSON.parse(fs.readFileSync("bbrc.json"));
const config = {
    name: pkg.name,
    initializer: toCamelCase(pkg.name),
    production: false,
    bb: {
        scheme: bb.scheme,
        host: bb.host,
        port: bb.port,
        username: bb.username,
        password: bb.password
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
        .pipe(change(replacePlaceholders))
        .pipe(gulp.dest(config.dir.release));
});

gulp.task("index:watch", () => {
    gulp.watch(`${config.dir.src}/*.*`, () => sequence("index", "import"));
});

gulp.task("media", () => {
    return gulp.src(`${config.dir.src}/media/**/*`)
        .pipe(gulp.dest(`${config.dir.release}/media`));
});

gulp.task("media:watch", () => {
    gulp.watch(`${config.dir.src}/media/**/*`, () => sequence("media", "import"));
});

gulp.task("sass", () => {
    return gulp.src(`${config.dir.src}/styles/*.scss`)
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: config.production ? "compressed" : "nested" }).on("error", sass.logError))
        .pipe(rename(`base.${hash}.css`))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(`${config.dir.release}/styles`));
});

gulp.task("sass:watch", () => {
    gulp.watch(`${config.dir.src}/styles/**/*.scss`, () => sequence("sass", "import"));
});

gulp.task("tsc", () => {
    return compile({
        entry: {
            [config.name]: `./${config.dir.src}/scripts/index.tsx`
        },
        externals: {
            "react": "React",
            "react-dom": "ReactDOM",
            "@material-ui/core": "material-ui-core"
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
            filename: `index.${hash}.js`,
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

    output.on("close", function () {
        execSync(`${config.dir.root}/node_modules/.bin/bb-import ${config.name}.zip --portal-protocol ${bb.scheme} --portal-host ${config.bb.host} --portal-port ${config.bb.port} --portal-username ${config.bb.username} --portal-password ${config.bb.password}`,
            { cwd: config.dir.dist, stdio: "inherit" });
    });

    archive.pipe(output);
    archive.on("error", function (err) {
        throw err;
    });
    archive.directory(config.dir.release, false);
    archive.finalize();
});

const tasks = ["clean", "index", "media", "sass", "tsc", "import"];
const watchers = ["index:watch", "media:watch", "sass:watch", "tsc:watch"];

gulp.task("default", () => sequence(...tasks, watchers));

gulp.task("deploy", () => sequence("production", ...tasks));

function replacePlaceholders(content) {
    return content
        .replace(/\[hash\]/g, hash)
        .replace(/\[name\]/g, config.name)
        .replace(/\[initializer]/g, config.initializer);
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

function toCamelCase(string) {
    return string.replace(/-\w/g, $1 => $1.replace(/-/, '').toUpperCase());
}