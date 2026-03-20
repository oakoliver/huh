/**
 * Form — the top-level form container.
 * Port of charmbracelet/huh form.go
 *
 * A Form is a collection of Groups displayed one at a time (or via
 * a layout). The user navigates between groups until all are completed.
 */

import {
  type Cmd,
  type Msg,
  Batch,
  Sequence,
  Quit,
  Interrupt,
  RequestWindowSize,
  type ProgramOption,
  Program,
  WithOutput,
  WithInput,
  WithAltScreen,
  type KeyPressMsg,
  type WindowSizeMsg,
} from "@oakoliver/bubbletea";
import { matches, type Binding, type HelpModel } from "@oakoliver/bubbles";

import { Selector } from "./selector.js";
import { Group, NewGroup, isNextGroupMsg, isPrevGroupMsg } from "./group.js";
import { isNextFieldMsg } from "./field-input.js";
import type { Field, FieldPosition } from "./field-input.js";
import { NewDefaultKeyMap, type KeyMap } from "./keymap.js";
import { type Theme, type Styles, type FormStyles, ThemeCharm } from "./theme.js";
import { type Layout, layoutDefault } from "./layout.js";
import type { LayoutForm, LayoutGroup } from "./layout.js";

// ---------------------------------------------------------------------------
// Constants & errors
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 80;

/** FormState represents the current state of the form. */
export enum FormState {
  Normal = 0,
  Completed = 1,
  Aborted = 2,
}

/** Error returned when a user exits the form before submitting. */
export class ErrUserAborted extends Error {
  constructor() { super("user aborted"); this.name = "ErrUserAborted"; }
}

/** Error returned when the timeout is reached. */
export class ErrTimeout extends Error {
  constructor() { super("timeout"); this.name = "ErrTimeout"; }
}

// ---------------------------------------------------------------------------
// Form class
// ---------------------------------------------------------------------------

export class Form implements LayoutForm {
  /** Group selector for navigating between groups. */
  selector: Selector<Group>;

  /** Result values keyed by field key. */
  results: Map<string, any> = new Map();

  /** Command executed on form submission. */
  SubmitCmd: Cmd = null;
  /** Command executed on form cancellation. */
  CancelCmd: Cmd = null;

  /** Current state of the form. */
  State: FormState = FormState.Normal;

  private accessible = false;
  private quitting = false;
  private aborted = false;

  private _width = 0;
  private _height = 0;
  private _theme: Theme | null = null;
  private hasDarkBg = false;
  private _keymap: KeyMap;
  private teaOptions: ProgramOption[] = [];
  private _layout: Layout = layoutDefault;

  private _output: NodeJS.WritableStream | null = null;
  private _input: NodeJS.ReadableStream | null = null;

  constructor(groups: Group[]) {
    this.selector = new Selector(groups);
    this._keymap = NewDefaultKeyMap();

    // Apply keymap and update positions
    this.withKeyMap(this._keymap);
    this.withWidth(this._width);
    this.withHeight(this._height);
    this.updateFieldPositions();
  }

  // -- Builder methods --

  /** Sets accessible mode (basic terminal prompting for screen readers). */
  withAccessible(accessible: boolean): Form {
    this.accessible = accessible;
    return this;
  }

  /** Sets whether help is shown for all groups. */
  withShowHelp(v: boolean): Form {
    this.selector.range((_i, group) => {
      group.withShowHelp(v);
      return true;
    });
    return this;
  }

  /** Sets whether errors are shown for all groups. */
  withShowErrors(v: boolean): Form {
    this.selector.range((_i, group) => {
      group.withShowErrors(v);
      return true;
    });
    return this;
  }

  /** Sets the theme for all groups. */
  withTheme(theme: Theme): Form {
    if (!theme) return this;
    this._theme = theme;
    this.selector.range((_i, group) => {
      group.withTheme(theme);
      return true;
    });
    return this;
  }

  /** Sets the keymap for all groups. */
  withKeyMap(keymap: KeyMap): Form {
    if (!keymap) return this;
    this._keymap = keymap;
    this.selector.range((_i, group) => {
      group.withKeyMap(keymap);
      return true;
    });
    this.updateFieldPositions();
    return this;
  }

  /** Sets the width for all groups. */
  withWidth(width: number): Form {
    if (width <= 0) return this;
    this._width = width;
    this.selector.range((_i, group) => {
      const w = this._layout.groupWidth(this, group, width);
      group.withWidth(w);
      return true;
    });
    return this;
  }

  /** Sets the height for all groups. */
  withHeight(height: number): Form {
    if (height <= 0) return this;
    this._height = height;
    this.selector.range((_i, group) => {
      group.withHeight(height);
      return true;
    });
    return this;
  }

  /** Sets the output writer. */
  withOutput(w: NodeJS.WritableStream): Form {
    this._output = w;
    this.teaOptions.push(WithOutput(w as any));
    return this;
  }

  /** Sets the input reader. */
  withInput(r: NodeJS.ReadableStream): Form {
    this._input = r;
    this.teaOptions.push(WithInput(r as any));
    return this;
  }

  /** Sets the layout. */
  withLayout(layout: Layout): Form {
    this._layout = layout;
    return this;
  }

  /** Sets tea program options. */
  withProgramOptions(...opts: ProgramOption[]): Form {
    this.teaOptions = opts;
    return this;
  }

  // -- Field positions --

  /** Updates field positions across all groups. */
  updateFieldPositions(): Form {
    let firstGroup = 0;
    let lastGroup = this.selector.total() - 1;

    // Determine first non-hidden group
    this.selector.range((_i, g) => {
      if (!this.isGroupHidden(g)) return false;
      firstGroup++;
      return true;
    });

    // Determine last non-hidden group
    this.selector.reverseRange((_i, g) => {
      if (!this.isGroupHidden(g)) return false;
      lastGroup--;
      return true;
    });

    this.selector.range((g, group) => {
      // Determine first non-skippable field
      let firstField = 0;
      group.selector.range((_i, field) => {
        if (!field.skip() || group.selector.total() === 1) return false;
        firstField++;
        return true;
      });

      // Determine last non-skippable field
      let lastField = 0;
      group.selector.reverseRange((i, field) => {
        lastField = i;
        if (!field.skip() || group.selector.total() === 1) return false;
        return true;
      });

      group.selector.range((i, field) => {
        field.withPosition({
          group: g,
          field: i,
          firstField,
          lastField,
          groupCount: this.selector.total(),
          firstGroup,
          lastGroup,
        } as FieldPosition);
        return true;
      });

      return true;
    });

    return this;
  }

  // -- Accessors --

  /** Returns the current group's errors. */
  errors(): Error[] {
    return this.selector.selected().errors();
  }

  /** Returns the current group's help model. */
  // help(): HelpModel {
  //   return this.selector.selected().help;
  // }

  /** Returns the current field's keybindings. */
  keyBinds(): Binding[] {
    const group = this.selector.selected();
    return group.selector.selected().keyBinds();
  }

  /** Gets a result value by key. */
  get(key: string): any {
    return this.results.get(key);
  }

  /** Gets a result value as string. */
  getString(key: string): string {
    return (this.results.get(key) as string) ?? "";
  }

  /** Gets a result value as number. */
  getInt(key: string): number {
    return (this.results.get(key) as number) ?? 0;
  }

  /** Gets a result value as boolean. */
  getBool(key: string): boolean {
    return (this.results.get(key) as boolean) ?? false;
  }

  /** Moves to the next group programmatically. */
  nextGroup(): Cmd {
    const [, cmd] = this.update({ _tag: "nextGroupMsg" });
    return cmd;
  }

  /** Moves to the previous group programmatically. */
  prevGroup(): Cmd {
    const [, cmd] = this.update({ _tag: "prevGroupMsg" });
    return cmd;
  }

  /** Returns the currently focused field. */
  getFocusedField(): Field {
    return this.selector.selected().selector.selected();
  }

  // -- Tea Model interface --

  /** Initializes the form. */
  init(): Cmd {
    const cmds: Cmd[] = [];
    this.selector.range((i, group) => {
      if (i === 0) {
        group.active = true;
      }
      const cmd = group.init();
      if (cmd) cmds.push(cmd);
      return true;
    });

    if (this.isGroupHidden(this.selector.selected())) {
      cmds.push(() => ({ _tag: "nextGroupMsg" }));
    }

    cmds.push(RequestWindowSize);
    return Sequence(...cmds);
  }

  /** Updates the form, handling navigation and state transitions. */
  update(msg: Msg): [Form, Cmd] {
    // If the form is aborted or completed, no need to update.
    if (this.State !== FormState.Normal) {
      return [this, null];
    }

    const group = this.selector.selected();

    // Handle specific message types
    if ((msg as any)?._tag === "BackgroundColorMsg") {
      this.hasDarkBg = (msg as any).isDark();
    }

    if ((msg as any)?._tag === "WindowSizeMsg") {
      const wsm = msg as WindowSizeMsg;
      if (this._width === 0) {
        this.selector.range((_i, g) => {
          const w = this._layout.groupWidth(this, g, wsm.width);
          g.withWidth(w);
          return true;
        });
      }
      if (this._height === 0) {
        // Calculate needed height (max of all groups)
        let neededHeight = 0;
        this.selector.range((_i, g) => {
          const rh = g.view().split("\n").length;
          neededHeight = Math.max(neededHeight, rh);
          return true;
        });
        this.selector.range((_i, g) => {
          g.withHeight(Math.min(neededHeight, wsm.height));
          return true;
        });
      }
    }

    if ((msg as any)?._tag === "KeyPressMsg") {
      if (matches(msg as KeyPressMsg, this._keymap.quit)) {
        this.aborted = true;
        this.quitting = true;
        this.State = FormState.Aborted;
        return [this, this.CancelCmd];
      }
    }

    if (isNextFieldMsg(msg)) {
      // Save the current field's value
      const field = group.selector.selected();
      this.results.set(field.getKey(), field.getValue());
    }

    if (isNextGroupMsg(msg)) {
      if (group.errors().length > 0) {
        return [this, null];
      }

      const submit = (): [Form, Cmd] => {
        this.quitting = true;
        this.State = FormState.Completed;
        return [this, this.SubmitCmd];
      };

      if (this.selector.onLast()) {
        return submit();
      }

      let found = false;
      for (let i = this.selector.index() + 1; i < this.selector.total(); i++) {
        if (!this.isGroupHidden(this.selector.get(i))) {
          this.selector.setIndex(i);
          found = true;
          break;
        }
        if (i === this.selector.total() - 1) {
          return submit();
        }
      }

      if (found) {
        this.selector.selected().active = true;
        return [this, this.selector.selected().init()];
      }
    }

    if (isPrevGroupMsg(msg)) {
      if (group.errors().length > 0) {
        return [this, null];
      }

      for (let i = this.selector.index() - 1; i >= 0; i--) {
        if (!this.isGroupHidden(this.selector.get(i))) {
          this.selector.setIndex(i);
          break;
        }
      }

      this.selector.selected().active = true;
      return [this, this.selector.selected().init()];
    }

    const [, cmd] = group.update(msg);

    // A key press could hide/show other groups; update positions.
    if ((msg as any)?._tag === "KeyPressMsg") {
      this.updateFieldPositions();
    }

    return [this, cmd];
  }

  private isGroupHidden(group: Group): boolean {
    const hide = group.hide;
    if (!hide) return false;
    return hide();
  }

  private getTheme(): Styles {
    if (this._theme) {
      return this._theme.theme(this.hasDarkBg);
    }
    return ThemeCharm(this.hasDarkBg);
  }

  /** Returns the form styles (used by Layout). */
  styles(): FormStyles {
    return this.getTheme().form;
  }

  /** Renders the form view. */
  view(): string {
    if (this.quitting) return "";
    return this.styles().base.render(this._layout.view(this));
  }

  /** Runs the form, blocking until completion. */
  async run(): Promise<void> {
    this.SubmitCmd = Quit;
    this.CancelCmd = Interrupt;

    if (this.selector.total() === 0) return;

    if (this.accessible) {
      return this.runAccessible();
    }

    return this.runTea();
  }

  private async runTea(): Promise<void> {
    const p = new Program(this, ...this.teaOptions);
    const model = await p.run();
    const f = model as Form;
    if (f.aborted) {
      throw new ErrUserAborted();
    }
  }

  private async runAccessible(): Promise<void> {
    const w = this._output ?? process.stdout;
    const r = this._input ?? process.stdin;

    this.selector.range((_gi, group) => {
      group.selector.range((_fi, field) => {
        field.init();
        field.focus();
        // In accessible mode, we delegate to each field's runAccessible
        // For now, this is a simplified implementation
        return true;
      });
      return true;
    });
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates a new Form with the given groups. */
export function NewForm(...groups: Group[]): Form {
  return new Form(groups);
}
