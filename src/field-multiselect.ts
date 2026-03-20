/**
 * MultiSelect field — port of charmbracelet/huh field_multiselect.go
 */

import { newTextInput, type TextInputModel, newSpinner, type SpinnerModel, newViewport, type ViewportModel, type Binding, matches } from "@oakoliver/bubbles";
import { type Cmd, type Msg, Batch, type KeyPressMsg } from "@oakoliver/bubbletea";
import { newStyle, stringWidth, joinHorizontal, Left } from "@oakoliver/lipgloss";
import { type Accessor, EmbeddedAccessor, PointerAccessor } from "./accessor.js";
import { Option } from "./option.js";
import {
  Eval, type UpdateTitleMsg, type UpdateDescriptionMsg, type UpdateOptionsMsg,
  isUpdateFieldMsg, isUpdateTitleMsg, isUpdateDescriptionMsg, isUpdateOptionsMsg, updateFieldMsg,
} from "./eval.js";
import type { MultiSelectKeyMap, KeyMap } from "./keymap.js";
import { NewDefaultKeyMap, cloneKeyMapSection } from "./keymap.js";
import { type Theme, type FieldStyles, ThemeFunc, ThemeCharm } from "./theme.js";
import { wrap } from "./wrap.js";
import { nextID, type FieldPosition, isFirst, isLast, NextField, PrevField } from "./field-input.js";
import type { Field } from "./field-input.js";

const minHeight = 1;
const defaultHeight = 10;

function lipglossHeight(s: string): number {
  if (!s) return 0;
  return s.split("\n").length;
}

function lipglossWidth(s: string): number {
  if (!s) return 0;
  let max = 0;
  for (const line of s.split("\n")) {
    const w = stringWidth(line);
    if (w > max) max = w;
  }
  return max;
}

/**
 * Scrolls a viewport the minimum amount so that the region
 * [offset, offset+height) is within the visible area.
 * Port of Go's ensureVisible standalone function.
 */
function ensureVisible(vp: ViewportModel, offset: number, height: number): void {
  if (height <= 0) return;
  const yOff = vp.yOffset();
  const vHeight = vp.height();
  if (offset < yOff) {
    vp.scrollUp(yOff - offset);
  } else if (offset + height > yOff + vHeight) {
    vp.scrollDown(offset + height - yOff - vHeight);
  }
}

export class MultiSelect<T> implements Field {
  private _accessor: Accessor<T[]>;
  private _key: string;
  private _id: number;
  private _title: Eval<string>;
  private _description: Eval<string>;
  private _options: Eval<Option<T>[]>;
  private _filteredOptions: Option<T>[];
  private _filtering: boolean;
  private _filter: TextInputModel;
  private _filterFunc: (option: string, filter: string) => boolean;
  private _limit: number;
  private _focused: boolean;
  private _validate: ((val: T[]) => Error | null) | null;
  private _err: Error | null;
  private _cursor: number;
  private _viewport: ViewportModel;
  private _spinner: SpinnerModel;
  private _showSpinner: boolean;
  private _width: number;
  private _height: number;
  private _theme: Theme;
  private _hasDarkBg: boolean;
  private _keymap: MultiSelectKeyMap;
  private _filterable: boolean;

  constructor() {
    this._accessor = new EmbeddedAccessor<T[]>([]);
    this._key = "";
    this._id = nextID();
    this._title = new Eval("");
    this._description = new Eval("");
    this._options = new Eval<Option<T>[]>([]);
    this._filteredOptions = [];
    this._filtering = false;
    this._filter = newTextInput();
    this._filterFunc = (option, filter) =>
      option.toLowerCase().includes(filter.toLowerCase());
    this._limit = 0;
    this._focused = false;
    this._validate = null;
    this._err = null;
    this._cursor = 0;
    this._viewport = newViewport();
    this._spinner = newSpinner();
    this._showSpinner = false;
    this._width = 0;
    this._height = 0;
    this._theme = { theme: (isDark) => ThemeCharm(isDark) };
    this._hasDarkBg = true;
    this._keymap = NewDefaultKeyMap().multiSelect;
    this._filterable = true;
    this._filter.prompt = "/";
  }

  // -- Builder methods --

  value(getter: () => T[], setter: (v: T[]) => void): MultiSelect<T> {
    this._accessor = new PointerAccessor(getter, setter);
    return this;
  }

  accessor(a: Accessor<T[]>): MultiSelect<T> { this._accessor = a; return this; }
  key(k: string): MultiSelect<T> { this._key = k; return this; }
  title(t: string): MultiSelect<T> { this._title.val = t; this._title.fn = null; return this; }

  titleFunc(fn: () => string, bindings: any): MultiSelect<T> {
    this._title.fn = fn; this._title.bindings = bindings; return this;
  }

  description(d: string): MultiSelect<T> { this._description.val = d; this._description.fn = null; return this; }

  descriptionFunc(fn: () => string, bindings: any): MultiSelect<T> {
    this._description.fn = fn; this._description.bindings = bindings; return this;
  }

  options(opts: Option<T>[]): MultiSelect<T> {
    if (opts.length <= 0) return this;
    this._options.val = opts; this._options.fn = null;
    this._filteredOptions = [...opts];
    this.selectOptions();
    this.updateViewportSize();
    return this;
  }

  optionsFunc(fn: () => Option<T>[], bindings: any): MultiSelect<T> {
    this._options.fn = fn; this._options.bindings = bindings;
    this._filteredOptions = [];
    if (this._height <= 0) {
      this._height = defaultHeight;
      this.updateViewportSize();
    }
    return this;
  }

  height(h: number): MultiSelect<T> {
    this._height = h;
    this.updateViewportSize();
    return this;
  }

  limit(n: number): MultiSelect<T> {
    this._limit = n;
    this.setSelectAllHelp();
    return this;
  }

  filterFunc(fn: (option: string, filter: string) => boolean): MultiSelect<T> {
    this._filterFunc = fn; return this;
  }

  filterable(b: boolean): MultiSelect<T> {
    this._filterable = b;
    return this;
  }

  validate(fn: (val: T[]) => Error | null): MultiSelect<T> { this._validate = fn; return this; }

  // -- Field interface --

  error(): Error | null { return this._err; }
  skip(): boolean { return false; }
  zoom(): boolean { return false; }
  getKey(): string { return this._key; }
  getValue(): any { return this._accessor.get(); }

  keyBinds(): Binding[] {
    this.setSelectAllHelp();
    const binds: Binding[] = [
      this._keymap.toggle, this._keymap.up, this._keymap.down,
    ];
    if (this._filterable) {
      binds.push(this._keymap.filter, this._keymap.setFilter, this._keymap.clearFilter);
    }
    binds.push(
      this._keymap.prev, this._keymap.submit, this._keymap.next,
      this._keymap.selectAll, this._keymap.selectNone,
    );
    return binds;
  }

  // -- Internal helpers --

  private activeStyles(): FieldStyles {
    const styles = this._theme.theme(this._hasDarkBg);
    return this._focused ? styles.focused : styles.blurred;
  }

  private numSelected(): number {
    return this._options.val.filter(o => o.selected).length;
  }

  private numFilteredSelected(): number {
    return this._filteredOptions.filter(o => o.selected).length;
  }

  private setSelectAllHelp(): void {
    if (this._limit > 0) {
      this._keymap.selectAll.setEnabled(false);
      this._keymap.selectNone.setEnabled(false);
      return;
    }

    const noneSelected = this.numFilteredSelected() <= 0;
    const someSelected = this.numFilteredSelected() > 0 && this.numFilteredSelected() < this._filteredOptions.length;
    const selectAll = noneSelected || someSelected;
    this._keymap.selectAll.setEnabled(selectAll);
    this._keymap.selectNone.setEnabled(!selectAll);
  }

  /** Sets the cursor to existing selected options. */
  private selectOptions(): void {
    // Mark options matching accessor value as selected
    const vals = this._accessor.get();
    for (let i = 0; i < this._options.val.length; i++) {
      for (const v of vals) {
        if (this._options.val[i].value === v) {
          this._options.val[i].selected = true;
        }
      }
    }
    // Set cursor to first selected option
    for (let i = 0; i < this._options.val.length; i++) {
      if (!this._options.val[i].selected) continue;
      this._cursor = i;
      this.ensureCursorVisible();
      break;
    }
  }

  private updateValue(): void {
    const value: T[] = [];
    for (const opt of this._options.val) {
      if (opt.selected) value.push(opt.value);
    }
    this._accessor.set(value);
    if (this._validate) this._err = this._validate(this._accessor.get());
  }

  /** Updates the viewport dimensions based on height/width settings. */
  private updateViewportSize(): void {
    let yoffset = 0;
    const tv = this.titleView();
    if (tv) yoffset += lipglossHeight(tv);
    const dv = this.descriptionView();
    if (dv) yoffset += lipglossHeight(dv);

    const vpc = this.optionsView();

    let height = this._height;
    if (height <= 0) {
      height = lipglossHeight(vpc);
    }
    let width = this._width;
    if (width <= 0) {
      width = lipglossWidth(vpc);
    }

    if (this._width > 0) {
      const styles = this.activeStyles();
      this._viewport.setWidth(width - styles.base.getHorizontalFrameSize());
    } else {
      this._viewport.setWidth(width);
    }
    this._viewport.setHeight(Math.max(minHeight, height) - yoffset);
  }

  /** Renders the title section. */
  private titleView(): string {
    if (!this._title.val) return "";
    const styles = this.activeStyles();
    const maxWidth = this._width - styles.base.getHorizontalFrameSize();
    const sb: string[] = [];
    if (this._filtering) {
      sb.push(this._filter.view());
    } else if (this._filter.value() !== "") {
      sb.push(styles.title.render(wrap(this._title.val, maxWidth)));
      sb.push(styles.description.render("/" + this._filter.value()));
    } else {
      sb.push(styles.title.render(wrap(this._title.val, maxWidth)));
    }
    if (this._err) {
      sb.push(styles.errorIndicator.render());
    }
    return sb.join("");
  }

  /** Renders the description section. */
  private descriptionView(): string {
    if (!this._description.val) return "";
    const maxWidth = this._width - this.activeStyles().base.getHorizontalFrameSize();
    return this.activeStyles().description.render(wrap(this._description.val, maxWidth));
  }

  /** Renders a single option line (matching Go's renderOption). */
  private renderOption(option: Option<T>, cursor: boolean, selected: boolean): string {
    const styles = this.activeStyles();
    const parts: string[] = [];
    if (cursor) {
      parts.push(styles.multiSelectSelector.render());
    } else {
      parts.push(" ".repeat(stringWidth(styles.multiSelectSelector.render())));
    }
    if (selected) {
      parts.push(styles.selectedPrefix.render());
      parts.push(styles.selectedOption.render(option.key));
    } else {
      parts.push(styles.unselectedPrefix.render());
      parts.push(styles.unselectedOption.render(option.key));
    }
    return joinHorizontal(Left, ...parts);
  }

  /** Computes line offset and height for the cursor position. */
  private cursorLineOffset(): [number, number] {
    let offset = 0;
    let height = 0;
    for (let i = 0; i < this._filteredOptions.length; i++) {
      const line = this.renderOption(this._filteredOptions[i], this._cursor === i, this._filteredOptions[i].selected);
      const h = lipglossHeight(line);
      if (i < this._cursor) {
        offset += h;
      }
      if (i === this._cursor) {
        height = h;
        return [offset, height];
      }
    }
    return [offset, height];
  }

  /** Scrolls the viewport to keep the cursor visible. */
  private ensureCursorVisible(): void {
    const [offset, height] = this.cursorLineOffset();
    ensureVisible(this._viewport, offset, height);
  }

  /** Renders all options as a single string (viewport content). */
  private optionsView(): string {
    if (this._showSpinner) {
      return this._spinner.view() + " Loading...";
    }

    const lines: string[] = [];
    for (let i = 0; i < this._filteredOptions.length; i++) {
      const cursor = this._cursor === i;
      const line = this.renderOption(this._filteredOptions[i], cursor, this._filteredOptions[i].selected);
      lines.push(line);
    }

    // Pad with empty lines up to the total option count (for consistent height)
    for (let i = this._filteredOptions.length; i < this._options.val.length - 1; i++) {
      lines.push("");
    }

    return lines.join("\n");
  }

  /** Sets filtering state and toggles relevant keybindings. */
  private setFilter(filtering: boolean): void {
    this._filtering = filtering;
    this._keymap.setFilter.setEnabled(filtering);
    this._keymap.filter.setEnabled(!filtering);
    this._keymap.next.setEnabled(!filtering);
    this._keymap.submit.setEnabled(!filtering);
    this._keymap.prev.setEnabled(!filtering);
    this._keymap.clearFilter.setEnabled(!filtering && this._filter.value() !== "");
  }

  // -- Focus / Blur --

  focus(): Cmd {
    this.updateValue();
    this._focused = true;
    return null;
  }

  blur(): Cmd {
    this.updateValue();
    this._focused = false;
    return null;
  }

  // -- Tea model interface --

  init(): Cmd { return null; }

  update(msg: Msg): [MultiSelect<T>, Cmd] {
    const cmds: Cmd[] = [];

    // Enforce height on the viewport during update
    this.updateViewportSize();

    let cmd: Cmd = null;
    if (this._filtering) {
      const [, fcmd] = this._filter.update(msg);
      cmd = fcmd;
      this.setSelectAllHelp();
      if (cmd) cmds.push(cmd);
    }

    // Handle eval updates
    if (isUpdateFieldMsg(msg)) {
      const fieldCmds: Cmd[] = [];
      let [should, hash] = this._title.shouldUpdate();
      if (should) {
        this._title.bindingsHash = hash;
        if (!this._title.loadFromCache()) {
          this._title.loading = true;
          const id = this._id;
          const fn = this._title.fn!;
          fieldCmds.push(() => ({ _tag: "updateTitleMsg", id, title: fn(), hash } as UpdateTitleMsg));
        }
      }
      [should, hash] = this._description.shouldUpdate();
      if (should) {
        this._description.bindingsHash = hash;
        if (!this._description.loadFromCache()) {
          this._description.loading = true;
          const id = this._id;
          const fn = this._description.fn!;
          fieldCmds.push(() => ({ _tag: "updateDescriptionMsg", id, description: fn(), hash } as UpdateDescriptionMsg));
        }
      }
      [should, hash] = this._options.shouldUpdate();
      if (should) {
        this._options.bindingsHash = hash;
        if (this._options.loadFromCache()) {
          this._filteredOptions = [...this._options.val];
          this.updateValue();
          this._cursor = Math.max(0, Math.min(this._cursor, this._filteredOptions.length - 1));
        } else {
          this._options.loading = true;
          this._showSpinner = true;
          const id = this._id;
          const fn = this._options.fn!;
          fieldCmds.push(() => ({ _tag: "updateOptionsMsg", id, options: fn(), hash } as unknown as UpdateOptionsMsg<Option<T>>));
          fieldCmds.push(() => this._spinner.tickMsg());
        }
      }
      return [this, fieldCmds.length > 0 ? Batch(...fieldCmds) : null];
    }

    // Spinner tick
    if (this._showSpinner && this._options.loading) {
      const [, scmd] = this._spinner.update(msg);
      if (scmd) return [this, scmd];
    }

    if (isUpdateTitleMsg(msg)) {
      const m = msg as UpdateTitleMsg;
      if (m.id === this._id && m.hash === this._title.bindingsHash) this._title.update(m.title);
    }
    if (isUpdateDescriptionMsg(msg)) {
      const m = msg as UpdateDescriptionMsg;
      if (m.id === this._id && m.hash === this._description.bindingsHash) this._description.update(m.description);
    }
    if (isUpdateOptionsMsg(msg)) {
      const m = msg as UpdateOptionsMsg<Option<T>>;
      if (m.id === this._id && m.hash === this._options.bindingsHash) {
        this._options.update(m.options as any);
        this.selectOptions();
        this._filteredOptions = [...this._options.val];
        this.updateValue();
        this._cursor = Math.max(0, Math.min(this._cursor, this._filteredOptions.length - 1));
        this._showSpinner = false;
      }
    }

    // Handle key presses
    if ((msg as any)?._tag === "KeyPressMsg") {
      const km = msg as KeyPressMsg;
      this._err = null;

      if (matches(km, this._keymap.filter)) {
        this.setFilter(true);
        return [this, this._filter.focus()];
      }
      if (matches(km, this._keymap.setFilter)) {
        if (this._filteredOptions.length <= 0) {
          this._filter.setValue("");
          this._filteredOptions = [...this._options.val];
        }
        this.setFilter(false);
      } else if (matches(km, this._keymap.clearFilter)) {
        this._filter.setValue("");
        this._filteredOptions = [...this._options.val];
        this.setFilter(false);
      } else if (matches(km, this._keymap.up)) {
        // When filtering we should ignore k keybinding
        if (this._filtering && km.toString() === "k") {
          // fall through to filtering refilter below
        } else {
          this._cursor = Math.max(this._cursor - 1, 0);
          this.ensureCursorVisible();
        }
      } else if (matches(km, this._keymap.down)) {
        // When filtering we should ignore j keybinding
        if (this._filtering && km.toString() === "j") {
          // fall through to filtering refilter below
        } else {
          this._cursor = Math.min(this._cursor + 1, this._filteredOptions.length - 1);
          this.ensureCursorVisible();
        }
      } else if (matches(km, this._keymap.gotoTop)) {
        if (!this._filtering) {
          this._cursor = 0;
          this._viewport.gotoTop();
        }
      } else if (matches(km, this._keymap.gotoBottom)) {
        if (!this._filtering) {
          this._cursor = Math.max(0, this._filteredOptions.length - 1);
          this._viewport.gotoBottom();
        }
      } else if (matches(km, this._keymap.halfPageUp)) {
        this._cursor = Math.max(this._cursor - Math.floor(this._viewport.height() / 2), 0);
        this.ensureCursorVisible();
      } else if (matches(km, this._keymap.halfPageDown)) {
        this._cursor = Math.min(this._cursor + Math.floor(this._viewport.height() / 2), this._filteredOptions.length - 1);
        this.ensureCursorVisible();
      } else if (matches(km, this._keymap.toggle) && !this._filtering) {
        if (this._filteredOptions.length > 0) {
          // Match Go: find option in options.val by Key and toggle
          for (let i = 0; i < this._options.val.length; i++) {
            if (this._options.val[i].key === this._filteredOptions[this._cursor].key) {
              if (!this._options.val[this._cursor].selected && this._limit > 0 && this.numSelected() >= this._limit) {
                break;
              }
              const selected = this._options.val[i].selected;
              this._options.val[i].selected = !selected;
              this._filteredOptions[this._cursor].selected = !selected;
            }
          }
          this.setSelectAllHelp();
          this.updateValue();
        }
      } else if ((matches(km, this._keymap.selectAll) || matches(km, this._keymap.selectNone)) && this._limit <= 0) {
        let selected = false;
        for (const opt of this._filteredOptions) {
          if (!opt.selected) { selected = true; break; }
        }
        for (let i = 0; i < this._options.val.length; i++) {
          for (let j = 0; j < this._filteredOptions.length; j++) {
            if (this._options.val[i].key === this._filteredOptions[j].key) {
              this._options.val[i].selected = selected;
              this._filteredOptions[j].selected = selected;
              break;
            }
          }
        }
        this.setSelectAllHelp();
        this.updateValue();
      } else if (matches(km, this._keymap.prev)) {
        this.updateValue();
        if (this._validate) {
          this._err = this._validate(this._accessor.get());
          if (this._err) return [this, null];
        }
        return [this, () => PrevField()];
      } else if (matches(km, this._keymap.next) || matches(km, this._keymap.submit)) {
        this.updateValue();
        if (this._validate) {
          this._err = this._validate(this._accessor.get());
          if (this._err) return [this, null];
        }
        return [this, () => NextField()];
      }

      // Refilter if in filter mode
      if (this._filtering) {
        this._filteredOptions = [...this._options.val];
        if (this._filter.value() !== "") {
          this._filteredOptions = this._options.val.filter(o => this._filterFunc(o.key, this._filter.value()));
        }
        if (this._filteredOptions.length > 0) {
          this._cursor = Math.min(this._cursor, this._filteredOptions.length - 1);
        }
      }
      this.ensureCursorVisible();
    }

    return [this, cmds.length > 0 ? Batch(...cmds) : null];
  }

  view(): string {
    const styles = this.activeStyles();

    const vpc = this.optionsView();
    this._viewport.setContent(vpc);

    const parts: string[] = [];
    if (this._title.val || this._title.fn) {
      parts.push(this.titleView());
    }
    if (this._description.val || this._description.fn) {
      parts.push(this.descriptionView());
    }
    parts.push(this._viewport.view());

    return styles.base.width(this._width).height(this._height).render(parts.join("\n"));
  }

  // -- With* interface methods --

  withTheme(theme: Theme): Field { this._theme = theme; this.updateViewportSize(); return this; }

  withKeyMap(k: KeyMap): Field {
    this._keymap = cloneKeyMapSection(k.multiSelect);
    if (!this._filterable) {
      this._keymap.filter.setEnabled(false);
      this._keymap.clearFilter.setEnabled(false);
      this._keymap.setFilter.setEnabled(false);
    }
    return this;
  }

  withWidth(width: number): Field {
    this._width = width;
    this.updateViewportSize();
    return this;
  }

  withHeight(height: number): Field {
    return this.height(height);
  }

  withPosition(p: FieldPosition): Field {
    if (this._filtering) return this;
    this._keymap.prev.setEnabled(!isFirst(p));
    this._keymap.next.setEnabled(!isLast(p));
    this._keymap.submit.setEnabled(isLast(p));
    return this;
  }

  /** Returns the currently hovered option value and whether one exists. */
  hovered(): [T, boolean] {
    if (this._filteredOptions.length === 0 || this._cursor >= this._filteredOptions.length) {
      return [undefined as unknown as T, false];
    }
    return [this._filteredOptions[this._cursor].value, true];
  }

  /** Returns the viewport model (for testing). */
  getViewport(): ViewportModel { return this._viewport; }

  // -- Run methods (stubs) --

  async run(): Promise<void> { return Promise.reject(new Error("not implemented")); }
  async runAccessible(_w: any, _r: any): Promise<void> { return Promise.reject(new Error("not implemented")); }
}

/** Creates a new MultiSelect field with defaults. */
export function NewMultiSelect<T>(): MultiSelect<T> {
  return new MultiSelect<T>();
}
