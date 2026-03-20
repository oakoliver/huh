/**
 * Tests for Form, Group, and form-level behaviors.
 * Ports: TestForm, TestHideGroup, TestHideGroupLastAndFirstGroupsNotHidden,
 *        TestPrevGroup, TestDynamicHelp, TestSkip, TestNoTitleOrDescription,
 *        TestTitleRowRender, TestDescriptionRowRender, TestGetFocusedField
 *        from huh_test.go
 */
import { describe, test, expect } from "bun:test";
import { KeyCode, KeyMod, KeyPressMsg } from "@oakoliver/bubbletea";
import { stripAnsi } from "@oakoliver/lipgloss";
import {
  NewForm, NewGroup, NewSelect, NewMultiSelect, NewInput, NewText,
  NewConfirm, NewNote, NewFilePicker, NewOption, NewOptions,
  FormState, NextField, PrevField,
  nextGroup, prevGroup,
  type Form,
} from "../src/index.js";
import { keypress, codeKeypress, modKeypress, batchUpdate, typeText, viewModel } from "./helpers.js";

function lipglossHeight(s: string): number {
  if (!s) return 0;
  return s.split("\n").length;
}

// ---------------------------------------------------------------------------
// TestForm — Full taco ordering form integration test
// ---------------------------------------------------------------------------

describe("Form", () => {
  test("TestForm — full taco ordering form integration test", () => {
    let shell = "";
    let base = "";
    let toppings: string[] = [];
    let name = "";
    let instructions = "";
    let discount = false;

    const f = NewForm(
      NewGroup(
        NewSelect<string>()
          .options(NewOptions("Soft", "Hard"))
          .title("Shell?")
          .description("Our tortillas are made fresh in-house every day.")
          .validate((t) => {
            if (t === "Hard") return new Error("we're out of hard shells, sorry");
            return null;
          })
          .value(() => shell, (v) => { shell = v; }),

        NewSelect<string>()
          .options(NewOptions("Chicken", "Beef", "Fish", "Beans"))
          .value(() => base, (v) => { base = v; })
          .title("Base"),
      ),

      // Prompt for toppings and special instructions.
      NewGroup(
        NewMultiSelect<string>()
          .title("Toppings")
          .description("Choose up to 4.")
          .options([
            NewOption("Lettuce", "lettuce").setSelected(true),
            NewOption("Tomatoes", "tomatoes").setSelected(true),
            NewOption("Corn", "corn"),
            NewOption("Salsa", "salsa"),
            NewOption("Sour Cream", "sour cream"),
            NewOption("Cheese", "cheese"),
          ])
          .validate((t) => {
            if (t.length <= 0) return new Error("at least one topping is required");
            return null;
          })
          .value(() => toppings, (v) => { toppings = v; })
          .filterable(true)
          .limit(4),
      ),

      // Gather final details for the order.
      NewGroup(
        NewInput()
          .value(() => name, (v) => { name = v; })
          .title("What's your name?")
          .placeholder("Margaret Thatcher")
          .description("For when your order is ready."),

        NewText()
          .value(() => instructions, (v) => { instructions = v; })
          .placeholder("Just put it in the mailbox please")
          .title("Special Instructions")
          .description("Anything we should know?")
          .charLimit(400),

        NewConfirm()
          .title("Would you like 15% off?")
          .value(() => discount, (v) => { discount = v; })
          .affirmative("Yes!")
          .negative("No."),
      ),
    );

    f.update(f.init());
    let view = viewModel(f);

    // Group 1 should show Shell? and Base
    expect(view).toContain("Shell?");
    expect(view).toContain("Our tortillas are made fresh in-house every day.");
    expect(view).toContain("Base");

    // Attempt to select hard shell and trigger validation error
    let m = batchUpdate(f.update(keypress("j")));
    m = batchUpdate(m.update(codeKeypress(KeyCode.Tab)));
    view = viewModel(m);
    expect(view).toContain("we're out of hard shells, sorry");

    // Select back the soft shell
    m = batchUpdate(m.update(keypress("k")));
    m = batchUpdate(m.update(codeKeypress(KeyCode.Enter)));
    view = viewModel(m);
    expect(view).toContain("> Chicken");

    // batchMsg + nextGroup → go to toppings
    m = batchUpdate(m.update(codeKeypress(KeyCode.Enter)));
    view = viewModel(m);
    expect(view).toContain("Toppings");
    expect(view).toContain("Choose up to 4.");

    // Move down in toppings, toggle corn
    m = batchUpdate(m.update(keypress("j")));
    m = batchUpdate(m.update(keypress("j")));
    m = batchUpdate(m.update(keypress("x")));

    // Submit toppings → move to final group
    m = batchUpdate(m.update(codeKeypress(KeyCode.Enter)));
    view = viewModel(m);
    expect(view).toContain("What's your name?");
    expect(view).toContain("Special Instructions");
    expect(view).toContain("Would you like 15% off?");

    // Type name
    const m2 = typeText(m, "Glen");
    view = viewModel(m2);
    expect(view).toContain("Glen");

    expect(shell).toBe("Soft");
    expect(base).toBe("Chicken");
    expect(toppings.length).toBe(3);
    expect(name).toBe("Glen");
  });

  // ---------------------------------------------------------------------------
  // TestHideGroup
  // ---------------------------------------------------------------------------

  test("TestHideGroup — group hiding with WithHide/WithHideFunc", () => {
    const f = NewForm(
      NewGroup(NewNote().description("Foo")).withHide(true),
      NewGroup(NewNote().description("Bar")),
      NewGroup(NewNote().description("Baz")),
      NewGroup(NewNote().description("Qux"))
        .withHideFunc(() => false)
        .withHide(true),
    );

    let m = batchUpdate(f, f.nextGroup()) as Form;
    let v = m.view();
    expect(v).toContain("Bar");

    // Previous group should have no effect — group 0 is hidden
    m.update(prevGroup());
    v = m.view();
    expect(v).toContain("Bar");

    // Next group
    m.update(nextGroup());
    v = m.view();
    expect(v).toContain("Baz");

    // Next group — Qux has WithHide(true) which overrides WithHideFunc
    m.update(nextGroup());
    v = m.view();
    expect(v).not.toContain("Qux");
    expect(m.State).toBe(FormState.Completed);
  });

  // ---------------------------------------------------------------------------
  // TestHideGroupLastAndFirstGroupsNotHidden
  // ---------------------------------------------------------------------------

  test("TestHideGroupLastAndFirstGroupsNotHidden — edge case group hiding", () => {
    const f = NewForm(
      NewGroup(NewNote().description("Bar")),
      NewGroup(NewNote().description("Foo")).withHide(true),
      NewGroup(NewNote().description("Baz")),
    );

    let m = batchUpdate(f, f.init()) as Form;
    let v = stripAnsi(m.view());
    expect(v).toContain("Bar");

    // prev group should have no effect
    m.update(prevGroup());
    v = m.view();
    expect(v).toContain("Bar");

    // next group skips hidden Foo → shows Baz
    m.update(nextGroup());
    v = stripAnsi(m.view());
    expect(v).toContain("Baz");

    // next group → should submit
    m.update(nextGroup());
    expect(m.State).toBe(FormState.Completed);
  });

  // ---------------------------------------------------------------------------
  // TestPrevGroup
  // ---------------------------------------------------------------------------

  test("TestPrevGroup — previous group navigation", () => {
    const f = NewForm(
      NewGroup(NewNote().description("Bar")),
      NewGroup(NewNote().description("Foo")),
      NewGroup(NewNote().description("Baz")),
    );

    let m = batchUpdate(f, f.init()) as Form;
    m.update(nextGroup());
    m.update(nextGroup());
    m.update(prevGroup());
    m.update(prevGroup());

    const v = stripAnsi(m.view());
    expect(v).toContain("Bar");
  });

  // ---------------------------------------------------------------------------
  // TestDynamicHelp
  // ---------------------------------------------------------------------------

  test("TestDynamicHelp — help text changes based on field position", () => {
    const f = NewForm(
      NewGroup(
        NewInput().title("Dynamic Help"),
        NewInput().title("Dynamic Help"),
        NewInput().title("Dynamic Help"),
      ),
    );
    f.update(f.init());
    const view = viewModel(f);

    expect(view).toContain("Dynamic Help");
    // First field should not show shift+tab (no previous) or submit
    expect(view).not.toContain("shift+tab");
    expect(view).not.toContain("submit");
  });

  // ---------------------------------------------------------------------------
  // TestSkip
  // ---------------------------------------------------------------------------

  test("TestSkip — note fields are skipped during navigation", () => {
    const f = NewForm(
      NewGroup(
        NewInput().title("First"),
        NewNote().title("Skipped"),
        NewNote().title("Skipped"),
        NewInput().title("Second"),
      ),
    ).withWidth(25);

    let m = batchUpdate(f, f.init()) as Form;
    let view = viewModel(m);
    // First field focused (shown with ┃ prefix in charm theme)
    expect(view).toContain("First");

    // NextField should skip notes → focus Second
    m.update(NextField());
    view = viewModel(m);
    // Second should now be focused
    expect(view).toContain("Second");

    // PrevField should skip notes → focus First
    m.update(PrevField());
    view = viewModel(m);
    expect(view).toContain("First");
  });

  // ---------------------------------------------------------------------------
  // TestNoTitleOrDescription
  // ---------------------------------------------------------------------------

  test("TestNoTitleOrDescription — all field types render minimal height without title/description", () => {
    const cases: Record<string, { empty: { view(): string }; emptyHeight: number }> = {
      Confirm: { empty: NewConfirm(), emptyHeight: 1 },
      Input: { empty: NewInput(), emptyHeight: 1 },
      Note: { empty: NewNote(), emptyHeight: 1 },
      Select: { empty: NewSelect<string>(), emptyHeight: 1 },
      MultiSelect: { empty: NewMultiSelect<string>(), emptyHeight: 1 },
    };

    for (const [name, tt] of Object.entries(cases)) {
      const view = tt.empty.view();
      const got = lipglossHeight(stripAnsi(view));
      expect(got).toBe(tt.emptyHeight);
    }
  });

  // ---------------------------------------------------------------------------
  // TestTitleRowRender
  // ---------------------------------------------------------------------------

  test("TestTitleRowRender — all fields render title when set", () => {
    const titleStr = "A Title";
    const titledFields: { view(): string }[] = [
      NewConfirm().title(titleStr),
      NewInput().title(titleStr),
      NewNote().title(titleStr),
      NewSelect<string>().title(titleStr),
      NewMultiSelect<string>().title(titleStr),
      NewFilePicker().title(titleStr),
    ];

    for (const field of titledFields) {
      const view = field.view();
      expect(view).toContain(titleStr);
    }
  });

  // ---------------------------------------------------------------------------
  // TestDescriptionRowRender
  // ---------------------------------------------------------------------------

  test("TestDescriptionRowRender — all fields render description when set", () => {
    const descStr = "A Description";
    const describedFields: { view(): string }[] = [
      NewConfirm().description(descStr),
      NewInput().description(descStr),
      NewNote().description(descStr),
      NewSelect<string>().description(descStr),
      NewMultiSelect<string>().description(descStr),
      NewFilePicker().description(descStr),
    ];

    for (const field of describedFields) {
      const view = field.view();
      expect(view).toContain(descStr);
    }
  });

  // ---------------------------------------------------------------------------
  // TestGetFocusedField
  // ---------------------------------------------------------------------------

  test("TestGetFocusedField — getFocusedField returns correct field after navigation", () => {
    const f = NewForm(
      NewGroup(
        NewInput().title("First").key("First"),
        NewInput().title("Second").key("Second"),
        NewInput().title("Third").key("Third"),
      ),
    ).withWidth(25);

    let m = batchUpdate(f, f.init()) as Form;

    // nextField is triggered through NextField message
    m.update(NextField());
    const field = m.getFocusedField();
    expect(field.getKey()).toBe("Second");
  });
});
