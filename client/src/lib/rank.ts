/**
 * Fractional indexing rank utility (ported from utils/story/rank.ts).
 * Produces lexicographically sortable strings using a fixed alphabet.
 */

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function indexOfChar(ch: string): number {
  const idx = ALPHABET.indexOf(ch);
  if (idx === -1) throw new Error(`Invalid rank character: ${ch}`);
  return idx;
}

function charAtIndex(idx: number): string {
  if (idx < 0 || idx >= ALPHABET.length)
    throw new Error(`Rank index out of range: ${idx}`);
  return ALPHABET[idx];
}

export function isValidRank(rank: string): boolean {
  if (!rank) return false;
  for (const ch of rank) {
    if (ALPHABET.indexOf(ch) === -1) return false;
  }
  return true;
}

export function rankBetween(a: string | null, b: string | null): string {
  if (a != null && !isValidRank(a)) throw new Error("Invalid lower rank");
  if (b != null && !isValidRank(b)) throw new Error("Invalid upper rank");
  if (a != null && b != null && a >= b)
    throw new Error("Lower rank must be < upper rank");

  let prefix = "";
  let i = 0;
  while (true) {
    const aIndex = a != null && i < a.length ? indexOfChar(a[i]) : 0;
    const bIndex =
      b == null
        ? ALPHABET.length - 1
        : i < b.length
          ? indexOfChar(b[i])
          : ALPHABET.length - 1;

    if (bIndex - aIndex > 1) {
      const mid = Math.floor((aIndex + bIndex) / 2);
      return prefix + charAtIndex(mid);
    }

    prefix += charAtIndex(aIndex);
    i++;
  }
}

export function rankInitial(): string {
  return rankBetween(null, null);
}
