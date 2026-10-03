# Project guide for coding agents

## What this repository does

`native-copyfiles` is a small TypeScript library and Node.js CLI for expanding file globs, copying files and directories, and optionally flattening or renaming destinations. It uses Node's native filesystem globbing. The supported runtime is Node `^22.17.0 || >=24.0.0`; use Node 24 when matching CI.

## Where to work

- `src/index.ts`: exported copy API, path mapping, glob matching and stream copying.
- `src/interfaces.ts`: public `CopyFileOptions` type.
- `src/cli.ts`: `cli-nano` argument definitions and CLI entry point. Keep CLI options and API options aligned.
- `src/__tests__/index.spec.ts`: API, path, glob, rename, symlink and callback behavior.
- `src/__tests__/cli.spec.ts` and `src/__tests__/cli-fail.spec.ts`: CLI behavior.
- `README.md`: CLI and API usage, examples and option documentation.
- `.github/pull_request_template.md`: required PR description structure.

The package is ESM. Keep `.js` extensions on relative TypeScript imports. The library and CLI use Node built-ins wherever possible; add a runtime dependency only when native APIs cannot reasonably meet the need.

## Checks

Use these repository checks as appropriate for the change:

- `rtk npm run biome:check` checks source lint and formatting.
- `rtk proxy node_modules/.bin/tsc -p tsconfig.build.json` checks the production TypeScript build without running the mutating build script.
- `rtk npm test` runs Vitest with coverage, matching CI's test command.
- `rtk npm run build` matches CI's build command, but first inspect the working tree: this script deletes `dist/` and runs Biome write over `src/`. Review the resulting source diff so unrelated formatting changes are not kept.

CI installs dependencies with npm, builds, then runs tests on Node 24. Do not run `npm install` unless dependencies need changing.

## Test and filesystem safety

The existing API and CLI test suites create and recursively remove fixture paths relative to the process working directory. Before running them, check that the repository-root paths `input/`, `output/`, `input1/`, `input2/`, and `output2/` do not contain user data; the suite's cleanup hooks remove those paths. Keep new filesystem-heavy tests in a unique temporary directory and remove only the directory created by that test.

`src/__tests__/cli-multiple.spec.ts` is skipped; it does not currently validate multiple CLI inputs. Add or run active coverage when changing that behavior.

## Behavior to preserve

- The CLI takes all options after the source and destination arguments.
- Ordered source patterns support negation; a later positive pattern can re-include a file.
- Preserve the behavior of exclusions, dotfiles, symlink following, flattening, `up`, destination wildcards, rename callbacks, dry runs, and single-file renames.
- `copyfiles` performs validation and glob discovery synchronously, then reports completed file copies or copy errors through its callback. Keep synchronous validation and dry-run behavior intact when changing copy scheduling.
- Options are copied into a null-prototype object so inherited properties do not affect behavior. Preserve that protection.

When changing copy concurrency or stream handling, cover successful copies, read and write failures, callback-once behavior, and cleanup of active work. When changing glob matching, cover relative paths, directories versus files, dotfiles, symlinks, duplicate patterns, and ordered negation.

## Pull requests

Use `.github/pull_request_template.md`. PR titles must use a conventional commit type and be shorter than 73 characters. If an issue is fixed, add `fixes #123` on its own line with the real issue number.

Return PR titles and descriptions as raw Markdown inside a fenced markdown code block so they can be copied directly.
