/**
 * Select field — port of charmbracelet/huh field_select.go
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
import type { SelectKeyMap, KeyMap } from "./keymap.js";
import { NewDefaultKeyMap, cloneKeyMapSection } from "./keymap.js";
import { type Theme, type FieldStyles, ThemeCharm } from "./theme.js";
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

export class Select<T> implements Field {
  private _accessor: Accessor<T>;
  private _key: string;
  private _id: number;
  private _title: Eval<string>;
  private _description: Eval<string>;
  private _options: Eval<Option<T>[]>;
  private _filteredOptions: Option<T>[];
  private _inline: boolean;
  private _filtering: boolean;
  private _filter: TextInputModel;
  private _filterFunc: (option: string, filter: string) => boolean;
  private _spinner: SpinnerModel;
  private _showSpinner: boolean;
  private _focused: boolean;
  private _validate: ((val: T) => Error | null) | null;
  private _err: Error | null;
  private _selected: number;
  private _viewport: ViewportModel;
  private _width: number;
  private _height: number;
  private _theme: Theme;
  private _hasDarkBg: boolean;
  private _keymap: SelectKeyMap;

  constructor(defaultVal: T) {
    this._accessor = new EmbeddedAccessor<T>(defaultVal);
    this._key = "";
    this._id = nextID();
    this._title = new Eval("");
    this._description = new Eval("");
    this._options = new Eval<Option<T>[]>([]);
    this._filteredOptions = [];
    this._inline = false;
    this._filtering = false;
    this._filter = newTextInput();
    this._filter.prompt = "/";
    this._filterFunc = (option, filter) => option.toLowerCase().includes(filter.toLowerCase());
    this._spinner = newSpinner();
    this._showSpinner = false;
    this._focused = false;
    this._validate = null;
    this._err = null;
    this._selected = 0;
    this._viewport = newViewport();
    this._width = 0;
    this._height = 0;
    this._theme = { theme: (isDark) => ThemeCharm(isDark) };
    this._hasDarkBg = true;
    this._keymap = NewDefaultKeyMap().select;
  }

  // -- Builder methods --

  value(getter: () => T, setter: (v: T) => void): Select<T> {
    this._accessor = new PointerAccessor(getter, setter);
    this.selectValue(this._accessor.get());
    this.updateValue();
    return this;
  }

  accessor(a: Accessor<T>): Select<T> {
    this._accessor = a;
    this.selectValue(this._accessor.get());
    this.updateValue();
    return this;
  }

  key(k: string): Select<T> { this._key = k; return this; }

  title(t: string): Select<T> { this._title.val = t; this._title.fn = null; return this; }
  titleFunc(fn: () => string, bindings: any): Select<T> {
    this._title.fn = fn; this._title.bindings = bindings; return this;
  }

  description(d: string): Select<T> { this._description.val = d; this._description.fn = null; return this; }
  descriptionFunc(fn: () => string, bindings: any): Select<T> {
    this._description.fn = fn; this._description.bindings = bindings; return this;
  }

  options(opts: Option<T>[]): Select<T> {
    if (opts.length <= 0) return this;
    this._options.val = opts; this._options.fn = null;
    this._filteredOptions = [...opts];
    this.selectOption();
    this.updateViewportSize();
    this.updateValue();
    return this;
  }

  optionsFunc(fn: () => Option<T>[], bindings: any): Select<T> {
    this._options.fn = fn; this._options.bindings = bindings;
    if (this._height <= 0) {
      this._height = defaultHeight;
      this.updateViewportSize();
    }
    return this;
  }

  height(h: number): Select<T> {
    this._height = h;
    this.updateViewportSize();
    return this;
  }

  inline(b: boolean): Select<T> {
    this._inline = b;
    if (b) this.height(1);
    this._keymap.left.setEnabled(b);
    this._keymap.right.setEnabled(b);
    this._keymap.up.setEnabled(!b);
    this._keymap.down.setEnabled(!b);
    return this;
  }

  filterFunc(fn: (option: string, filter: string) => boolean): Select<T> {
    this._filterFunc = fn; return this;
  }

  validate(fn: (val: T) => Error | null): Select<T> { this._validate = fn; return this; }

  // -- Field interface --

  error(): Error | null { return this._err; }
  skip(): boolean { return false; }
  zoom(): boolean { return false; }
  getKey(): string { return this._key; }
  getValue(): any { return this._accessor.get(); }

  keyBinds(): Binding[] {
    return [
      this._keymap.up, this._keymap.down, this._keymap.left, this._keymap.right,
      this._keymap.filter, this._keymap.setFilter, this._keymap.clearFilter,
      this._keymap.prev, this._keymap.next, this._keymap.submit,
    ];
  }

  private activeStyles(): FieldStyles {
    const styles = this._theme.theme(this._hasDarkBg);
    return this._focused ? styles.focused : styles.blurred;
  }

  focus(): Cmd {
    this._focused = true;
    return null;
  }

  blur(): Cmd {
    const value = this._accessor.get();
    if (this._inline) {
      this.clearFilter();
      this.selectValue(value);
    }
    this._focused = false;
    if (this._validate) this._err = this._validate(value);
    return null;
  }

  // -- Tea model interface --

  init(): Cmd { return null; }

  update(msg: Msg): [Select<T>, Cmd] {
    this.updateViewportSize();

    let cmd: Cmd = null;
    if (this._filtering) {
      const [, fcmd] = this._filter.update(msg);
      cmd = fcmd;
    }

    const cmds: Cmd[] = [];
    if (cmd) cmds.push(cmd);

    // Eval-based dynamic updates
    if (isUpdateFieldMsg(msg)) {
      let [should, hash] = this._title.shouldUpdate();
      if (should) {
        this._title.bindingsHash = hash;
        if (!this._title.loadFromCache()) {
          this._title.loading = true;
          const id = this._id; const fn = this._title.fn!;
          cmds.push(() => ({ _tag: "updateTitleMsg", id, title: fn(), hash } as UpdateTitleMsg));
        }
      }
      [should, hash] = this._description.shouldUpdate();
      if (should) {
        this._description.bindingsHash = hash;
        if (!this._description.loadFromCache()) {
          this._description.loading = true;
          const id = this._id; const fn = this._description.fn!;
          cmds.push(() => ({ _tag: "updateDescriptionMsg", id, description: fn(), hash } as UpdateDescriptionMsg));
        }
      }
      [should, hash] = this._options.shouldUpdate();
      if (should) {
        this.clearFilter();
        this._options.bindingsHash = hash;
        if (this._options.loadFromCache()) {
          this._filteredOptions = [...this._options.val];
          this._selected = Math.max(0, Math.min(this._selected, this._options.val.length - 1));
        } else {
          this._options.loading = true; this._showSpinner = true;
          const id = this._id; const fn = this._options.fn!;
          cmds.push(() => ({ _tag: "updateOptionsMsg", id, options: fn(), hash } as unknown as UpdateOptionsMsg<Option<T>>));
          cmds.push(() => this._spinner.tickMsg());
        }
      }
      return [this, cmds.length > 0 ? Batch(...cmds) : null];
    }

    // Spinner update
    if (this._showSpinner && !this._options.loading === false) {
      // handled below
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
        this.selectOption();
        this._selected = Math.max(0, Math.min(this._selected, (m.options as any[]).length - 1));
        this._filteredOptions = [...this._options.val];
        this._showSpinner = false;
        this.updateValue();
      }
    }

    // Spinner tick
    if (this._showSpinner) {
      const [, scmd] = this._spinner.update(msg);
      if (scmd) cmds.push(scmd);
    }

    // Key handling
    if ((msg as any)?._tag === "KeyPressMsg") {
      const km = msg as KeyPressMsg;
      this._err = null;

      if (matches(km, this._keymap.filter)) {
        this.setFiltering(true);
        cmds.push(this._filter.focus());
        return [this, cmds.length > 0 ? Batch(...cmds) : null];
      }
      if (matches(km, this._keymap.setFilter)) {
        if (this._filteredOptions.length <= 0) {
          this._filter.setValue("");
          this._filteredOptions = [...this._options.val];
        }
        this.setFiltering(false);
      } else if (matches(km, this._keymap.clearFilter)) {
        this.clearFilter();
      } else if (matches(km, this._keymap.up, this._keymap.left)) {
        // When filtering we should ignore k/h keybindings
        if (this._filtering && (km.toString() === "k" || km.toString() === "h")) {
          // fall through to filtering refilter below
        } else {
          this._selected = this._selected - 1;
          if (this._selected < 0) {
            this._selected = this._filteredOptions.length - 1;
            this._viewport.gotoBottom();
          } else {
            this.ensureCursorVisible();
          }
          this.updateValue();
        }
      } else if (matches(km, this._keymap.gotoTop)) {
        if (!this._filtering) {
          this._selected = 0;
          this._viewport.gotoTop();
          this.updateValue();
        }
      } else if (matches(km, this._keymap.gotoBottom)) {
        if (!this._filtering) {
          this._selected = this._filteredOptions.length - 1;
          this._viewport.gotoBottom();
        }
      } else if (matches(km, this._keymap.halfPageUp)) {
        this._selected = Math.max(this._selected - Math.floor(this._viewport.height() / 2), 0);
        this.ensureCursorVisible();
        this.updateValue();
      } else if (matches(km, this._keymap.halfPageDown)) {
        this._selected = Math.min(this._selected + Math.floor(this._viewport.height() / 2), this._filteredOptions.length - 1);
        this.ensureCursorVisible();
        this.updateValue();
      } else if (matches(km, this._keymap.down, this._keymap.right)) {
        // When filtering we should ignore j/l keybindings
        if (this._filtering && (km.toString() === "j" || km.toString() === "l")) {
          // fall through to filtering refilter below
        } else {
          this._selected = this._selected + 1;
          if (this._selected > this._filteredOptions.length - 1) {
            this._selected = 0;
            this._viewport.gotoTop();
          } else {
            this.ensureCursorVisible();
          }
          this.updateValue();
        }
      } else if (matches(km, this._keymap.prev)) {
        if (this._selected < this._filteredOptions.length) {
          this.updateValue();
          if (this._validate) {
            this._err = this._validate(this._accessor.get());
            if (this._err) return [this, null];
          }
          this.updateValue();
          return [this, () => PrevField()];
        }
      } else if (matches(km, this._keymap.next, this._keymap.submit)) {
        if (this._selected < this._filteredOptions.length) {
          this.setFiltering(false);
          this.updateValue();
          if (this._validate) {
            this._err = this._validate(this._accessor.get());
            if (this._err) return [this, null];
          }
          this.updateValue();
          return [this, () => NextField()];
        }
      }

      // Refilter if in filter mode
      if (this._filtering) {
        this._filteredOptions = [...this._options.val];
        if (this._filter.value() !== "") {
          this._filteredOptions = this._options.val.filter(o => this._filterFunc(o.key, this._filter.value()));
        }
        if (this._filteredOptions.length > 0) {
          this._selected = Math.min(this._selected, this._filteredOptions.length - 1);
        }
      }

      this.ensureCursorVisible();
    }

    return [this, cmds.length > 0 ? Batch(...cmds) : null];
  }

  // -- View --

  view(): string {
    const styles = this.activeStyles();
    if (this._inline) return this.inlineView(styles);

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
    this._keymap = cloneKeyMapSection(k.select);
    this._keymap.left.setEnabled(this._inline);
    this._keymap.right.setEnabled(this._inline);
    this._keymap.up.setEnabled(!this._inline);
    this._keymap.down.setEnabled(!this._inline);
    return this;
  }
  withWidth(width: number): Field { this._width = width; this.updateViewportSize(); return this; }
  withHeight(height: number): Field { return this.height(height); }
  withPosition(p: FieldPosition): Field {
    if (this._filtering) return this;
    this._keymap.prev.setEnabled(!isFirst(p));
    this._keymap.next.setEnabled(!isLast(p));
    this._keymap.submit.setEnabled(isLast(p));
    return this;
  }

  // -- Run stubs --

  async run(): Promise<void> { throw new Error("not implemented"); }
  async runAccessible(_w: any, _r: any): Promise<void> { throw new Error("not implemented"); }

  // -- Internal helpers --

  /** Finds and selects an option by value. */
  private selectValue(value: T): void {
    for (let i = 0; i < this._options.val.length; i++) {
      if (this._options.val[i].value === value) {
        this._selected = i;
        break;
      }
    }
  }

  /** Sets the cursor to the existing value or the last selected option. */
  private selectOption(): void {
    for (let i = 0; i < this._options.val.length; i++) {
      if (this._options.val[i].value === this._accessor.get()) {
        this._selected = i;
        break;
      }
      if (this._options.val[i].selected) {
        this._selected = i;
        break;
      }
    }
    this.ensureCursorVisible();
  }

  /** Sets the accessor value to the currently selected option. */
  private updateValue(): void {
    if (this._selected < this._filteredOptions.length && this._selected >= 0) {
      this._accessor.set(this._filteredOptions[this._selected].value);
    }
  }

  /** Updates the viewport dimensions based on the height setting. */
  private updateViewportSize(): void {
    if (this._height > 0) {
      let yoffset = 0;
      const tv = this.titleView();
      if (tv) yoffset += lipglossHeight(tv);
      const dv = this.descriptionView();
      if (dv) yoffset += lipglossHeight(dv);
      this._viewport.setHeight(Math.max(minHeight, this._height - yoffset));
      this.ensureCursorVisible();
    } else {
      // If no height is set size the viewport to the number of options.
      const v = this.optionsView();
      this._viewport.setHeight(lipglossHeight(v));
    }
    if (this._width > 0) {
      const styles = this.activeStyles();
      this._viewport.setWidth(this._width - styles.base.getHorizontalFrameSize());
    } else {
      const v = this.optionsView();
      this._viewport.setWidth(lipglossWidth(v));
    }
  }

  /** Renders the title section. */
  private titleView(): string {
    const styles = this.activeStyles();
    const maxWidth = this._width - styles.base.getHorizontalFrameSize();
    const parts: string[] = [];
    if (this._filtering) {
      parts.push(this._filter.view());
    } else if (this._filter.value() !== "" && !this._inline) {
      parts.push(styles.description.render("/" + this._filter.value()));
    } else {
      parts.push(styles.title.render(wrap(this._title.val, maxWidth)));
    }
    if (this._err) {
      parts.push(styles.errorIndicator.render());
    }
    return parts.join("");
  }

  /** Renders the description section. */
  private descriptionView(): string {
    if (!this._description.val) return "";
    const maxWidth = this._width - this.activeStyles().base.getHorizontalFrameSize();
    return this.activeStyles().description.render(wrap(this._description.val, maxWidth));
  }

  /** Renders a single option line (selected or not). */
  private renderOption(option: Option<T>, selected: boolean): string {
    const styles = this.activeStyles();
    const cursor = styles.selectSelector.render();
    const cursorW = stringWidth(cursor);
    const maxWidth = this._width - this.activeStyles().base.getHorizontalFrameSize() - cursorW;
    const key = wrap(option.key, maxWidth);

    if (selected) {
      return joinHorizontal(Left, cursor, styles.selectedOption.render(key));
    }
    return joinHorizontal(Left, " ".repeat(cursorW), styles.unselectedOption.render(key));
  }

  /** Computes the line offset and height (in lines) for the currently selected option. */
  private cursorLineOffset(): [number, number] {
    let offset = 0;
    let height = 0;
    for (let i = 0; i < this._filteredOptions.length; i++) {
      const line = this.renderOption(this._filteredOptions[i], this._selected === i);
      const h = lipglossHeight(line);
      if (i < this._selected) {
        offset += h;
      }
      if (i === this._selected) {
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
    const styles = this.activeStyles();

    if (this._showSpinner) {
      return this._spinner.view() + " Loading...";
    }

    const lines: string[] = [];
    for (let i = 0; i < this._filteredOptions.length; i++) {
      const line = this.renderOption(this._filteredOptions[i], this._selected === i);
      lines.push(line);
    }

    // Pad with empty lines up to the total option count (for consistent height)
    for (let i = this._filteredOptions.length; i < this._options.val.length - 1; i++) {
      lines.push("");
    }

    return lines.join("\n");
  }

  /** Sets filtering state and toggles relevant keybindings. */
  private setFiltering(filtering: boolean): void {
    if (this._inline && filtering) {
      this._filter.setWidth(stringWidth(this.titleView()) - 2);
    }
    this._filtering = filtering;
    this._keymap.setFilter.setEnabled(filtering);
    this._keymap.filter.setEnabled(!filtering);
    this._keymap.clearFilter.setEnabled(!filtering && this._filter.value() !== "");
  }

  /** Clears the filter value and resets filtered options. */
  private clearFilter(): void {
    this._filter.setValue("");
    this._filteredOptions = [...this._options.val];
    this.setFiltering(false);
  }

  private inlineView(styles: FieldStyles): string {
    const parts: string[] = [];
    if (this._title.val) {
      let t = styles.title.render(this._title.val);
      if (this._err) t += styles.errorIndicator.render();
      parts.push(t);
    }
    if (this._description.val) parts.push(styles.description.render(this._description.val));

    const hasPrev = this._selected > 0;
    const hasNext = this._selected < this._filteredOptions.length - 1;
    const prev = hasPrev ? styles.prevIndicator.render() : " ".repeat(stringWidth(styles.prevIndicator.render()));
    const next = hasNext ? styles.nextIndicator.render() : " ".repeat(stringWidth(styles.nextIndicator.render()));
    const current = this._filteredOptions.length > 0 ? this._filteredOptions[this._selected].key : "";
    parts.push(joinHorizontal(Left, prev, styles.selectedOption.render(current), next));

    return styles.base.width(this._width).render(parts.join("\n"));
  }

  /** Returns the currently hovered option value and whether one exists. */
  hovered(): [T, boolean] {
    if (this._filteredOptions.length === 0 || this._selected >= this._filteredOptions.length) {
      return [undefined as unknown as T, false];
    }
    return [this._filteredOptions[this._selected].value, true];
  }

  /** Returns the viewport model (for testing). */
  getViewport(): ViewportModel { return this._viewport; }
}

/** Creates a new Select field with defaults. */
export function NewSelect<T>(defaultVal?: T): Select<T> {
  return new Select<T>(defaultVal as T);
}
