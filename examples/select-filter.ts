/**
 * select-filter — a long Select with filtering. Move the cursor near the end
 * of the list, press / and type: the cursor jumps to the first match and the
 * list starts from the top, so matches that were above the window show up
 * (upstream huh #804).
 *
 *   bun examples/select-filter.ts            # 50 made-up document titles
 *   bun examples/select-filter.ts DIR [EXT]  # the entries of DIR instead
 *
 * EXT (e.g. .md) keeps only files with that extension, shown without it.
 */
import { readdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import { NewForm, NewGroup, NewSelect, NewOption, ThemeFunc, ThemeCharm } from "../src/index.ts";

// Titles from an imaginary engineering handbook.
const handbook = [
  "adding-full-text-search-to-a-static-site",
  "api-versioning-without-breaking-clients",
  "background-jobs-with-a-postgres-queue",
  "blue-green-deploys-on-a-single-server",
  "building-a-cli-with-subcommands",
  "caching-api-responses-at-the-edge",
  "choosing-between-sqlite-and-postgres",
  "code-review-checklist-for-small-teams",
  "container-images-under-50-mb",
  "cron-jobs-that-survive-restarts",
  "database-migrations-you-can-roll-back",
  "debugging-memory-leaks-in-long-running-services",
  "designing-idempotent-webhooks",
  "error-budgets-for-a-two-person-team",
  "feature-flags-without-a-vendor",
  "graceful-shutdown-for-http-servers",
  "http-caching-headers-explained",
  "incident-postmortem-template",
  "invalidating-a-cache-without-tears",
  "keeping-secrets-out-of-git",
  "load-testing-before-launch-day",
  "logging-that-helps-at-3am",
  "monorepo-tooling-that-stays-fast",
  "multi-tenant-data-isolation-patterns",
  "oauth-login-in-an-afternoon",
  "observability-on-a-budget",
  "onboarding-guide-for-new-engineers",
  "pagination-cursors-vs-offsets",
  "password-reset-flows-done-right",
  "rate-limiting-with-a-token-bucket",
  "reading-a-flame-graph",
  "release-checklist",
  "retrying-failed-requests-with-backoff",
  "running-tests-in-parallel",
  "schema-design-for-audit-logs",
  "server-sent-events-for-live-updates",
  "sharing-types-between-client-and-server",
  "shipping-a-design-system-package",
  "signing-requests-with-hmac",
  "structured-logs-and-trace-ids",
  "terminal-uis-for-internal-tools",
  "testing-email-flows-locally",
  "time-zones-and-other-date-traps",
  "tuning-a-read-heavy-cache",
  "upgrading-dependencies-safely",
  "uploading-large-files-in-chunks",
  "usage-based-billing-basics",
  "warming-caches-after-a-deploy",
  "writing-a-runbook",
  "zero-downtime-schema-changes",
];

let title = "Open a document";
let description = `${handbook.length} documents in the team handbook`;
let names = handbook;

const dirArg = process.argv[2];
if (dirArg) {
  const dir = resolve(dirArg);
  const ext = process.argv[3];
  names = readdirSync(dir)
    .filter((name) => !name.startsWith("."))
    .filter((name) => !ext || name.endsWith(ext))
    .sort()
    .map((name) => (ext ? name.slice(0, -ext.length) : name));
  title = "Open a file";
  description = `${names.length} entries in ${basename(dir)}`;
}

let pick = "";
const form = NewForm(
  NewGroup(
    NewSelect<string>()
      .title(title)
      .description(description)
      .options(names.map((name) => NewOption(name, name)))
      .height(20)
      .value(() => pick, (v) => (pick = v)),
  ),
).withTheme(ThemeFunc(ThemeCharm));

await form.run();
console.log(pick);
