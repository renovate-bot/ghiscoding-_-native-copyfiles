import { readdir, rmdirSync, writeFileSync } from 'node:fs';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createDir } from '../index';

async function cleanupFolders() {
  try {
    rmdirSync('input', { recursive: true });
    rmdirSync('output', { recursive: true });
  } catch (e) { }
}

describe('copyfiles', () => {
  afterEach(async () => {
    vi.clearAllMocks();
    cleanupFolders();
    process.exitCode = undefined;
  });

  afterAll(() => cleanupFolders());

  beforeEach(() => {
    createDir('input/other');
  });

  test('CLI exclude', () =>
    new Promise((done: any) => {
      writeFileSync('input/a.txt', 'a');
      writeFileSync('input/b.txt', 'b');
      writeFileSync('input/c.js.txt', 'c');
      writeFileSync('input/d.ps.txt', 'd');

      vi.spyOn(process, 'argv', 'get').mockReturnValue([
        'node.exe',
        'native-copyfiles/dist/cli.js',
        'input',
        'output',
        '--exclude',
        '**/*.js.txt',
        '**/*.ps.txt'
      ]);

      import('../cli')
        .then((cli: any) => {
          console.log(cli);
        })
        .then(() => {
          readdir('output/input', (err, files) => {
            expect(files).toEqual(['a.txt', 'b.txt']);
            done();
          });
        })
        .catch(e => {
          readdir('output/input', (err, files) => {
            expect(files).toEqual(['a.txt', 'b.txt']);
            done();
          });
        });
    }));
});