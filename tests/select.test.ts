/**
 * Tests for Select field.
 * Ports: TestSelect, TestSelectDynamic, TestSelectPageNavigation,
 *        TestSelectWithWidthUpdatesViewportWidth,
 *        TestSelectFilteringShowsMatchesAboveTheCursor from Go tests.
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

  test("TestSelectFilteringShowsMatchesAboveTheCursor (upstream #804)", () => {
    // Bar and Baz sit at opposite ends of the list, so filtering for "ba"
    // while the cursor is at the bottom leaves Bar above the visible window.
    const opts = NewOptions("Bar", "Qux", "Quux", "Foo", "Corge", "Grault", "Garply", "Waldo", "Fred", "Baz");

    const field = NewSelect<string>().options(opts).title("Choose");
    const f = NewForm(NewGroup(field)).withHeight(6);
    f.update(f.init());

    // Move to the end of the list, scrolling the viewport away from the top.
    batchUpdate(f.update(keypress("G")));
    expect(viewModel(f)).not.toContain("Bar");

    batchUpdate(f.update(keypress("/")));
    batchUpdate(f.update(keypress("b")));
    const m = batchUpdate(f.update(keypress("a")));

    const view = viewModel(m);
    expect(view).toContain("Bar");
    expect(view).toContain("Baz");
    // The cursor moves to the first match when the filter text changes.
    expect(view).toContain("> Bar");
    expect(field.hovered()).toEqual(["Bar", true]);
  });

  test("TestSelectFiltering keeps the cursor while navigating an unchanged filter", () => {
    const field = NewSelect<string>()
      .options(NewOptions("Bar", "Qux", "Baz", "Bat"))
      .title("Choose");
    const f = NewForm(NewGroup(field)).withHeight(10);
    f.update(f.init());

    batchUpdate(f.update(keypress("/")));
    batchUpdate(f.update(keypress("b")));
    batchUpdate(f.update(keypress("a")));
    expect(field.hovered()).toEqual(["Bar", true]);

    // Arrow keys don't change the filter text, so the cursor is kept.
    batchUpdate(f.update(codeKeypress(KeyCode.Down)));
    batchUpdate(f.update(codeKeypress(KeyCode.Down)));
    expect(field.hovered()).toEqual(["Bat", true]);
    expect(viewModel(f)).toContain("> Bat");

    // Narrowing the filter resets the cursor to the first match.
    batchUpdate(f.update(keypress("z")));
    expect(field.hovered()).toEqual(["Baz", true]);
  });

  test("unselected options keep their cursor-width indentation inside a sized form", () => {
    // Guards against lipgloss stripping leading whitespace when a width is set
    // (regression in @oakoliver/lipgloss 1.1.0, fixed in 1.1.1).
    const field = NewSelect<string>().options(NewOptions("Foo", "Bar")).title("T");
    const f = NewForm(NewGroup(field)).withWidth(40);
    f.update(f.init());

    const lines = viewModel(f).split("\n");
    expect(lines.some((l) => l.includes("> Foo"))).toBe(true);
    const bar = lines.find((l) => l.includes("Bar"));
    expect(bar).toBeDefined();
    // "> " cursor is two cells wide, so the unselected option is padded by two.
    expect(bar!).toMatch(/┃   Bar/);
  });
});
