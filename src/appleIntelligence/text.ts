// Pure text helpers for the on-device intelligence layer: normalization,
// token overlap, grounding checks, line lookup, and a stable hash.
// No react-native imports: tsx tests load this file directly.

const DIGIT_BLOCKS: Array<[number, number]> = [
  [0x0660, 0x0669], // Arabic-Indic
  [0x06f0, 0x06f9], // Extended Arabic-Indic (Persian/Urdu)
  [0x0966, 0x096f], // Devanagari
  [0x09e6, 0x09ef], // Bengali
  [0x0a66, 0x0a6f], // Gurmukhi
  [0x0ae6, 0x0aef], // Gujarati
  [0x0be6, 0x0bef], // Tamil
  [0x0e50, 0x0e59], // Thai
  [0xff10, 0xff19], // Full-width (NFKC also folds these)
];

/** Maps every supported non-ASCII decimal digit to its ASCII digit. */
export function asciiDigits(value: string) {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) || 0;
    let mapped: string | null = null;
    for (const [start, end] of DIGIT_BLOCKS) {
      if (code >= start && code <= end) {
        mapped = String(code - start);
        break;
      }
    }
    out += mapped ?? char;
  }
  return out;
}

/**
 * NFKC, ASCII digits, lowercase, punctuation stripped to spaces, whitespace
 * collapsed. Letters from every script (including CJK) are kept.
 */
export function normalizeText(value: string) {
  if (typeof value !== "string" || !value) return "";
  return asciiDigits(value.normalize("NFKC"))
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CJK_CHAR = /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/u;

/** Word tokens; CJK runs are split into single characters so overlap works without spaces. */
export function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  const tokens: string[] = [];
  for (const word of normalized.split(" ")) {
    if (!word) continue;
    if (CJK_CHAR.test(word)) {
      let buffer = "";
      for (const char of word) {
        if (CJK_CHAR.test(char)) {
          if (buffer) tokens.push(buffer);
          buffer = "";
          tokens.push(char);
        } else {
          buffer += char;
        }
      }
      if (buffer) tokens.push(buffer);
    } else {
      tokens.push(word);
    }
  }
  return tokens;
}

/** Share of `span` tokens (as a set) that also appear in `source`. 0 when span has no tokens. */
export function tokenOverlap(span: string, source: string) {
  const spanTokens = new Set(tokenize(span));
  if (!spanTokens.size) return 0;
  const sourceTokens = new Set(tokenize(source));
  let hit = 0;
  spanTokens.forEach((token) => {
    if (sourceTokens.has(token)) hit += 1;
  });
  return hit / spanTokens.size;
}

/** Symmetric fuzzy title similarity: shared tokens over the shorter title's token count. */
export function titleSimilarity(a: string, b: string) {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (!left.size || !right.size) return 0;
  let hit = 0;
  left.forEach((token) => {
    if (right.has(token)) hit += 1;
  });
  return hit / Math.min(left.size, right.size);
}

function splitLines(sourceText: string) {
  return String(sourceText || "").split(/\r\n|\r|\n|\f/);
}

type LineIndex = { normalized: string[]; tokens: string[][]; tokenSets: Set<string>[] };

function indexLines(sourceText: string): LineIndex {
  const lines = splitLines(sourceText);
  const tokens = lines.map((line) => tokenize(line));
  return {
    normalized: lines.map((line) => normalizeText(line)),
    tokens,
    tokenSets: tokens.map((list) => new Set(list)),
  };
}

const WINDOW_LINES = 3;
const FUZZY_THRESHOLD = 0.9;

/**
 * In-order match of span tokens inside a window (longest common subsequence).
 * Returns the matched share, or 0 when any digit-bearing span token is left
 * unmatched: numbers are never allowed to drift between lines or items.
 */
function orderedCoverage(spanTokens: string[], windowTokens: string[]) {
  const n = spanTokens.length;
  const m = windowTokens.length;
  if (!n || !m) return 0;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      dp[i][j] = spanTokens[i - 1] === windowTokens[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const matched = new Array<boolean>(n).fill(false);
  for (let i = n, j = m; i > 0 && j > 0; ) {
    if (spanTokens[i - 1] === windowTokens[j - 1]) {
      matched[i - 1] = true;
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i -= 1;
    else j -= 1;
  }
  if (spanTokens.some((token, index) => /\d/.test(token) && !matched[index])) return 0;
  return dp[n][m] / n;
}

function bestWindow(span: string, index: LineIndex): { line: number; overlap: number } | null {
  const spanTokens = tokenize(span).slice(0, 80);
  if (!spanTokens.length) return null;
  const spanSet = new Set(spanTokens);
  let best: { line: number; overlap: number } | null = null;
  for (let start = 0; start < index.tokens.length; start += 1) {
    const windowSet = new Set<string>();
    let windowTokens: string[] = [];
    for (let size = 0; size < WINDOW_LINES && start + size < index.tokens.length; size += 1) {
      index.tokenSets[start + size].forEach((token) => windowSet.add(token));
      windowTokens = windowTokens.concat(index.tokens[start + size]);
      let hit = 0;
      spanSet.forEach((token) => {
        if (windowSet.has(token)) hit += 1;
      });
      // Cheap set prefilter before the ordered check.
      if (hit / spanSet.size < FUZZY_THRESHOLD) continue;
      const overlap = orderedCoverage(spanTokens, windowTokens.slice(0, 400));
      if (!best || overlap > best.overlap) best = { line: start + 1, overlap };
      if (overlap === 1) return best;
    }
  }
  return best;
}

/**
 * A model-quoted span is grounded when its normalized form is a substring of
 * the normalized source, or when ≥ 90% of its tokens appear IN ORDER inside a
 * window of up to three consecutive source lines with every number matched
 * (OCR noise tolerance without letting digits drift).
 */
export function isGrounded(span: unknown, source: string) {
  if (typeof span !== "string") return false;
  const normalizedSpan = normalizeText(span);
  if (normalizedSpan.length < 2) return false;
  const normalizedSource = normalizeText(source);
  if (!normalizedSource) return false;
  if (normalizedSource.includes(normalizedSpan)) return true;
  if (tokenize(span).length < 3) return false;
  const window = bestWindow(span, indexLines(source));
  return Boolean(window && window.overlap >= FUZZY_THRESHOLD);
}

/** 1-based line of `span` in `sourceText` (substring first, then best ≥ 0.9 token window). */
export function lineOf(span: string, sourceText: string): number | undefined {
  const normalizedSpan = normalizeText(span);
  if (!normalizedSpan) return undefined;
  const index = indexLines(sourceText);
  const exact = index.normalized.findIndex((line) => line.includes(normalizedSpan));
  if (exact >= 0) return exact + 1;
  // Spans that cross a line break: find the first line whose join with the next lines contains it.
  for (let start = 0; start < index.normalized.length; start += 1) {
    let joined = index.normalized[start];
    for (let size = 1; size < WINDOW_LINES && start + size < index.normalized.length; size += 1) {
      joined = `${joined} ${index.normalized[start + size]}`.trim();
      if (joined.includes(normalizedSpan)) return start + 1;
    }
  }
  const window = bestWindow(span, index);
  return window && window.overlap >= FUZZY_THRESHOLD ? window.line : undefined;
}

/** Original (un-normalized) text of a 1-based line, trimmed. */
export function lineText(sourceText: string, line: number | undefined) {
  if (!line) return "";
  return (splitLines(sourceText)[line - 1] || "").trim();
}

function utf8Bytes(value: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i += 1) {
    let code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < value.length) {
      const next = value.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        i += 1;
      }
    }
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
  }
  return bytes;
}

/**
 * FNV-1a 64-bit over UTF-8 bytes, computed with four 16-bit limbs (no BigInt),
 * returned as 16 lowercase hex chars. Stable across platforms and runs.
 */
export function stableHash(value: string) {
  // offset basis 0xcbf29ce484222325
  let h0 = 0x2325;
  let h1 = 0x8422;
  let h2 = 0x9ce4;
  let h3 = 0xcbf2;
  const bytes = utf8Bytes(String(value ?? ""));
  for (const byte of bytes) {
    h0 ^= byte;
    // multiply by prime 0x100000001b3 = 2^40 + 0x1b3
    let t0 = h0 * 0x1b3;
    let t1 = h1 * 0x1b3;
    let t2 = h2 * 0x1b3 + (h0 << 8);
    let t3 = h3 * 0x1b3 + (h1 << 8);
    t1 += t0 >>> 16;
    t0 &= 0xffff;
    t2 += t1 >>> 16;
    t1 &= 0xffff;
    t3 += t2 >>> 16;
    t2 &= 0xffff;
    t3 &= 0xffff;
    h0 = t0;
    h1 = t1;
    h2 = t2;
    h3 = t3;
  }
  const hex = (n: number) => n.toString(16).padStart(4, "0");
  return `${hex(h3)}${hex(h2)}${hex(h1)}${hex(h0)}`;
}

/** Trims, collapses whitespace, strips control chars, and clips to `max` chars. */
export function cleanString(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
