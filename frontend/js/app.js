import { Tokenizer } from "./tokenizer.js";
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
      increaseRate: () => this.updateRate(0.1),
      decreaseRate: () => this.updateRate(-0.1),
      startSession: () => this.startSession(),
      isSessionActive: () => this.isSessionRunning,
    });

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
  }

  startSession() {
    const text = this.elements.textInput.value.trim();
    if (!text) {
      this.showToast("Please enter some text first.");
      return;
    }

    this.tokens = Tokenizer.tokenize(text);
    if (this.tokens.length === 0) return;

    this.currentIndex = 0;
    this.isSessionRunning = true;

    // UI Transition
    this.elements.inputScreen.classList.remove("active");
    this.elements.sessionScreen.classList.add("active");

    this.renderContext();
    this.updateUI();
    this.speakCurrent();
    this.showToast("Session started! Use Arrow Keys to navigate.");
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
      this.speech.speak(token, mode);
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

    // Update progress
    this.elements.progress.textContent = `${this.currentIndex + 1} / ${this.tokens.length} tokens`;

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

  renderContext() {
    this.elements.contextView.innerHTML = "";
    this.tokens.forEach((token, idx) => {
      const span = document.createElement("span");
      span.className = "context-token";
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
