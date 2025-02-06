import { mkdirSync, readdir, rmdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { globSync } from 'tinyglobby';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { copyfiles, createDir } from '../index';

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

  test('throws when inFile or outDir are missing', () => new Promise((done: any) => {
    copyfiles(['input/**/*.txt'], {}, (err) => {
      expect(err?.message).toBe('Please make sure to provide both <inFile> and <outDirectory>, i.e.: "copyfiles <inFile> <outDirectory>"');
      done();
    });
  }));

  test('throws when flat & up used together', () => new Promise((done: any) => {
    copyfiles(['input/**/*.txt', 'output'], { flat: true, up: 2 }, (err) => {
      expect(err?.message).toBe('Cannot use --flat in conjunction with --up option.');
      done();
    });
  }));

  test('normal', () => new Promise((done: any) => {
    writeFileSync('input/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/c.js', 'c');
    copyfiles(['input/*.txt', 'output'], {}, (err) => {
      console.error(err, 'copyfiles');
      readdir('output/input', async (err, files) => {
        // console.error(err, 'readdir');
        // 'correct number of things'
        expect(files).toEqual(['a.txt', 'b.txt']);
        done();
      });
    });
  }));

  test('modes', () => new Promise((done: any) => {
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
        done();
      });
    });
  }));

  test('exclude', () => new Promise((done: any) => {
    writeFileSync('input/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/c.js.txt', 'c');
    writeFileSync('input/d.ps.txt', 'd');
    copyfiles(['input/*.txt', 'output'], {
      exclude: ['**/*.js.txt', '**/*.ps.txt']
    }, (err) => {
      readdir('output/input', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
        done();
      });
    });
  }));

  test('error on nothing copied', () => new Promise((done: any) => {
    writeFileSync('input/.c.txt', 'c');
    copyfiles(['input/*.txt', 'output'], { error: true }, (err) => {
      expect(err?.message).toBe('nothing copied');
      done();
    });
  }));

  test('all', () => new Promise((done: any) => {
    writeFileSync('input/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/.c.txt', 'c');
    copyfiles(['input/*.txt', 'output'], { all: true }, (err) => {
      readdir('output/input', (err, files) => {
        expect(files).toEqual(['.c.txt', 'a.txt', 'b.txt']);
        done();
      });
    });
  }));

  test('with up', () => new Promise((done: any) => {
    writeFileSync('input/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/c.js', 'c');
    copyfiles(['input/*.txt', 'output'], { up: 1 }, (err) => {
      readdir('output', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
        done();
      });
    });
  }));

  test('with up true', () => new Promise((done: any) => {
    writeFileSync('input/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/c.js', 'c');
    copyfiles(['input/*.txt', 'output'], { up: true }, (err) => {
      readdir('output', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
        done();
      });
    });
  }));

  test('with up 2', () => new Promise((done: any) => {
    writeFileSync('input/other/a.txt', 'a');
    writeFileSync('input/other/b.txt', 'b');
    writeFileSync('input/other/c.js', 'c');
    copyfiles(['input/**/*.txt', 'output'], { up: 2 }, (err) => {
      readdir('output', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
        done();
      });
    });
  }));

  test('throws with up 3', () => new Promise((done: any) => {
    writeFileSync('input/other/a.txt', 'a');
    writeFileSync('input/other/b.txt', 'b');
    writeFileSync('input/other/c.js', 'c');
    copyfiles(['input/**/*.txt', 'output'], { up: 3 }, (err) => {
      if (err) {
        expect(err?.message).toBe(`Can't go up 3 levels from input/other (2 levels).`);
        done();
      }
    });
  }));

  test('flatten', () => new Promise((done: any) => {
    writeFileSync('input/other/a.txt', 'a');
    writeFileSync('input/b.txt', 'b');
    writeFileSync('input/other/c.js', 'c');
    copyfiles(['input/**/*.txt', 'output'], { flat: true }, (err) => {
      readdir('output', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
        done();
      });
    });
  }));

  test('follow', () => {
    if (process.platform !== 'win32') {
      mkdirSync('input/origin');
      mkdirSync('input/origin/inner');
      writeFileSync('input/origin/inner/a.txt', 'a');
      symlinkSync('origin', 'input/dest');
      copyfiles(['input/**/*.txt', 'output'], { up: 1, follow: true }, (err) => {
        const files = globSync('output/**/*.txt');
        expect(files).toEqual(['output/dest/inner/a.txt', 'output/origin/inner/a.txt']);
      });
    }
  });

  test('verbose flat', () => new Promise((done: any) => {
    const logSpy = vi.spyOn(global.console, 'log').mockReturnValue();
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
        done();
      });
    });
  }));

  test('verbose up', () => new Promise((done: any) => {
    const logSpy = vi.spyOn(global.console, 'log').mockReturnValue();
    writeFileSync('input/other/a.txt', 'a');
    writeFileSync('input/other/b.txt', 'b');
    writeFileSync('input/other/c.js', 'c');
    copyfiles(['input/**/*.txt', 'output'], { up: 2, verbose: true }, (err) => {
      readdir('output', (err, files) => {
        expect(files).toEqual(['a.txt', 'b.txt']);
        expect(logSpy).toHaveBeenCalledWith('glob found', ['input/other/a.txt', 'input/other/b.txt']);
        expect(logSpy).toHaveBeenCalledWith('copy:', { from: 'input/other/a.txt', to: 'output/a.txt' });
        expect(logSpy).toHaveBeenCalledWith('copy:', { from: 'input/other/b.txt', to: 'output/b.txt' });
        expect(logSpy).toHaveBeenCalledWith('Files copied:   2');
        done();
      });
    });
  }));
});