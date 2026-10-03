/**
 * README samples — every ```typescript block in README.md must typecheck
 * against src under strict mode and run without throwing, so the docs
 * can't drift from the API.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { Form } from "../src/form.js";

const root = path.resolve(import.meta.dir, "..");
const outDir = path.join(root, "tests", ".readme");

const blocks = [...fs.readFileSync(path.join(root, "README.md"), "utf8").matchAll(/```typescript\n([\s\S]*?)```/g)]
  .map((m) => m[1].replace(/from (['"])@oakoliver\/huh\1/g, "from '../../src/index.js'"));

const files = blocks.map((_, i) => path.join(outDir, `sample-${i + 1}.ts`));

beforeAll(() => {
  fs.mkdirSync(outDir, { recursive: true });
  // `export {}` makes each sample a module so top-level await is allowed.
  blocks.forEach((code, i) => fs.writeFileSync(files[i], `${code}\nexport {};\n`));
});

afterAll(() => {
  fs.rmSync(outDir, { recursive: true, force: true });
});

describe("README samples", () => {
  test("there are samples to check", () => {
    expect(blocks.length).toBeGreaterThan(5);
  });

  test("typecheck under strict mode", () => {
    const tsc = Bun.spawnSync(
      [
        path.join(root, "node_modules", ".bin", "tsc"),
        "--noEmit", "--strict", "--skipLibCheck",
        "--target", "ESNext", "--module", "ESNext", "--moduleResolution", "bundler",
        "--types", "node",
        ...files,
      ],
      { cwd: root },
    );
    expect(tsc.stdout.toString() + tsc.stderr.toString()).toBe("");
    expect(tsc.exitCode).toBe(0);
  }, 60_000);

  test("run without throwing", async () => {
    const run = Form.prototype.run;
    const log = console.log;
    Form.prototype.run = async function () {};
    console.log = () => {};
    try {
      for (const file of files) await import(file);
    } finally {
      Form.prototype.run = run;
      console.log = log;
    }
  });
});
