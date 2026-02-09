/**
 * Speech Controller for WW TTS Reader
 * Interfaces with Web Speech API to speak tokens.
 */

import { CASING, TOKEN_TYPES } from "./tokenizer.js";

export class SpeechController {
  constructor() {
    this.synth = window.speechSynthesis;
    this.rate = 1.15;
    this.capsNarration = false;
    this.punctuationNarration = false;
    this.voice = null;

    this._initVoices();
  }

  _initVoices() {
    const load = () => {
      const voices = this.synth.getVoices();
      // Prefer a natural sounding English voice if available
      this.voice =
        voices.find(
          (v) => v.name.includes("Google") && v.lang.startsWith("en"),
        ) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
    };

    load();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = load;
    }
  }

  /**
   * Speaks a token based on the current mode.
   * @param {Object} token - Token object from Tokenizer
   * @param {string} mode - 'NORMAL', 'SPELL', 'NOCAPS'
   * @param {Function} onEnd - Callback when speech finished
   */
  speak(token, mode = "NORMAL", onEnd = null) {
    this.synth.cancel(); // Stop any current speech

    let textToSpeak = "";

    if (mode === "SPELL") {
      textToSpeak = token.spokenSpell;
    } else {
      // Check for caps narration
      if (this.capsNarration && token.type === TOKEN_TYPES.WORD) {
        if (token.casing === CASING.ALL_CAPS) {
          textToSpeak = `All caps, ${token.raw}`;
        } else if (token.casing === CASING.CAPITALIZED) {
          textToSpeak = `Caps ${token.raw[0]}, ${token.raw.substring(1)}`;
        } else {
          textToSpeak = token.spokenNormal;
        }
      } else if (
        token.type === TOKEN_TYPES.PUNCT ||
        token.type === TOKEN_TYPES.SYMBOL
      ) {
        // Punctuation narration logic
        textToSpeak = this.punctuationNarration
          ? token.spokenNormal
          : token.raw;
      } else {
        textToSpeak = token.spokenNormal;
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = this.rate;
    if (this.voice) utterance.voice = this.voice;

    if (onEnd) {
      utterance.onend = onEnd;
      // Handle potential utterance issues
      utterance.onerror = onEnd;
    }

    this.synth.speak(utterance);
  }

  setRate(newRate) {
    this.rate = Math.max(0.1, Math.min(3, parseFloat(newRate.toFixed(2))));
    return this.rate;
  }

  toggleCapsNarration() {
    this.capsNarration = !this.capsNarration;
    return this.capsNarration;
  }

  cancel() {
    this.synth.cancel();
  }
}