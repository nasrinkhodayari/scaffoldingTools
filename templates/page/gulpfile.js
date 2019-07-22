const gulp = require("gulp");
const fs = require("fs");
const del = require("del");
const archiver = require("archiver");
const execSync = require("child_process").execSync;
const sequence = require("run-sequence");

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
        password: bb.password
    },
    dir: {
        root: __dirname,
        src: "src",
        dist: "dist",
        release: "dist/release"
    }
}

gulp.task("clean", () => del.sync(config.dir.dist));

gulp.task("index", () => {
    return gulp.src(`${config.dir.src}/**/*.*`)
        .pipe(gulp.dest(config.dir.release));
});

gulp.task("index:watch", () => {
    gulp.watch(`${config.dir.src}/**/*.*`, () => sequence("index", "import"));
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

const tasks = ["clean", "index", "import"];
const watchers = ["index:watch"];

gulp.task("default", () => sequence(...tasks, watchers));