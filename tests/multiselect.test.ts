/**
 * Tests for MultiSelect field.
 * Ports: TestMultiSelect, TestMultiSelectFiltering,
 *        TestSelectPageNavigation (multiselect variant),
 *        TestMultiSelectWithWidthUpdatesViewportWidth from Go tests.
 */
import { describe, test, expect } from "bun:test";
import { KeyCode, KeyMod } from "@oakoliver/bubbletea";
import {
  NewMultiSelect, NewOption, NewOptions, NewForm, NewGroup, type Form,
} from "../src/index.js";
import { keypress, codeKeypress, modKeypress, batchUpdate, viewModel } from "./helpers.js";

describe("MultiSelect", () => {
  test("TestMultiSelect — multi-select with toggle, cursor movement", () => {
    const field = NewMultiSelect<string>()
      .options(NewOptions("Foo\nLine2", "Bar\nLine2", "Baz\nLine2", "Ban\nLine2"))
      .title("Which one?");
    const f = NewForm(NewGroup(field)).withHeight(5);
    f.update(f.init());

    let view = viewModel(f);
    expect(view).toContain("Foo");
    expect(view).toContain("Which one?");
    expect(view).toContain("> ");

    // Move down
    let m = batchUpdate(f.update(keypress("j")));
    view = viewModel(m);

    const [hVal, hOk] = field.hovered();
    expect(hOk).toBe(true);
    expect(hVal).toBe("Bar\nLine2");

    // Toggle
    m = batchUpdate(f.update(keypress("x")));
    view = viewModel(m);

    // Check help text
    expect(view).toContain("toggle");
    expect(view).toContain("enter submit");

    // Submit
    f.update(codeKeypress(KeyCode.Enter));

    const value = field.getValue() as string[];
    expect(Array.isArray(value)).toBe(true);
    expect(value.length).toBe(1);
    expect(value[0]).toBe("Bar\nLine2");
  });

  test("TestMultiSelectFiltering — filtering on", () => {
    const field = NewMultiSelect<string>()
      .options(NewOptions("Foo", "Bar", "Baz"))
      .title("Which one?")
      .filterable(true);
    const f = NewForm(NewGroup(field));
    f.update(f.init());

    // Activate filter and type 'B'
    f.update(keypress("/"));
    f.update(keypress("B"));

    const view = viewModel(f);
    // When filtering, Foo should be gone
    expect(view).not.toContain("Foo");
  });

  test("TestMultiSelectFiltering — filtering off", () => {
    const field = NewMultiSelect<string>()
      .options(NewOptions("Foo", "Bar", "Baz"))
      .title("Which one?")
      .filterable(false);
    const f = NewForm(NewGroup(field));
    f.update(f.init());

    // Attempt filter — should not work
    f.update(keypress("/"));
    f.update(keypress("B"));

    const view = viewModel(f);
    // When not filtering, Foo should still be there
    expect(view).toContain("Foo");
  });

  test("TestMultiSelectFiltering — remove filter from help menu", () => {
    const field = NewMultiSelect<string>()
      .options(NewOptions("Foo", "Bar", "Baz"))
      .title("Which one?")
      .filterable(false);
    const f = NewForm(NewGroup(field));
    f.update(f.init());

    const view = viewModel(f);
    expect(view).not.toContain("filter");
  });

  test("TestSelectPageNavigation — multiselect variant", () => {
    const opts = NewOptions(
      "Qux", "Quux", "Foo", "Bar", "Baz", "Corge", "Grault", "Garply",
      "Waldo", "Fred", "Plugh", "Xyzzy", "Thud", "Norf", "Blip", "Flob",
      "Zorp", "Smurf", "Bloop", "Ping",
    );

    const reFirst = /> .*Qux/;
    const reLast = /> .*Ping/;
    const reHalfDown = /> .*Baz/;

    const field = NewMultiSelect<string>().options(opts).title("Choose");
    const f = NewForm(NewGroup(field)).withHeight(10);
    f.update(f.init());

    let view = viewModel(f);
    expect(view).toMatch(reFirst);

    // G → last
    let m = batchUpdate(f.update(keypress("G")));
    view = viewModel(m);
    expect(view).toMatch(reLast);

    // g → first
    m = batchUpdate(f.update(keypress("g")));
    view = viewModel(m);
    expect(view).toMatch(reFirst);

    // ctrl+d → half page down
    m = batchUpdate(f.update(modKeypress(KeyMod.Ctrl, "d".charCodeAt(0))));
    view = viewModel(m);
    expect(view).toMatch(reHalfDown);

    // Multiple ctrl+u → stays at first
    for (let i = 0; i < 10; i++) {
      m = batchUpdate(f.update(modKeypress(KeyMod.Ctrl, "u".charCodeAt(0))));
    }
    view = viewModel(m);
    expect(view).toMatch(reFirst);

    // Multiple ctrl+d → stays at last
    for (let i = 0; i < 10; i++) {
      m = batchUpdate(f.update(modKeypress(KeyMod.Ctrl, "d".charCodeAt(0))));
    }
    view = viewModel(m);
    expect(view).toMatch(reLast);
  });

  test("TestMultiSelectWithWidthUpdatesViewportWidth", () => {
    const field = NewMultiSelect<string>()
      .title("Pick many")
      .options([NewOption("Option 1", "1"), NewOption("Option 2", "2")]);

    (field as any).withWidth(20);
    expect(field.getViewport().width()).toBe(18);

    (field as any).withWidth(44);
    expect(field.getViewport().width()).toBe(42);
  });
});
