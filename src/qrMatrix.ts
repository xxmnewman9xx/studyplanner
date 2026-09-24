// Pure QR encoder wrapper: returns the module matrix so the share card can
// draw it with react-native-svg. ECC level M, automatic version.

import qrcode from "qrcode-generator";

function utf8BinaryString(text: string) {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) || 0;
    if (code < 0x80) out += String.fromCharCode(code);
    else if (code < 0x800) out += String.fromCharCode(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000) out += String.fromCharCode(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    else out += String.fromCharCode(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
  }
  return out;
}

/**
 * Square matrix of dark (true) / light (false) modules, row-major, without a
 * quiet zone. Returns [] when the text is empty or too long to encode.
 */
export function qrMatrix(text: string): boolean[][] {
  if (typeof text !== "string" || !text) return [];
  try {
    const qr = qrcode(0, "M");
    // Byte mode over UTF-8 bytes (the library's default byte mapper keeps the low 8 bits).
    qr.addData(utf8BinaryString(text), "Byte");
    qr.make();
    const size = qr.getModuleCount();
    const rows: boolean[][] = [];
    for (let row = 0; row < size; row += 1) {
      const line: boolean[] = [];
      for (let col = 0; col < size; col += 1) line.push(qr.isDark(row, col));
      rows.push(line);
    }
    return rows;
  } catch {
    return [];
  }
}
