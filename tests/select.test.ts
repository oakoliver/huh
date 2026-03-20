/**
 * Tests for Select field.
 * Ports: TestSelect, TestSelectDynamic, TestSelectPageNavigation,
 *        TestSelectWithWidthUpdatesViewportWidth from Go tests.
 */
import { describe, test, expect } from "bun:test";
import { KeyCode, KeyMod } from "@oakoliver/bubbletea";
import {
  NewSelect, NewOption, NewOptions, NewForm, NewGroup, type Form,
} from "../src/index.js";
import { keypress, codeKeypress, modKeypress, batchUpdate, viewModel, doAllUpdates } from "./helpers.js";

describe("Select", () => {
  test("TestSelect — basic select with cursor movement, multi-line options, submission", () => {
    const field = NewSelect<string>()
      .options(NewOptions("Foo\nLine 2", "Bar\nLine 2", "Baz\nLine 2", "Ban\nLine 2"))
      .title("Which one?");
    const f = NewForm(NewGroup(field)).withHeight(5);
    f.update(f.init());

    let view = viewModel(f);
    expect(view).toContain("Foo");
    expect(view).toContain("Which one?");
    expect(view).toContain("> Foo");

    // Move selection cursor down
    let m = batchUpdate(f.update(codeKeypress(KeyCode.Down))) as Form;
    view = viewModel(m);

    const [hoveredVal, ok] = field.hovered();
    expect(ok).toBe(true);
    expect(hoveredVal).toBe("Bar\nLine 2");

    expect(view).not.toContain("> Foo");
    expect(view).toContain("> Bar");
    expect(view).toContain("enter submit");

    // Submit
    f.update(codeKeypress(KeyCode.Enter));
    expect(field.getValue()).toBe("Bar\nLine 2");
  });

  test("TestSelectDynamic — dynamic options/title/description via Eval functions", () => {
    const trigger = { val: "initial" };

    const field1 = NewSelect<string>()
      .titleFunc(() => "field1 title " + trigger.val, trigger)
      .descriptionFunc(() => "field1 desc " + trigger.val, trigger)
      .optionsFunc(() => [NewOption("field1 opt " + trigger.val, "field1 opt " + trigger.val)], trigger);
    const field2 = NewSelect<string>()
      .titleFunc(() => "field2 title " + trigger.val, trigger)
      .descriptionFunc(() => "field2 desc " + trigger.val, trigger)
      .optionsFunc(() => [NewOption("field2 opt " + trigger.val, "field2 opt " + trigger.val)], trigger);

    (field1 as any).withHeight(5);
    (field2 as any).withHeight(5);
    const f = NewForm(NewGroup(field1 as any, field2 as any)).withHeight(10);

    // doAllUpdates — recursively resolve init commands (matches Go's pattern)
    doAllUpdates(f, f.init());

    let view = viewModel(f);
    const initialExpected = [
      "field1 title initial",
      "field1 desc initial",
      "field1 opt initial",
      "field2 title initial",
      "field2 desc initial",
      "field2 opt initial",
    ];
    for (const expected of initialExpected) {
      expect(view).toContain(expected);
    }
  });

  test("TestSelectPageNavigation — G/g, ctrl+d/ctrl+u for select", () => {
    const opts = NewOptions(
      "Qux", "Quux", "Foo", "Bar", "Baz", "Corge", "Grault", "Garply",
      "Waldo", "Fred", "Plugh", "Xyzzy", "Thud", "Norf", "Blip", "Flob",
      "Zorp", "Smurf", "Bloop", "Ping",
    );

    const reFirst = /> Qux/;
    const reLast = /> Ping/;
    const reHalfDown = /> Baz/;

    const field = NewSelect<string>().options(opts).title("Choose");
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

    // Multiple ctrl+u → should stay at first
    for (let i = 0; i < 10; i++) {
      m = batchUpdate(f.update(modKeypress(KeyMod.Ctrl, "u".charCodeAt(0))));
    }
    view = viewModel(m);
    expect(view).toMatch(reFirst);

    // Multiple ctrl+d → should stay at last
    for (let i = 0; i < 10; i++) {
      m = batchUpdate(f.update(modKeypress(KeyMod.Ctrl, "d".charCodeAt(0))));
    }
    view = viewModel(m);
    expect(view).toMatch(reLast);
  });

  test("TestSelectWithWidthUpdatesViewportWidth", () => {
    const field = NewSelect<string>()
      .title("Pick one")
      .options([NewOption("Option 1", "1"), NewOption("Option 2", "2")]);

    // Viewport width = field width - base style horizontal frame (2: 1 border + 1 padding)
    (field as any).withWidth(18);
    expect(field.getViewport().width()).toBe(16);

    (field as any).withWidth(42);
    expect(field.getViewport().width()).toBe(40);
  });
});
