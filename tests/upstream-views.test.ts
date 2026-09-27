/**
 * Rendered-form parity with upstream charmbracelet/huh (v2.0.3 + main @ ffb6a97).
 *
 * fixtures/upstream-views.json holds the ANSI-stripped View() of each form
 * below, for every built-in theme, rendered by upstream Go after
 * Init + WindowSizeMsg{80, 40}, and again after pressing Tab.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { KeyCode, WindowSizeMsg } from "@oakoliver/bubbletea";
import { stripAnsi } from "@oakoliver/lipgloss";
import {
  NewForm, NewGroup, NewInput, NewConfirm, NewSelect, NewMultiSelect, NewText, NewNote,
  NewOptions, NewOption, ThemeFunc, ThemeBase, ThemeCharm, ThemeDracula, ThemeBase16,
  ThemeCatppuccin, type Form, type Styles,
} from "../src/index.js";
import { viewModel, batchUpdate, codeKeypress } from "./helpers.js";

const upstream: Record<string, string> = JSON.parse(
  readFileSync(join(import.meta.dir, "fixtures", "upstream-views.json"), "utf8"),
);

const forms: Record<string, () => Form> = {
  "input+confirm": () => {
    let n = "";
    let ok = false;
    return NewForm(NewGroup(
      NewInput().title("Name").description("Your name").placeholder("Jane").value(() => n, (v) => { n = v; }),
      NewConfirm().title("OK?").value(() => ok, (v) => { ok = v; }),
    ));
  },
  "select+multi": () => {
    let s = "";
    let m: string[] = [];
    return NewForm(NewGroup(
      NewSelect<string>().title("Pick").options(NewOptions("a", "b", "c")).value(() => s, (v) => { s = v; }),
      NewMultiSelect<string>().title("Many")
        .options([NewOption("x", "x").setSelected(true), NewOption("y", "y")])
        .value(() => m, (v) => { m = v; }),
    ));
  },
  "text+note": () => {
    let t = "";
    return NewForm(NewGroup(
      NewNote().title("Hello").description("World").next(true),
      NewText().title("Story").value(() => t, (v) => { t = v; }),
    ));
  },
  "group-title": () => {
    let n = "";
    return NewForm(NewGroup(NewInput().title("A").value(() => n, (v) => { n = v; })).title("Group").description("Desc"));
  },
  "inline-select": () => {
    let s = "";
    return NewForm(NewGroup(
      NewSelect<string>().title("Pick").inline(true).options(NewOptions("a", "b", "c")).value(() => s, (v) => { s = v; }),
    ));
  },
};

const themes: Record<string, (isDark: boolean) => Styles> = {
  Base: ThemeBase,
  Charm: ThemeCharm,
  Dracula: ThemeDracula,
  Base16: ThemeBase16,
  Catppuccin: ThemeCatppuccin,
};

describe("rendered forms match upstream", () => {
  for (const [fname, mk] of Object.entries(forms)) {
    for (const [tname, th] of Object.entries(themes)) {
      test(`${fname} / ${tname}`, () => {
        const f = mk().withTheme(ThemeFunc(th));
        f.update(f.init());
        f.update(new WindowSizeMsg(80, 40));
        expect(viewModel(f)).toBe(upstream[`${fname}/${tname}`]);

        const m = batchUpdate(f.update(codeKeypress(KeyCode.Tab)));
        expect(viewModel(m)).toBe(upstream[`${fname}/${tname}/tab`]);
      });
    }
  }
});

describe("light/dark variants", () => {
  // Upstream fields start with hasDarkBg=false and switch on BackgroundColorMsg.
  const bg = (dark: boolean) => ({ _tag: "BackgroundColorMsg", isDark: () => dark });

  test("fields render the light variant until a dark background is reported", () => {
    let n = "";
    const f = NewForm(NewGroup(NewInput().title("Name").value(() => n, (v) => { n = v; })))
      .withTheme(ThemeFunc(ThemeCharm));
    f.update(f.init());
    // Charm indigo title: #5A56E0 light, #7571F9 dark.
    expect(f.view()).toContain("38;2;90;86;224m");
    f.update(bg(true) as any);
    expect(f.view()).toContain("38;2;117;113;249m");
    f.update(bg(false) as any);
    expect(f.view()).toContain("38;2;90;86;224m");
  });
});

describe("note markdown", () => {
  test("description renders _italic_, *bold* and escapes like upstream", () => {
    const n = NewNote().description("a _b_ *c* \\*d");
    const v = n.view();
    expect(v).toContain("a \x1b[3mb\x1b[23m \x1b[1mc\x1b[22m *d");
    expect(stripAnsi(v)).toContain("a b c *d");
  });
});
