/**
 * Tests for Note field.
 * Ports: TestNote from huh_test.go
 */
import { describe, test, expect } from "bun:test";
import { stripAnsi } from "@oakoliver/lipgloss";
import { NewNote, NewForm, NewGroup } from "../src/index.js";
import { viewModel } from "./helpers.js";

function lipglossHeight(s: string): number {
  if (!s) return 0;
  return s.split("\n").length;
}

describe("Note", () => {
  test("TestNote — note field with Next button", () => {
    const field = NewNote()
      .title("Taco")
      .description("How may we take your order?")
      .next(true);
    const f = NewForm(NewGroup(field));
    f.update(f.init());

    const view = viewModel(f);

    expect(view).toContain("Taco");
    expect(view).toContain("order?");
    expect(view).toContain("Next");
    expect(view).toContain("enter submit");

    // The Go test expects exactly 7 lines height
    const h = lipglossHeight(stripAnsi(view));
    expect(h).toBe(7);
  });
});
