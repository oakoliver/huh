/**
 * Option — options for select fields.
 * Port of charmbracelet/huh option.go
 */

/** Option is an option for select fields. */
export class Option<T> {
  key: string;
  value: T;
  selected: boolean;

  constructor(key: string, value: T) {
    this.key = key;
    this.value = value;
    this.selected = false;
  }

  /** Sets whether the option is currently selected. Returns a new Option. */
  setSelected(selected: boolean): Option<T> {
    const o = new Option<T>(this.key, this.value);
    o.selected = selected;
    return o;
  }

  /** Returns the key of the option. */
  toString(): string {
    return this.key;
  }
}

/** Creates a new select option. */
export function NewOption<T>(key: string, value: T): Option<T> {
  return new Option<T>(key, value);
}

/** Creates new options from a list of values. */
export function NewOptions<T>(...values: T[]): Option<T>[] {
  return values.map((v) => new Option<T>(String(v), v));
}
