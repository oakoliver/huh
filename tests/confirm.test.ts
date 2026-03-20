/**
 * Tests for Confirm field.
 * Ports: TestConfirm from huh_test.go
 */
import { describe, test, expect } from "bun:test";
import { KeyCode } from "@oakoliver/bubbletea";
import { NewConfirm, NewForm, NewGroup } from "../src/index.js";
import { codeKeypress, viewModel } from "./helpers.js";

describe("Confirm", () => {
  test("TestConfirm — yes/no toggle with left/right keys", () => {
    const field = NewConfirm().title("Are you sure?");
    const f = NewForm(NewGroup(field));
    f.update(f.init());
    const view = viewModel(f);

    expect(view).toContain("Yes");
    expect(view).toContain("No");
    expect(view).toContain("Are you sure?");
    expect(view).toContain("toggle");
    expect(view).toContain("enter submit");
    expect(field.getValue()).toBe(false);

    // Toggle left → true
    f.update(codeKeypress(KeyCode.Left));
    expect(field.getValue()).toBe(true);

    // Toggle right → false
    f.update(codeKeypress(KeyCode.Right));
    expect(field.getValue()).toBe(false);
  });
});
