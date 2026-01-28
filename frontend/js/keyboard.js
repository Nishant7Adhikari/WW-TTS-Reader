/**
 * Keyboard Handler for WW TTS Reader
 * Maps physical keys to application actions.
 */

export class KeyboardHandler {
  constructor(actions) {
    this.actions = actions; // Object with methods: next, prev, repeat, spell, toggleCaps, togglePunct, increaseRate, decreaseRate
    this._init();
  }

  _init() {
    window.addEventListener("keydown", (e) => {
      // Handle Toggle Shortcuts anywhere (if session is not typing in textarea)
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        this.actions.toggleCaps();
        return;
      }

      if (e.ctrlKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        this.actions.togglePunct();
        return;
      }

      // Ignore if user is typing in the textarea (unless they press the trigger to start)
      if (
        document.activeElement.id === "text-input" &&
        !e.ctrlKey &&
        e.key !== "Enter"
      ) {
        return;
      }

      // Global session start shortcut
      if (
        e.shiftKey &&
        e.key === "Enter" &&
        document.activeElement.id === "text-input"
      ) {
        e.preventDefault();
        this.actions.startSession();
        return;
      }

      // Only respond to other shortcuts if session is active
      if (!this.actions.isSessionActive()) return;

      // Navigation
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (e.ctrlKey) {
          this.actions.spell();
        } else {
          this.actions.next();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.actions.prev();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (e.ctrlKey) {
          this.actions.toggleCaps();
        } else {
          this.actions.repeat();
        }
      }

      // Speed Control
      if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        this.actions.increaseRate();
      } else if (e.ctrlKey && e.key === "-") {
        e.preventDefault();
        this.actions.decreaseRate();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.actions.increaseRate();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        this.actions.decreaseRate();
      }
    });
  }
}
