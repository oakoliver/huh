/**
 * Tests for Input field.
 * Ports: TestInput, TestPasteNotDuplicated, TestInlineInput from huh_test.go
 */
import { describe, test, expect } from "bun:test";
import { KeyCode, PasteMsg } from "@oakoliver/bubbletea";
import { NewInput, NewForm, NewGroup } from "../src/index.js";
import { keypress, codeKeypress, typeText, viewModel, batchUpdate } from "./helpers.js";

const text = "Huh";

describe("Input", () => {
  test("TestInput — basic input with typing and value retrieval", () => {
    const field = NewInput();
    const f = NewForm(NewGroup(field));
    f.update(f.init());

    let view = viewModel(f);
    expect(view).toContain(">");

    // Type "Huh" in the form
    const f2 = typeText(f, text);
    view = viewModel(f2);
    expect(view).toContain(text);
    expect(view).toContain("enter submit");
    expect(field.getValue()).toBe(text);
  });

  test("TestPasteNotDuplicated — PasteMsg handling", () => {
    const field = NewInput().title("Name");
    const f = NewForm(NewGroup(field));
    f.update(f.init());

    const pasteMsg = { _tag: "PasteMsg", content: "hello" } as any;
    const f2 = batchUpdate(f.update(pasteMsg));
    expect(field.getValue()).toBe("hello");
  });

  test("TestInlineInput — inline input mode", () => {
    const field = NewInput()
      .title("Input ")
      .prompt(": ")
      .description("Description")
      .inline(true);

    const f = NewForm(NewGroup(field)).withWidth(40);
    f.update(f.init());

    let view = viewModel(f);
    expect(view).toContain("Input Description:");

    // Type "Huh" in the form
    const f2 = typeText(f, text);
    view = viewModel(f2);
    expect(view).toContain(text);
    expect(view).toContain("enter submit");
    expect(view).toContain("Input Description: " + text);
    expect(field.getValue()).toBe(text);
  });
});
