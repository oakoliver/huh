/**
 * Tests for FilePicker field.
 * Ports: TestFile from huh_test.go
 */
import { describe, test, expect } from "bun:test";
import { NewFilePicker } from "../src/index.js";
import { viewModel } from "./helpers.js";

describe("FilePicker", () => {
  test("TestFile — basic rendering", () => {
    const field = NewFilePicker().title("Which file?");
    const cmd = field.init();
    if (cmd) {
      const msg = cmd();
      if (msg) field.update(msg);
    }

    const view = viewModel(field);
    expect(view).toContain("No file selected");
    expect(view).toContain("Which file?");
  });
});
