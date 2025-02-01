export interface CopyFileOptions {
    /** slice a path off the bottom of the paths */
    up?: number;

    /** include files & directories begining with a dot (.) */
    all?: boolean;

    /** flatten the output */
    flat?: boolean;

    /** pattern or glob to exclude (may be passed multiple times) */
    exclude?: string | string[];

    /** throw error if nothing is copied */
    error?: boolean;

    /** print more information to console */
    verbose?: boolean;

    /** follow symbolink links */
    follow?: boolean;

}