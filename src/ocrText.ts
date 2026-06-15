export function normalizeExtractedOcrText(text: string) {
  const dateRowStart = /^\s*(?:\p{Nd}{4}[/-]\p{Nd}{1,2}|\p{Nd}{1,2}\s*(?:[/-]\s*\p{Nd}{1,2}|[月월]|\.\s*(?:[\p{L}\p{M}]{3,}|\p{Nd}{1,2})|\s+(?:(?:de|del|do|le|el|la|um|am)\s+)?[\p{L}\p{M}]{3,})|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\p{Nd}{1,2})/iu;
  return text
    .replace(/\r/g, "\n")
    .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, " ")
    .replace(/[|]{2,}/g, "|")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/([A-Za-z])-\n([A-Za-z])/g, "$1$2")
    .replace(/([\p{L}\p{N}])\n(?=([^\n]+))/gu, (match, previous: string, nextLine: string) => {
      if (!/^\s*[\p{Ll}\p{Nd}]/u.test(nextLine) || dateRowStart.test(nextLine)) return match;
      return `${previous} `;
    })
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function countOcrWords(text: string) {
  const tokens = text.match(/[\p{L}\p{N}]+/gu) || [];
  return tokens.length;
}
