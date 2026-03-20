/**
 * Layout — form layout strategies.
 * Port of charmbracelet/huh layout.go
 *
 * Provides 4 layout implementations:
 *   - LayoutDefault: shows one group at a time
 *   - LayoutStack: stacks all groups vertically
 *   - LayoutColumns(n): distributes groups in n even columns
 *   - LayoutGrid(rows, cols): distributes groups in a grid
 */

import { joinHorizontal, Left } from "@oakoliver/lipgloss";

// Forward-declared types to break circular imports.
// Form and Group are imported dynamically at usage site.
// We use interfaces here to avoid circular dependency issues.

/** Layout interface — responsible for laying out groups in a form. */
export interface Layout {
  view(f: LayoutForm): string;
  groupWidth(f: LayoutForm, g: LayoutGroup, w: number): number;
}

/**
 * Minimal Form shape needed by Layout (avoids circular import).
 * The real Form class satisfies this interface.
 */
export interface LayoutForm {
  readonly selector: {
    index(): number;
    total(): number;
    selected(): LayoutGroup;
    get(i: number): LayoutGroup;
    range(fn: (i: number, item: LayoutGroup) => boolean): void;
  };
  readonly styles: () => { base: { render(s: string): string } };
}

/**
 * Minimal Group shape needed by Layout (avoids circular import).
 */
export interface LayoutGroup {
  view(): string;
  content(): string;
  header(): string;
  footer(): string;
}

// ---------------------------------------------------------------------------
// LayoutDefault — shows one group at a time
// ---------------------------------------------------------------------------

class LayoutDefaultImpl implements Layout {
  view(f: LayoutForm): string {
    return f.selector.selected().view();
  }
  groupWidth(_f: LayoutForm, _g: LayoutGroup, w: number): number {
    return w;
  }
}

/** Default layout — displays one group at a time. */
export const layoutDefault: Layout = new LayoutDefaultImpl();

// ---------------------------------------------------------------------------
// LayoutStack — stacks all groups vertically
// ---------------------------------------------------------------------------

class LayoutStackImpl implements Layout {
  view(f: LayoutForm): string {
    const parts: string[] = [];
    f.selector.range((_i, group) => {
      parts.push(group.content(), "");
      return true;
    });

    const footer = f.selector.selected().footer();
    if (footer) {
      parts.push(footer);
    }
    return parts.join("\n");
  }
  groupWidth(_f: LayoutForm, _g: LayoutGroup, w: number): number {
    return w;
  }
}

/** Stack layout — stacks all groups vertically. */
export const layoutStack: Layout = new LayoutStackImpl();

// ---------------------------------------------------------------------------
// LayoutColumns — distributes groups in even columns
// ---------------------------------------------------------------------------

class LayoutColumnsImpl implements Layout {
  private columns: number;

  constructor(columns: number) {
    this.columns = columns;
  }

  private visibleGroups(f: LayoutForm): LayoutGroup[] {
    const segmentIndex = Math.floor(f.selector.index() / this.columns);
    const start = segmentIndex * this.columns;
    let end = start + this.columns;

    const total = f.selector.total();
    if (end > total) end = total;

    const groups: LayoutGroup[] = [];
    f.selector.range((i, group) => {
      if (i >= start && i < end) {
        groups.push(group);
      }
      return true;
    });

    return groups;
  }

  view(f: LayoutForm): string {
    const groups = this.visibleGroups(f);
    if (groups.length === 0) return "";

    const columns = groups.map((g) => g.content());
    const header = f.selector.selected().header();
    const footer = f.selector.selected().footer();

    return [header, joinHorizontal(Left, ...columns), footer].join("\n");
  }

  groupWidth(_f: LayoutForm, _g: LayoutGroup, w: number): number {
    return Math.floor(w / this.columns);
  }
}

/** Columns layout — distributes groups in n even columns. */
export function layoutColumns(columns: number): Layout {
  return new LayoutColumnsImpl(columns);
}

// ---------------------------------------------------------------------------
// LayoutGrid — distributes groups in a grid
// ---------------------------------------------------------------------------

class LayoutGridImpl implements Layout {
  private rows: number;
  private columns: number;

  constructor(rows: number, columns: number) {
    this.rows = rows;
    this.columns = columns;
  }

  private visibleGroups(f: LayoutForm): LayoutGroup[][] {
    const total = this.rows * this.columns;
    const segmentIndex = Math.floor(f.selector.index() / total);
    const start = segmentIndex * total;
    let end = start + total;

    const glen = f.selector.total();
    if (end > glen) end = glen;

    const visible: LayoutGroup[] = [];
    f.selector.range((i, group) => {
      if (i >= start && i < end) {
        visible.push(group);
      }
      return true;
    });

    const grid: LayoutGroup[][] = [];
    for (let i = 0; i < this.rows; i++) {
      const startRow = i * this.columns;
      const endRow = Math.min(startRow + this.columns, visible.length);
      if (startRow >= visible.length) break;
      grid.push(visible.slice(startRow, endRow));
    }

    return grid;
  }

  view(f: LayoutForm): string {
    const grid = this.visibleGroups(f);
    if (grid.length === 0) return "";

    const rows: string[] = [];
    for (const row of grid) {
      const columns = row.map((g) => g.content());
      rows.push(joinHorizontal(Left, ...columns), "");
    }

    const footer = f.selector.selected().footer();
    rows.push(footer);

    return rows.join("\n");
  }

  groupWidth(_f: LayoutForm, _g: LayoutGroup, w: number): number {
    return Math.floor(w / this.columns);
  }
}

/** Grid layout — distributes groups in a rows x columns grid. */
export function layoutGrid(rows: number, columns: number): Layout {
  return new LayoutGridImpl(rows, columns);
}
