import { mkdirSync, readdir, rmdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { arch } from 'node:os';
import { globSync } from 'tinyglobby';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { copyfiles, createDir } from '../';

async function cleanupFolders() {
  try {
    rmdirSync('input', { recursive: true });
    rmdirSync('output', { recursive: true });
  } catch (e) { }
}

describe('copyfiles', () => {
  afterEach(async () => {
    cleanupFolders();
  });

  afterAll(() => cleanupFolders());

  beforeEach(() => {
    createDir('input/other');
  });

  test('normal', () => {
    writeFileSync('input/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/c.js', 'c');
    copyfiles(['input/*.txt', 'output'], {}, (err) => {
      console.error(err, 'copyfiles');
      readdir('output/input', async (err, files) => {
        // console.error(err, 'readdir');
        // 'correct number of things'
        expect(files).toEqual(['a.txt', 'b.txt']);
      });
    });
  });

  test('modes', () => {
    writeFileSync('input/a.txt', 'a', {
      mode: 33261
    });
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/c.js', 'c');
    copyfiles(['input/*.txt', 'output'], {}, (err) => {
      console.error(err, 'copyfiles');
      readdir('output/input', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
        //  'correct mode'
        // expect(statSync('output/input/a.txt').mode).toBe(33261);
      });
    });
  });

  test('exclude', () => {
    writeFileSync('input/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/c.js.txt', 'c');
    writeFileSync('input/d.ps.txt', 'd');
    copyfiles(['input/*.txt', 'output'], {
      exclude: ['**/*.js.txt', '**/*.ps.txt']
    }, (err) => {
      readdir('output/input', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
      });
    });
  });

  test('all', () => {
    writeFileSync('input/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/.c.txt', 'c');
    copyfiles(['input/*.txt', 'output'], { all: true }, (err) => {
      readdir('output/input', (err, files) => {
        expect(files).toEqual(['.c.txt', 'a.txt', 'b.txt']);
      });
    });
  });

  test('with up', () => {
    writeFileSync('input/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/c.js', 'c');
    copyfiles(['input/*.txt', 'output'], { up: 1 }, (err) => {
      readdir('output', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
      });
    });
  });

  test('with up 2', () => {
    writeFileSync('input/other/a.txt', 'a');
    writeFileSync('input/other/b.txt', 'b');
    writeFileSync('input/other/c.js', 'c');
    copyfiles(['input/**/*.txt', 'output'], { up: 2 }, (err) => {
      readdir('output', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
      });
    });
  });

  test('flatten', () => {
    writeFileSync('input/other/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/other/c.js', 'c');
    copyfiles(['input/**/*.txt', 'output'], { flat: true }, (err) => {
      readdir('output', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
      });
    });
  });

  test('verbose', () => {
    const logSpy = vi.spyOn(console, 'log');
    writeFileSync('input/other/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/other/c.js', 'c');
    copyfiles(['input/**/*.txt', 'output'], { flat: true, verbose: true }, (err) => {
      readdir('output', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
        expect(logSpy).toHaveBeenCalledWith('glob found', ['input/b.txt', 'input/other/a.txt']);
        expect(logSpy).toHaveBeenCalledWith('copy:', { from: 'input/other/a.txt', to: 'output/a.txt' });
        expect(logSpy).toHaveBeenCalledWith('copy:', { from: 'input/b.txt', to: 'output/b.txt' });
        expect(logSpy).toHaveBeenCalledWith('Files copied:   2');
      });
    });
  });

  test.skipIf(arch() === 'x64')('follow', () => {
    mkdirSync('input/origin');
    mkdirSync('input/origin/inner');
    writeFileSync('input/origin/inner/a.txt', 'a');
    symlinkSync('origin', 'input/dest');
    copyfiles(['input/**/*.txt', 'output'], { up: 1, follow: true }, (err) => {
      const files = globSync('output/**/*.txt');
      expect(files).toEqual(['output/dest/inner/a.txt', 'output/origin/inner/a.txt']);
    });
  });
});