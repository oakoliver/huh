/**
 * field.run(): upstream `func (f *Field) Run() error { return Run(f) }` runs the
 * field as a one-field form. A Ctrl+C on stdin must therefore surface as the
 * form's ErrUserAborted, never as a "not implemented" stub.
 */
import { describe, test, expect } from "bun:test";
import * as path from "node:path";

const fields: Record<string, string> = {
  Input: 'NewInput().title("Name")',
  Text: 'NewText().title("Notes")',
  Select: 'NewSelect().title("Pick").options(NewOptions("a", "b"))',
  MultiSelect: 'NewMultiSelect().title("Pick").options(NewOptions("a", "b"))',
  Confirm: 'NewConfirm().title("Sure?")',
  Note: 'NewNote().title("Hello")',
  FilePicker: 'NewFilePicker().title("File")',
};

describe("field.run()", () => {
  for (const [name, expr] of Object.entries(fields)) {
    test(`${name}.run() runs the field as a form`, () => {
      const src = path.join(import.meta.dir, "..", "src", "index.ts");
      const script = `
        import * as huh from ${JSON.stringify(src)};
        const { NewInput, NewText, NewSelect, NewMultiSelect, NewConfirm, NewNote, NewFilePicker, NewOptions, ErrUserAborted } = huh;
        try { await ${expr}.run(); console.log("RESOLVED"); }
        catch (e) { console.log(e instanceof ErrUserAborted ? "ABORTED" : "ERROR " + (e as Error).message); }
        process.exit(0);
      `;
      const proc = Bun.spawnSync(["bun", "-e", script], { stdin: Buffer.from("\x03"), timeout: 15000 });
      // The program also writes terminal queries (escape sequences) to stdout.
      const out = proc.stdout.toString().replace(/\x1b\[[0-9;?$]*[A-Za-z]/g, "");
      expect(out.trim().split("\n").pop()).toBe("ABORTED");
    });
  }
});
