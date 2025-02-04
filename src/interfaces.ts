export interface CopyFileOptions {
  /** include files & directories begining with a dot (.) */
  all?: boolean;

  /** throw error if nothing is copied */
  error?: boolean;

  /** pattern or glob to exclude (may be passed multiple times) */
  exclude?: string | string[];

  /** flatten the output */
  flat?: boolean;

  /** follow symbolink links */
  follow?: boolean;

  /** show statistics after execution (execution time + file count) */
  stat?: boolean;

  /** slice a path off the bottom of the paths */
  up?: boolean | number;

  /** print more information to console */
  verbose?: boolean;

  /** callback to run when the execution finished or an error occured */
  callback?: (e?: Error) => void
}