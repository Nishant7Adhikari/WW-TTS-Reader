import { Tokenizer, TOKEN_TYPES, CASING } from "../../frontend/js/tokenizer.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log("🚀 Starting Tokenizer Tests...");

  // Test 1: Simple sentence
  const tokens1 = Tokenizer.tokenize("Hello world!");
  assert(tokens1.length === 3, "Should have 3 tokens for 'Hello world!'");
  assert(tokens1[0].raw === "Hello", "First token should be Hello");
  assert(tokens1[0].type === TOKEN_TYPES.WORD, "Hello should be WORD");
  assert(
    tokens1[0].casing === CASING.CAPITALIZED,
    "Hello should be CAPITALIZED",
  );
  assert(tokens1[2].raw === "!", "Last token should be !");
  assert(tokens1[2].type === TOKEN_TYPES.PUNCT, "! should be PUNCT");
  console.log("✅ Test 1 Passed: Simple sentence");

  // Test 2: Casing
  const tokens2 = Tokenizer.tokenize("IIT is COOL.");
  assert(tokens2[0].casing === CASING.ALL_CAPS, "IIT should be ALL_CAPS");
  assert(tokens2[1].casing === CASING.LOWER, "is should be LOWER");
  assert(tokens2[2].casing === CASING.ALL_CAPS, "COOL should be ALL_CAPS");
  console.log("✅ Test 2 Passed: Casing classification");

  // Test 3: Apostrophes and Numbers
  const tokens3 = Tokenizer.tokenize("Don't wait 4 me.");
  assert(tokens3[0].raw === "Don't", "Apostrophes should be kept in words");
  assert(tokens3[2].raw === "4", "Numbers should be treated as words/tokens");
  console.log("✅ Test 3 Passed: Apostrophes and Numbers");

  // Test 4: Symbols and Spoken variants
  const tokens4 = Tokenizer.tokenize("Price: $50");
  const colon = tokens4[1];
  const dollar = tokens4[3];
  assert(
    colon.spokenNormal === "colon",
    "Colon should be mapped to spoken variant",
  );
  assert(
    dollar.spokenNormal === "dollar",
    "Dollar should be mapped to spoken variant",
  );
  console.log("✅ Test 4 Passed: Symbols and Spoken variants");

  console.log("🎉 All Tokenizer tests passed!");
}

// Check if running in browser or node
if (typeof process !== "undefined") {
  runTests();
}
