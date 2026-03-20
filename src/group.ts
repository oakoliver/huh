/**
 * Group — a collection of fields displayed together on a form page.
 * Port of charmbracelet/huh group.go
 *
 * A Group manages field navigation via a Selector, renders content
 * through a viewport, and displays help/error footer.
 */

import {
  newViewport,
  newHelp,
  type ViewportModel,
  type HelpModel,
  type Binding,
} from "@oakoliver/bubbles";
import { type Cmd, type Msg, Batch } from "@oakoliver/bubbletea";

import { Selector } from "./selector.js";
import type { Field, FieldPosition } from "./field-input.js";
import { isNextFieldMsg, isPrevFieldMsg } from "./field-input.js";
import { isUpdateFieldMsg, updateFieldMsg } from "./eval.js";
import { type Theme, type Styles, type GroupStyles, ThemeFunc, ThemeCharm } from "./theme.js";
import type { KeyMap } from "./keymap.js";
import { wrap } from "./wrap.js";
import type { LayoutGroup } from "./layout.js";

// ---------------------------------------------------------------------------
// Navigation messages (group-level)
// ---------------------------------------------------------------------------

export interface NextGroupMsg { _tag: "nextGroupMsg"; }
export interface PrevGroupMsg { _tag: "prevGroupMsg"; }

export function nextGroup(): Msg { return { _tag: "nextGroupMsg" } as NextGroupMsg; }
export function prevGroup(): Msg { return { _tag: "prevGroupMsg" } as PrevGroupMsg; }

export function isNextGroupMsg(msg: any): msg is NextGroupMsg { return msg?._tag === "nextGroupMsg"; }
export function isPrevGroupMsg(msg: any): msg is PrevGroupMsg { return msg?._tag === "prevGroupMsg"; }

// ---------------------------------------------------------------------------
// lipgloss height helper
// ---------------------------------------------------------------------------

function lipglossHeight(s: string): number {
  if (!s) return 0;
  return s.split("\n").length;
}

// ---------------------------------------------------------------------------
// Group class
// ---------------------------------------------------------------------------

export class Group implements LayoutGroup {
  /** Field selector for navigating between fields. */
  selector: Selector<Field>;

  private _title = "";
  private _description = "";

  /** Viewport for scrollable content. */
  private viewport: ViewportModel;

  /** Help model for keybindings. */
  private help: HelpModel;

  /** Display options. */
  private showHelp = true;
  private showErrors = true;
  private _width = 80;
  private _height: number;
  private _theme: Theme | null = null;
  private hasDarkBg = false;
  private _keymap: KeyMap | null = null;
  private _hide: (() => boolean) | null = null;

  /** Whether this group is currently active (focused). */
  active = false;

  constructor(fields: Field[]) {
    this.selector = new Selector(fields);
    this.help = newHelp();
    this.viewport = newViewport();
    // Propagate default width to viewport, help, and all fields
    this.withWidth(this._width);
    this._height = this.rawHeight();
    this.viewport.setHeight(this._height);
  }

  // -- Builder methods --

  /** Sets the group title. */
  title(t: string): Group { this._title = t; return this; }
  /** Sets the group description. */
  description(d: string): Group { this._description = d; return this; }
  /** Sets whether help is shown. */
  withShowHelp(show: boolean): Group { this.showHelp = show; return this; }
  /** Sets whether errors are shown. */
  withShowErrors(show: boolean): Group { this.showErrors = show; return this; }

  /** Sets the theme. */
  withTheme(t: Theme): Group {
    this._theme = t;
    const styles = t.theme(this.hasDarkBg);
    this.help.styles = styles.help;
    this.selector.range((_i, field) => {
      field.withTheme(t);
      return true;
    });
    if (this._height <= 0) {
      this.withHeight(this.rawHeight());
    }
    return this;
  }

  /** Sets the keymap. */
  withKeyMap(k: KeyMap): Group {
    this._keymap = k;
    this.selector.range((_i, field) => {
      field.withKeyMap(k);
      return true;
    });
    return this;
  }

  /** Sets the width of the group and all its fields. */
  withWidth(width: number): Group {
    this._width = width;
    this.viewport.setWidth(width);
    this.help.setWidth(width);
    this.selector.range((_i, field) => {
      field.withWidth(width);
      return true;
    });
    return this;
  }

  /** Sets the height of the group. */
  withHeight(height: number): Group {
    this._height = height;
    const h = height - this.titleFooterHeight();
    this.viewport.setHeight(h);
    this.selector.range((_i, field) => {
      if (h < lipglossHeight(field.view())) {
        field.withHeight(h);
      }
      return true;
    });
    return this;
  }

  /** Sets whether this group should be hidden (static). */
  withHide(hide: boolean): Group {
    this.withHideFunc(() => hide);
    return this;
  }

  /** Sets a dynamic hide function. */
  withHideFunc(fn: () => boolean): Group {
    this._hide = fn;
    return this;
  }

  /** Returns the hide function (used by Form). */
  get hide(): (() => boolean) | null {
    return this._hide;
  }

  /** Returns errors from all fields. */
  errors(): Error[] {
    const errs: Error[] = [];
    this.selector.range((_i, field) => {
      const err = field.error();
      if (err) errs.push(err);
      return true;
    });
    return errs;
  }

  // -- Tea Model interface --

  /** Initializes the group. */
  init(): Cmd {
    const cmds: Cmd[] = [];

    cmds.push(() => updateFieldMsg);

    const selected = this.selector.selected();
    if (selected.skip()) {
      if (this.selector.onLast()) {
        cmds.push(...this.prevField());
      } else if (this.selector.onFirst()) {
        cmds.push(...this.nextField());
      }
      return Batch(...cmds);
    }

    if (this.active) {
      const cmd = selected.focus();
      if (cmd) cmds.push(cmd);
    }
    this.buildView();
    return Batch(...cmds);
  }

  /** Updates the group, handling field navigation and messages. */
  update(msg: Msg): [Group, Cmd] {
    const cmds: Cmd[] = [];

    // Update all fields in the group.
    this.selector.range((i, field) => {
      // For key/paste messages, only send to the focused field
      const tag = (msg as any)?._tag;
      if (tag !== "KeyPressMsg" && tag !== "PasteMsg") {
        const [m, cmd] = field.update(msg);
        this.selector.set(i, m as Field);
        if (cmd) cmds.push(cmd);
      }

      // Always send to the focused field
      if (this.selector.index() === i) {
        const [m, cmd] = field.update(msg);
        this.selector.set(i, m as Field);
        if (cmd) cmds.push(cmd);
      }

      // Always send updateFieldMsg to all fields
      const [m2, cmd2] = field.update(updateFieldMsg);
      this.selector.set(i, m2 as Field);
      if (cmd2) cmds.push(cmd2);

      return true;
    });

    // Handle navigation messages
    if ((msg as any)?._tag === "BackgroundColorMsg") {
      this.hasDarkBg = (msg as any).isDark();
    }
    if (isNextFieldMsg(msg)) {
      cmds.push(...this.nextField());
    }
    if (isPrevFieldMsg(msg)) {
      cmds.push(...this.prevField());
    }

    this.buildView();
    return [this, Batch(...cmds)];
  }

  // -- Navigation --

  private nextField(): Cmd[] {
    const blurCmd = this.selector.selected().blur();
    if (this.selector.onLast()) {
      return blurCmd ? [blurCmd, nextGroup] : [nextGroup];
    }
    this.selector.next();
    while (this.selector.selected().skip()) {
      if (this.selector.onLast()) {
        return blurCmd ? [blurCmd, nextGroup] : [nextGroup];
      }
      this.selector.next();
    }
    const focusCmd = this.selector.selected().focus();
    const result: Cmd[] = [];
    if (blurCmd) result.push(blurCmd);
    if (focusCmd) result.push(focusCmd);
    return result;
  }

  private prevField(): Cmd[] {
    const blurCmd = this.selector.selected().blur();
    if (this.selector.onFirst()) {
      return blurCmd ? [blurCmd, prevGroup] : [prevGroup];
    }
    this.selector.prev();
    while (this.selector.selected().skip()) {
      if (this.selector.onFirst()) {
        return blurCmd ? [blurCmd, prevGroup] : [prevGroup];
      }
      this.selector.prev();
    }
    const focusCmd = this.selector.selected().focus();
    const result: Cmd[] = [];
    if (blurCmd) result.push(blurCmd);
    if (focusCmd) result.push(focusCmd);
    return result;
  }

  // -- Rendering --

  private getTheme(): Styles {
    if (this._theme) {
      return this._theme.theme(this.hasDarkBg);
    }
    return ThemeCharm(this.hasDarkBg);
  }

  private styles(): GroupStyles {
    return this.getTheme().group;
  }

  private getContent(): [offset: number, content: string] {
    let fields = "";
    let offset = 0;

    const gap = this.getTheme().fieldSeparator.render();

    // If the focused field is requesting zoom, only show that field.
    const selected = this.selector.selected();
    if (selected.zoom()) {
      selected.withHeight(this._height);
      return [0, selected.view()];
    }

    this.selector.range((i, field) => {
      fields += field.view();
      if (i === this.selector.index()) {
        offset = lipglossHeight(fields) - lipglossHeight(field.view());
      }
      if (i < this.selector.total() - 1) {
        fields += gap;
      }
      return true;
    });

    return [offset, fields];
  }

  private buildView(): void {
    const [offset, content] = this.getContent();
    this.viewport.setContent(content);
    this.viewport.setYOffset(offset);
  }

  /** Renders the group header (title + description). */
  header(): string {
    const s = this.styles();
    const parts: string[] = [];
    if (this._title) {
      parts.push(s.title.render(wrap(this._title, this._width)));
    }
    if (this._description) {
      parts.push(s.description.render(wrap(this._description, this._width)));
    }
    return parts.join("\n");
  }

  private titleFooterHeight(): number {
    let h = 0;
    const hdr = this.header();
    if (hdr) h += lipglossHeight(hdr);
    const ftr = this.footer();
    if (ftr) h += lipglossHeight(ftr);
    return h;
  }

  private rawHeight(): number {
    return lipglossHeight(this.content()) + this.titleFooterHeight();
  }

  /** Renders the full group view (header + viewport + footer). */
  view(): string {
    const parts: string[] = [];
    const hdr = this.header();
    if (hdr) parts.push(hdr);
    parts.push(this.viewport.view());
    const ftr = this.footer();
    if (ftr) {
      parts.push("", ftr);
    }

    if (parts.length > 0) {
      // Trim suffix spaces from last part to avoid terminal scroll issues
      const lastIdx = parts.length - 1;
      parts[lastIdx] = parts[lastIdx].trimEnd();
    }
    return parts.join("\n");
  }

  /** Renders the group's content only (no header/footer). */
  content(): string {
    const [, c] = this.getContent();
    return c;
  }

  /** Renders the group footer (help or errors). */
  footer(): string {
    const parts: string[] = [];
    const errors = this.errors();

    if (this.showHelp && errors.length === 0) {
      const helpView = this.help.shortHelpView(this.selector.selected().keyBinds());
      parts.push(helpView);
    }

    if (this.showErrors) {
      const theme = this.getTheme();
      for (const err of errors) {
        parts.push(wrap(
          theme.focused.errorMessage.render(err.message),
          this._width,
        ));
      }
    }

    return this.styles().base.render(parts.join("\n"));
  }
}

/** Creates a new Group with the given fields. */
export function NewGroup(...fields: Field[]): Group {
  return new Group(fields);
}
