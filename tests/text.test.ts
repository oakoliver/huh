/**
 * Tests for Text field.
 * Ports: TestText, TestTextExternalEditorHidden from huh_test.go
 */
import { describe, test, expect } from "bun:test";
import { NewText, NewForm, NewGroup } from "../src/index.js";
import { typeText, viewModel } from "./helpers.js";

const text = "Huh";

describe("Text", () => {
  test("TestText — basic text area input", () => {
    const field = NewText();
    const f = NewForm(NewGroup(field));
    f.update(f.init());

    // Type "Huh" in the form
    const f2 = typeText(f, text);
    const view = viewModel(f2);

    expect(view).toContain(text);
    expect(view).toContain("alt+enter / ctrl+j new line");
    expect(view).toContain("ctrl+e open editor");
    expect(view).toContain("enter submit");
    expect(field.getValue()).toBe(text);
  });

  test("TestTextExternalEditorHidden — external editor help hidden when disabled", () => {
    const field = NewText().externalEditor(false);
    const f = NewForm(NewGroup(field));
    f.update(f.init());

    const f2 = typeText(f, text);
    const view = viewModel(f2);

    expect(view).toContain(text);
    expect(view).not.toContain("ctrl+e open editor");
    expect(field.getValue()).toBe(text);
  });
});
