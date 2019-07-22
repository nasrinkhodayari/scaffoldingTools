"use strict";
exports.scaffoldingTools = function () {
    const copydir = require('copy-dir');
    const mkdirp = require('mkdirp');
    const replace = require('replace-in-file');

    const templatesPath = './templates/';
    const newDirectoryName = process.argv[2] ? process.argv[2] : 'NewFolder';
    const newDirectoryPath = './' + newDirectoryName;
    const directoryType = process.argv[3];

    let directoryTemplate = '';
    let directoryName = '';

    switch (directoryType) {
        case 'widget': {
            directoryTemplate = templatesPath + 'widget';
            directoryName = 'widget-name';
            break;
        } case 'page': {
            directoryTemplate = templatesPath + 'page';
            directoryName = 'page-name';
            break;
        }
        case 'template': {
            directoryTemplate = templatesPath + 'template';
            directoryName = 'template-name';
            break;
        } default: {
            directoryTemplate = templatesPath + 'widget';
            directoryName = 'widget-name';
        }
    }

    new Promise(async function (resolve, reject) {
        mkdirp(newDirectoryPath, (err) => {
            if (err) reject(err)
            else {
                /**copydir(from, to, [options, ]callback); */
                copydir(directoryTemplate, newDirectoryPath, {
                    utimes: true,  // keep add time and modify time
                    mode: true,    // keep file mode
                    cover: true    // cover file when exists, default is true
                }, (err) => {
                    if (err) throw err;
                    resolve();
                });

            }
        });
    }).then(() => {
        /**replace name */
        const nameOptions = {
            files: [
                newDirectoryPath + '/**/*.*',
            ],
            from: directoryName,
            to: newDirectoryName
        };
        replace(nameOptions);

        /**replace title */
        const titleOptions = {
            files: [
                newDirectoryPath + '/**/*.*',
            ],
            from: 'DIRECTORY_TITLE',
            to: toCamelCase(newDirectoryName)
        };
        replace(titleOptions);
    });
    function toCamelCase(string) {
        string = string.charAt(0).toUpperCase() + string.slice(1);;
        return string.replace(/-\w/g, $1 => $1.replace(/-/, ' ').toUpperCase());
    }
}