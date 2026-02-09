import { Tokenizer, TOKEN_TYPES } from "./tokenizer.js";
import { SpeechController } from "./speechController.js";
import { KeyboardHandler } from "./keyboard.js";

class App {
  constructor() {
    this.tokens = [];
    this.currentIndex = -1;
    this.isSessionRunning = false;

    // Components
    this.speech = new SpeechController();
    this.keyboard = new KeyboardHandler({
      next: () => this.navigate(1),
      prev: () => this.navigate(-1),
      repeat: () => this.speakCurrent("NORMAL"),
      spell: () => this.speakCurrent("SPELL"),
      toggleCaps: () => this.toggleCaps(),
      togglePunct: () => this.togglePunctuation(),
      toggleVisual: () => this.toggleVisualMode(),
      increaseRate: () => this.updateRate(0.1),
      decreaseRate: () => this.updateRate(-0.1),
      startSession: () => this.startSession(),
      autoRead: () => this.toggleAutoRead(),
      isSessionActive: () => this.isSessionRunning,
    });

    this.isVisualMode = false;

    // DOM Elements
    this.elements = {
      inputScreen: document.getElementById("input-screen"),
      sessionScreen: document.getElementById("session-screen"),
      textInput: document.getElementById("text-input"),
      startBtn: document.getElementById("start-btn"),
      backBtn: document.getElementById("back-btn"),
      prevToken: document.getElementById("prev-token"),
      currentToken: document.getElementById("current-token"),
      nextToken: document.getElementById("next-token"),
      contextView: document.getElementById("context-view"),
      progress: document.getElementById("progress-indicator"),
      speedVal: document.querySelector("#speed-indicator .value"),
      capsVal: document.querySelector("#caps-indicator .value"),
      punctVal: document.querySelector("#punct-indicator .value"),
      capsToggle: document.getElementById("caps-toggle"),
      punctToggle: document.getElementById("punct-toggle"),
      visualToggle: document.getElementById("visual-toggle"),
      toast: document.getElementById("toast"),
    };

    this._initEvents();
  }

  _initEvents() {
    this.elements.startBtn.addEventListener("click", () => this.startSession());
    this.elements.backBtn.addEventListener("click", () => this.stopSession());

    // Toggle Inputs
    this.elements.capsToggle.addEventListener("change", (e) => {
      if (this.speech.capsNarration !== e.target.checked) this.toggleCaps(true);
    });
    this.elements.punctToggle.addEventListener("change", (e) => {
      if (this.speech.punctuationNarration !== e.target.checked)
        this.togglePunctuation(true);
    });
    this.elements.visualToggle.addEventListener("change", (e) => {
      if (this.isVisualMode !== e.target.checked) this.toggleVisualMode(true);
    });
  }

  startSession() {
    const text = this.elements.textInput.value.trim();
    if (!text) {
      this.showToast("Please enter some text first.");
      return;
    }

    // Capture current toggle states before starting
    const capsOn = this.elements.capsToggle.checked;
    const punctOn = this.elements.punctToggle.checked;
    const visualOn = this.elements.visualToggle.checked;

    this.tokens = Tokenizer.tokenize(text);
    if (this.tokens.length === 0) return;

    // Apply states to controllers without resetting
    this.speech.capsNarration = capsOn;
    this.speech.punctuationNarration = punctOn;
    this.isVisualMode = visualOn;

    // Sync UI indicators
    this.elements.capsVal.textContent = capsOn ? "ON" : "OFF";
    this.elements.punctVal.textContent = punctOn ? "ON" : "OFF";
    this.elements.capsVal.parentElement
      .querySelector(".dot")
      .classList.toggle("highlight", capsOn);
    this.elements.punctVal.parentElement
      .querySelector(".dot")
      .classList.toggle("highlight", punctOn);

    this.currentIndex = 0;
    this.isSessionRunning = true;

    // UI Transition
    this.elements.inputScreen.classList.remove("active");
    this.elements.sessionScreen.classList.add("active");

    this.renderContext();
    this.updateUI();
    this.speakCurrent();
    this.showToast("Session started! F to toggle Visual Mode.");
  }

  stopSession() {
    this.isSessionRunning = false;
    this.speech.cancel();
    this.elements.sessionScreen.classList.remove("active");
    this.elements.inputScreen.classList.add("active");
  }

  navigate(delta) {
    const nextIdx = this.currentIndex + delta;
    if (nextIdx >= 0 && nextIdx < this.tokens.length) {
      this.currentIndex = nextIdx;
      this.updateUI();
      this.speakCurrent();
    } else if (nextIdx >= this.tokens.length) {
      this.showToast("End of text reached.");
    }
  }

  speakCurrent(mode = "NORMAL") {
    const token = this.tokens[this.currentIndex];
    if (token) {
      this.speech.speak(token, mode, () => {
        if (this.isAutoReading) {
          setTimeout(() => {
            if (this.currentIndex < this.tokens.length - 1) {
              this.navigate(1);
            } else {
              this.toggleAutoRead();
            }
          }, 200); // Tiny pause between words for natural flow
        }
      });
    }
  }

  toggleAutoRead() {
    this.isAutoReading = !this.isAutoReading;
    if (this.isAutoReading) {
      this.showToast("Auto-Read: ON");
      this.speakCurrent();
    } else {
      this.showToast("Auto-Read: OFF");
      this.speech.cancel();
    }
  }

  toggleCaps(fromToggle = false) {
    const isEnabled = this.speech.toggleCapsNarration();
    this.elements.capsVal.textContent = isEnabled ? "ON" : "OFF";
    this.elements.capsVal.parentElement
      .querySelector(".dot")
      .classList.toggle("highlight", isEnabled);

    if (this.elements.capsToggle.checked !== isEnabled) {
      this.elements.capsToggle.checked = isEnabled;
    }

    if (!fromToggle)
      this.showToast(`Caps Narration: ${isEnabled ? "ON" : "OFF"}`);
  }

  togglePunctuation(fromToggle = false) {
    this.speech.punctuationNarration = !this.speech.punctuationNarration;
    const isEnabled = this.speech.punctuationNarration;

    this.elements.punctVal.textContent = isEnabled ? "ON" : "OFF";
    this.elements.punctVal.parentElement
      .querySelector(".dot")
      .classList.toggle("highlight", isEnabled);

    if (this.elements.punctToggle.checked !== isEnabled) {
      this.elements.punctToggle.checked = isEnabled;
    }

    if (!fromToggle)
      this.showToast(`Punctuation Narration: ${isEnabled ? "ON" : "OFF"}`);
  }

  toggleVisualMode(fromToggle = false) {
    this.isVisualMode = !this.isVisualMode;
    if (this.elements.visualToggle.checked !== this.isVisualMode) {
      this.elements.visualToggle.checked = this.isVisualMode;
    }
    this.renderContext(); // Full re-render for mode switch
    this.updateUI();
    this.showToast(`Visual Mode: ${this.isVisualMode ? "ON" : "OFF"}`);
  }

  updateRate(delta) {
    const newRate = this.speech.setRate(this.speech.rate + delta);
    this.elements.speedVal.textContent = `${newRate.toFixed(2)}x`;
    this.showToast(`Speed: ${newRate.toFixed(2)}x`);
  }

  updateUI() {
    const current = this.tokens[this.currentIndex];
    const prev = this.tokens[this.currentIndex - 1];
    const next = this.tokens[this.currentIndex + 1];

    this.elements.currentToken.textContent = current ? current.raw : "";
    this.elements.prevToken.textContent = prev ? prev.raw : "";
    this.elements.nextToken.textContent = next ? next.raw : "";

    // Highlight if phonetic
    this.elements.currentToken.classList.toggle(
      "is-phonetic",
      current && current.isPhonetic,
    );

    // Update progress
    this.elements.progress.textContent = `${this.currentIndex + 1} / ${this.tokens.length} tokens`;

    if (this.isVisualMode) {
      this.renderContext(); // Refresh line window
    } else {
      // Update context highlighting
      const contextTokens =
        this.elements.contextView.querySelectorAll(".context-token");
      contextTokens.forEach((el, idx) => {
        if (idx === this.currentIndex) {
          el.classList.add("highlight");
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          el.classList.remove("highlight");
        }
      });
    }
  }

  renderContext() {
    this.elements.contextView.innerHTML = "";

    if (this.isVisualMode) {
      this._renderVisualContext();
    } else {
      this.tokens.forEach((token, idx) => {
        if (token.type === TOKEN_TYPES.NEWLINE) return;
        const span = document.createElement("span");
        span.className = "context-token";
        if (token.isPhonetic) span.classList.add("is-phonetic");
        span.textContent = token.raw;
        span.dataset.index = idx;
        span.onclick = () => {
          this.currentIndex = idx;
          this.updateUI();
          this.speakCurrent();
        };
        this.elements.contextView.appendChild(span);
      });
    }
  }

  _renderVisualContext() {
    // Group tokens into lines
    const lines = [];
    let currentLine = [];
    let activeLineIndex = -1;

    this.tokens.forEach((token, idx) => {
      if (idx === this.currentIndex) activeLineIndex = lines.length;
      if (token.type === TOKEN_TYPES.NEWLINE) {
        lines.push(currentLine);
        currentLine = [];
      } else {
        currentLine.push({ ...token, idx });
      }
    });
    if (currentLine.length > 0) lines.push(currentLine);

    lines.forEach((lineTokens, lineIdx) => {
      // Only render current and next line
      if (lineIdx !== activeLineIndex && lineIdx !== activeLineIndex + 1)
        return;

      const lineDiv = document.createElement("div");
      lineDiv.className = "line-wrapper";

      if (lineIdx === activeLineIndex) {
        lineDiv.classList.add("current-line");
      } else {
        lineDiv.classList.add("next-line-hint");
      }

      lineTokens.forEach((t) => {
        const span = document.createElement("span");
        span.className = "context-token";
        if (t.idx === this.currentIndex) span.classList.add("highlight");
        if (t.isPhonetic) span.classList.add("is-phonetic");
        span.textContent = t.raw + " ";
        span.onclick = () => {
          this.currentIndex = t.idx;
          this.updateUI();
          this.speakCurrent();
        };
        lineDiv.appendChild(span);
      });

      this.elements.contextView.appendChild(lineDiv);
    });
  }

  showToast(message) {
    this.elements.toast.textContent = message;
    this.elements.toast.classList.remove("hidden");
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.elements.toast.classList.add("hidden");
    }, 2000);
  }
}

// Instantiate app
window.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
