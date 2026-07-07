/**
 * Temporary demo mode.
 *
 * When enabled, the app bypasses authentication and subscription checks so the
 * report generator can be demoed as a standalone site with no database.
 *
 * All auth/subscription code remains in place and is simply not executed while
 * this flag is on. To restore full enforcement, set the env var
 * `DEMO_MODE="false"` (or change the default below).
 */
export const DEMO_MODE = process.env.DEMO_MODE !== "false";
