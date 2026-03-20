/**
 * Wrap — text wrapping utility.
 * Port of charmbracelet/huh wrap.go
 */

/**
 * wrap wraps text at the given width limit, breaking on common punctuation
 * and whitespace characters.
 *
 * This is a simplified word-wrap implementation. The Go version delegates
 * to lipgloss.Wrap with break characters ",.-; ". We implement a basic
 * word-wrap here that breaks on spaces and the specified characters.
 */
export function wrap(s: string, limit: number): string {
  if (limit <= 0 || s.length <= limit) return s;

  const breakChars = new Set([",", ".", "-", ";", " "]);
  const lines: string[] = [];
  const inputLines = s.split("\n");

  for (const line of inputLines) {
    if (line.length <= limit) {
      lines.push(line);
      continue;
    }

    let remaining = line;
    while (remaining.length > limit) {
      // Find the last break character within the limit
      let breakAt = -1;
      for (let i = limit; i >= 0; i--) {
        if (breakChars.has(remaining[i])) {
          breakAt = i;
          break;
        }
      }

      if (breakAt === -1) {
        // No break point found, force break at limit
        breakAt = limit;
      }

      // If we break on a space, don't include it at end of line
      if (remaining[breakAt] === " ") {
        lines.push(remaining.slice(0, breakAt));
        remaining = remaining.slice(breakAt + 1);
      } else {
        // Break after the punctuation character
        lines.push(remaining.slice(0, breakAt + 1));
        remaining = remaining.slice(breakAt + 1);
      }
    }

    if (remaining.length > 0) {
      lines.push(remaining);
    }
  }

  return lines.join("\n");
}
