#!/usr/bin/env node

"use strict";

const mkdirp = require("mkdirp");
const replace = require("replace-in-file");
const copydir = require("copy-dir");
const inquirer = require("inquirer");

let newDirectoryName = "";
let directoryType = "";
let directoryTemplate = "";
let directoryName = "";

const getPackageName = () => {
  inquirer
    .prompt([
      {
        type: "input",
        name: "name",
        message: "Package name? ",
      },
    ])
    .then((packageName) => {
      if (!packageName.name) {
        getPackageName();
        return;
      }
      getPackageType(packageName.name);
    });
};

const getPackageType = (packageName) => {
  inquirer
    .prompt([
      {
        type: "list",
        name: "name",
        message: `${packageName} package type? `,
        choices: ["widget", "page", "template"],
      },
    ])
    .then((packageType) => {
      if (!packageType.name) {
        getPackageType(packageName);
        return;
      }
      console.log(
        `Your ${packageType.name} with name ${packageName} will be created ...`
      );

      newDirectoryName = packageName;
      directoryType = packageType.name;

      directoryTemplate = `${__dirname}/templates/${directoryType}`;
      directoryName =
        directoryType === "react-webpack"
          ? `widget-name`
          : `${directoryType}-name`;

      makeAndCopyDirectory();
    });
};

getPackageName();

const makeAndCopyDirectory = () => {
  mkdirp("./" + newDirectoryName, (err) => {
    if (err) throw err;
    /**copydir(from, to, [options, ]callback); */

    copydir(
      directoryTemplate,
      "./" + newDirectoryName,
      {
        utimes: true, // keep add time and modify time
        mode: true, // keep file mode
        cover: true, // cover file when exists, default is true
      },
      (err) => {
        if (err) throw err;
        replaceKeys();
      }
    );
  });
};

const replaceKeys = () => {
  /**replace name */
  const nameOptions = {
    files: "./" + newDirectoryName + "/**/*.*",
    from: new RegExp(directoryName, "g"),
    to: newDirectoryName,
  };
  replace(nameOptions).then(() => {
    /**replace title */
    const titleOptions = {
      files: "./" + newDirectoryName + "/**/*.*",
      from: /DIRECTORY_TITLE/g,
      to: toPascalCaseWithSpace(newDirectoryName),
    };
    replace(titleOptions).then(() => {
      /**replace title */
      const titleOptions = {
        files: "./" + newDirectoryName + "/**/*.*",
        from: /WIDGET_NAME/g,
        to: toCamelCase(newDirectoryName),
      };
      replace(titleOptions);
    });
  });
};

const toPascalCaseWithSpace = (string) => {
  string = string.charAt(0).toUpperCase() + string.slice(1);
  return string.replace(/-\w/g, ($1) => $1.replace(/-/, " ").toUpperCase());
};
const toCamelCase = (string) => {
  return string.replace(/-\w/g, ($1) => $1.replace(/-/, "").toUpperCase());
};
