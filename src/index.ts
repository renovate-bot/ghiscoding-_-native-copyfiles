import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path, { basename, dirname, join, normalize, posix, sep } from 'node:path';
import untildify from 'untildify';
import { type GlobOptions, globSync } from 'tinyglobby';

import { CopyFileOptions } from './interfaces.js';

/**
 * Check if a directory exists, if not then create it
 * @param {String} dir - directory to create
 */
export function createDir(dir: string) {
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
export function copyfiles(paths: string[], options: CopyFileOptions, callback?: (e?: Error) => void) {
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
    let outDir = paths.pop() as string;
    outDir = outDir.startsWith('~') ? untildify(outDir) : outDir;

    // create destination directory if not exists
    createDir(outDir);

    let globOptions: GlobOptions = {};
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

    allFiles.forEach((inFile) => {
      copyFile(inFile, outDir, options);
    });

    if (options.verbose || options.stat) {
      console.log(`Files copied:   ${allFiles.length}`);
      console.timeEnd('Execution time');
    }

    if (options.error && allFiles.length < 1) {
      new Error('nothing copied');
    }

    if (typeof cb === 'function') {
      cb();
    }
  } catch (e: any) {
    if (typeof cb === 'function') {
      cb(e);
    }
  }
}

/**
 * Copy a single file from a source to a destination directory
 * @param {String} inFile
 * @param {String} outDir
 * @param {CopyFileOptions} options
 */
function copyFile(inFile: string, outDir: string, options: CopyFileOptions) {
  const fileDir = dirname(inFile);
  const fileName = basename(inFile);
  outDir = outDir.startsWith('~') ? untildify(outDir) : outDir;

  // a flat output will copy all files to the destination directory directory without any sub-directory
  if (options.flat || options.up === true) {
    const dest = join(outDir, fileName);

    if (options.verbose) {
      console.log({ from: inFile, to: dest });
    }
    copyFileSync(inFile, dest);
  }
  // otherwise copy all the files with the full path (outDir path + source path)
  else {
    const upCount = options.up || 0;
    const destDir = join(outDir, dealWith(fileDir, upCount));

    // make sure directory exists
    createDir(destDir);

    // finally copy the file
    const dest = join(destDir, fileName);
    if (options.verbose) {
      console.log(`copy:`, { from: convertToPosix(inFile), to: convertToPosix(dest) });
    }
    copyFileSync(inFile, dest);
  }

  function convertToPosix(path: string) {
    return path.replaceAll(sep, posix.sep);
  }

  function depth(str: string) {
    return normalize(str).split(sep).length;
  }

  function dealWith(inPath: string, up: number | boolean) {
    if (!up) {
      return inPath;
    }
    if (up === true) {
      return basename(inPath);
    }
    if (depth(inPath) < up) {
      throw new Error(`Can't go up ${up} levels from ${inPath} (${depth(inPath)} levels).`);
    }
    return path.join.apply(path, normalize(inPath).split(sep).slice(up));
  }
}
