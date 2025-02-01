import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { globSync } from 'tinyglobby';

/**
 * Check if a directory exists, if not then create it
 * @param {String} dir - directory to create
 */
export function createDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Copy the files per a glob pattern, the first item(s) can be a 1 or more files to copy
 * while the last item in the array is the output outDirectory directory
 * @param {String[]} paths - includes both source(s) and outDirectory directory
 * @param {CopyFileOptions} options - CLI options
 * @param {(e?: Error) => void} callback - optionally callback that will be executed after copy is finished or when an error occurs
 */
export function copyfiles(paths, options, callback) {
  const cb = callback || options.callback;

  try {
    if (options.verbose || options.stat) {
      console.time('Execution time');
    }

    if (paths.length < 2) {
      throw new Error('Please make sure to provide both <inFile> and <outDirectory>, i.e.: "copyfiles <inFile> <outDirectory>"');
    }

    if (options.flat && options.up) {
      throw new Error('Cannot use --flat in conjunction with --up option.');
    }

    // find file source(s) and destination directory
    const sources = paths.slice(0, -1);
    const outDirectory = paths.pop();

    // create destination directory if not exists
    createDir(outDirectory);

    let globOptions = {};
    if (Array.isArray(options.exclude) && options.exclude.length > 0) {
      globOptions.ignore = options.exclude;
    }
    if (options.all) {
      globOptions.dot = true;
    }
    if (options.follow) {
      globOptions.followSymbolicLinks = true;
    }

    // find all files by using our source glob pattern(s)
    const allFiles = globSync(sources, globOptions);
    if (options.verbose) {
      console.log('glob found', allFiles);
    }

    allFiles.forEach((inFile, fileIdx) => {
      copyFile(inFile, outDirectory, fileIdx, options);
    });

    if (options.verbose || options.stat) {
      console.log(`Files copied:   ${allFiles.length}`);
      console.timeEnd('Execution time');
    }

    if (options.error && allFiles.length < 1) {
      new Error('nothing copied');
    }

    if (cb) {
      cb(null);
    }
  } catch (e) {
    if (cb) {
      cb(e);
    }
  }
}

/**
 * Copy a single file from a source to a destination directory
 * @param {String} inFile
 * @param {String} outDirectory
 * @param {Number} fileIdx
 * @param {CopyFileOptions} options
 */
function copyFile(inFile, outDirectory, fileIdx, options) {
  const fileDir = dirname(inFile);
  const fileName = basename(inFile);

  // a flat output will copy all files to the destination directory directory without any sub-directory
  if (options.flat || options.up === true) {
    const dest = `${outDirectory}/${fileName}`;
    if (options.verbose) {
      console.log({ from: inFile, to: dest });
    }
    copyFileSync(inFile, dest);
  }
  // otherwise copy all the files with the full path (outDirectory path + source path)
  else {
    const upCount = options.up || 1;
    const dirs = fileDir.split('/');

    let destDir = `${outDirectory}/`;
    if (upCount) {
      let srcPathCount = dirs.length;
      if (srcPathCount < upCount) {
        throw new Error('cant go up that far');
      }
      for (let i = upCount; i < srcPathCount; i++) {
        destDir += dirs[i] + '/';
      }
    } else {
      destDir = `${outDirectory}/${fileDir}/`;
    }

    // make sure directory exists
    createDir(destDir.substring(0, destDir.length - 1));

    // finally copy the file
    const dest = `${destDir}${fileName}`;
    if (options.verbose) {
      console.log(`file ${fileIdx + 1}:`, { from: inFile, to: dest });
    }
    copyFileSync(inFile, dest);
  }
}
