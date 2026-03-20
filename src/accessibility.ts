/**
 * Accessibility — accessible mode form rendering.
 * Port of charmbracelet/huh accessible mode (runAccessible in form.go)
 *
 * In accessible mode, the form skips the Bubble Tea TUI renderer
 * and instead uses basic terminal prompting for screen readers.
 *
 * This module provides simple IO helpers for accessible mode fields.
 */

import type { Writable, Readable } from "node:stream";

/**
 * Writes a line to the output writer.
 */
export function writeLine(w: Writable, line: string): void {
  w.write(line + "\n");
}

/**
 * Reads a line from the input reader.
 * Returns a promise that resolves to the trimmed input string.
 */
export function readLine(r: Readable): Promise<string> {
  return new Promise<string>((resolve) => {
    let data = "";
    const onData = (chunk: Buffer | string) => {
      data += chunk.toString();
      const idx = data.indexOf("\n");
      if (idx >= 0) {
        r.removeListener("data", onData);
        resolve(data.slice(0, idx).trim());
      }
    };
    r.on("data", onData);
  });
}

/**
 * Prompts the user with a question and returns the response.
 */
export async function prompt(
  w: Writable,
  r: Readable,
  question: string,
): Promise<string> {
  w.write(question);
  return readLine(r);
}
