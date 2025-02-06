import { readdir, rmdirSync, writeFileSync } from 'node:fs';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createDir } from '../index';

async function cleanupFolders() {
  try {
    rmdirSync('input2', { recursive: true });
    rmdirSync('output2', { recursive: true });
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
    createDir('input2/other');
  });

  test('CLI exclude', () =>
    new Promise((done: any) => {
      writeFileSync('input2/a.txt', 'a');
      writeFileSync('input2/b.txt', 'b');
      writeFileSync('input2/c.js.txt', 'c');
      writeFileSync('input2/d.ps.txt', 'd');

      vi.spyOn(process, 'argv', 'get').mockReturnValue([
        'node.exe',
        'native-copyfiles/dist/cli.js',
        'input2',
        'output2',
        '--exclude',
        '**/*.js.txt',
        '**/*.ps.txt'
      ]);

      import('../cli')
        .then((cli: any) => {
          console.log(cli);
        })
        .then(() => {
          readdir('output2/input2', (err, files) => {
            expect(files).toEqual(['a.txt', 'b.txt']);
            done();
          });
        })
        .catch(e => {
          readdir('output2/input2', (err, files) => {
            expect(files).toEqual(['a.txt', 'b.txt']);
            done();
          });
        });
    }));
});