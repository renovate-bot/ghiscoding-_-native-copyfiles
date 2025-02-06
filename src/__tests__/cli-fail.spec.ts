import { rmdirSync } from 'node:fs';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

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
    vi.spyOn(process, 'exit').mockImplementation((() => { }) as any);
  });

  test('CLI entry failure (no valid process.argv)', () =>
    new Promise((done: any) => {
      const errorSpy = vi.spyOn(global.console, 'error').mockReturnValue();
      const exitSpy = vi.spyOn(process, 'exit');

      import('../cli')
        .then((cli: any) => {
          cli();
        })
        .catch(e => {
          expect(errorSpy).toHaveBeenCalledWith(
            new Error('Please make sure to provide both <inFile> and <outDirectory>, i.e.: "copyfiles <inFile> <outDirectory>"')
          );
          expect(exitSpy).toHaveBeenCalledWith(1);
          process.exitCode = undefined;
          done();
          process.exit(0);
        });
    }));
});