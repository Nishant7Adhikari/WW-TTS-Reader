/**
 * Tokenizer for VTTS Reader
 * Handles text splitting and classification for speech synthesis.
 */

export const TOKEN_TYPES = {
  WORD: "WORD",
  PUNCT: "PUNCT",
  SYMBOL: "SYMBOL",
};

export const CASING = {
  LOWER: "LOWER",
  CAPITALIZED: "CAPITALIZED",
  ALL_CAPS: "ALL_CAPS",
  NONE: "NONE",
};

const PUNCTUATION_MAP = {
  ".": "full stop",
  ",": "comma",
  "!": "exclamation mark",
  "?": "question mark",
  ";": "semi colon",
  ":": "colon",
  "-": "dash",
  _: "underscore",
  "(": "open bracket",
  ")": "close bracket",
  "[": "open square bracket",
  "]": "close square bracket",
  "{": "open curly bracket",
  "}": "close curly bracket",
  '"': "quote",
  "'": "apostrophe",
  "/": "slash",
  "\\": "backslash",
  "@": "at rate",
  "#": "hash",
  $: "dollar",
  "%": "percent",
  "^": "caret",
  "&": "and",
  "*": "asterisk",
  "+": "plus",
  "=": "equals",
  "<": "less than",
  ">": "greater than",
  "|": "pipe",
  "~": "tilde",
};

export class Tokenizer {
  /**
   * Splits text into tokens and processes each one.
   * @param {string} text
   * @returns {Array} List of processed tokens
   */
  static tokenize(text) {
    if (!text) return [];

    // Regex to split into words and individual symbols/punctuation
    // [A-Za-z0-9']+ matches words (including apostrophes)
    // [^\w\s] matches any non-word, non-whitespace character (punctuation/symbols)
    const regex = /([A-Za-z0-9']+|[^\w\s])/g;
    const matches = text.match(regex) || [];

    return matches.map((raw) => this.processToken(raw));
  }

  /**
   * Identifies type, casing, and generates spoken versions of a token.
   * @param {string} raw
   */
  static processToken(raw) {
    let type = TOKEN_TYPES.SYMBOL;
    let casing = CASING.NONE;
    let spokenNormal = raw;
    let spokenSpell = raw.split("").join(", ");
    let spokenNoCaps = raw;

    // Determine if it's a word or punctuation
    if (/^[A-Za-z0-9']+$/.test(raw)) {
      type = TOKEN_TYPES.WORD;

      // Determine casing (only for letters)
      if (/[A-Z]/.test(raw)) {
        if (raw === raw.toUpperCase() && raw !== raw.toLowerCase()) {
          casing = CASING.ALL_CAPS;
        } else if (raw[0] === raw[0].toUpperCase()) {
          casing = CASING.CAPITALIZED;
        }
      } else {
        casing = CASING.LOWER;
      }

      spokenNoCaps = raw.toLowerCase();
    } else {
      type = PUNCTUATION_MAP[raw] ? TOKEN_TYPES.PUNCT : TOKEN_TYPES.SYMBOL;
      spokenNormal = PUNCTUATION_MAP[raw] || raw;
      spokenNoCaps = spokenNormal;
    }

    return {
      raw,
      type,
      casing,
      spokenNormal,
      spokenSpell,
      spokenNoCaps,
    };
  }
}
