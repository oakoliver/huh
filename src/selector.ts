/**
 * Selector — generic item selector for navigating lists.
 * Port of charmbracelet/huh/internal/selector/selector.go
 */

export class Selector<T> {
  private items: T[];
  private _index: number;

  constructor(items: T[]) {
    this.items = [...items];
    this._index = 0;
  }

  /** Append an item to the selector. */
  append(item: T): void {
    this.items.push(item);
  }

  /** Move to the next item. */
  next(): void {
    if (this._index < this.items.length - 1) {
      this._index++;
    }
  }

  /** Move to the previous item. */
  prev(): void {
    if (this._index > 0) {
      this._index--;
    }
  }

  /** Returns true if on the first item. */
  onFirst(): boolean {
    return this._index === 0;
  }

  /** Returns true if on the last item. */
  onLast(): boolean {
    return this._index === this.items.length - 1;
  }

  /** Returns the currently selected item. */
  selected(): T {
    return this.items[this._index];
  }

  /** Returns the current index. */
  index(): number {
    return this._index;
  }

  /** Returns the total number of items. */
  total(): number {
    return this.items.length;
  }

  /** Sets the selected index (clamped to valid range). */
  setIndex(i: number): void {
    if (i < 0 || i >= this.items.length) {
      return;
    }
    this._index = i;
  }

  /** Returns the item at the given index. */
  get(i: number): T {
    return this.items[i];
  }

  /** Sets the item at the given index. */
  set(i: number, item: T): void {
    this.items[i] = item;
  }

  /** Iterates over items. Return false from callback to stop. */
  range(f: (i: number, item: T) => boolean): void {
    for (let i = 0; i < this.items.length; i++) {
      if (!f(i, this.items[i])) {
        break;
      }
    }
  }

  /** Iterates over items in reverse. Return false from callback to stop. */
  reverseRange(f: (i: number, item: T) => boolean): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (!f(i, this.items[i])) {
        break;
      }
    }
  }
}
