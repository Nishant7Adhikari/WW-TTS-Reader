/**
 * Adaptive Engine for WW TTS Reader (PAD System)
 * Handles user writing pattern analysis and prediction with Multi-Profile support.
 */

export class AdaptiveEngine {
  constructor() {
    this.currentProfile = "default";
    this.isPaused = false;

    // Timing state
    this.lastWordSpokenTime = 0;
    this.accuracies = [];
    this.currentToken = null;

    // Default Model Weights
    this.model = {
      baseRate: 1000,
      lengthMultiplier: 80,
      complexityBonus: 150,
      digitPenalty: 300,
      patternWeights: {}, // Frequently occurring patterns
    };

    this.db = null;
    this._initDB();
  }

  async _initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("WW_TTS_PAD", 1);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("profiles")) {
          db.createObjectStore("profiles", { keyPath: "name" });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        this.loadProfile(this.currentProfile);
        resolve();
      };

      request.onerror = (e) => reject(e);
    });
  }

  async saveProfile() {
    if (!this.db) return;
    const tx = this.db.transaction("profiles", "readwrite");
    const store = tx.objectStore("profiles");
    store.put({
      name: this.currentProfile,
      model: this.model,
      updatedAt: Date.now(),
    });
  }

  async loadProfile(name) {
    if (!this.db) {
      this.currentProfile = name;
      return;
    }
    const tx = this.db.transaction("profiles", "readonly");
    const store = tx.objectStore("profiles");
    const request = store.get(name);

    request.onsuccess = () => {
      if (request.result) {
        this.model = request.result.model;
        this.currentProfile = name;
        console.log(`PAD: Profile "${name}" loaded.`);
      } else {
        console.log(`PAD: Profile "${name}" not found, using defaults.`);
      }
    };
  }

  async switchProfile(name) {
    await this.saveProfile();
    await this.loadProfile(name);
  }

  onWordSpoken(token) {
    if (this.isPaused) return;
    this.lastWordSpokenTime = performance.now();
    this.currentToken = token;
  }

  async resetProfile() {
    this.model = {
      baseRate: 1000,
      lengthMultiplier: 80,
      complexityBonus: 150,
      digitPenalty: 300,
      patternWeights: {},
    };
    this.accuracies = [];
    await this.saveProfile();
  }

  isMastered() {
    if (this.accuracies.length < 30) return false;
    // Calculate average of last 20 accuracies
    const recent = this.accuracies.slice(-20);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    return avg > 0.85; // 85% accuracy threshold
  }

  onManualNext() {
    if (!this.lastWordSpokenTime || this.isPaused) return;

    const timeTaken = performance.now() - this.lastWordSpokenTime;

    // Explicit Outlier Rejection (>10s)
    if (timeTaken > 10000) {
      this.lastWordSpokenTime = 0;
      return;
    }

    this._train(this.currentToken, timeTaken);
    this.lastWordSpokenTime = 0;
  }

  onTooFastSignal() {
    if (!this.currentToken) return;

    // Strong correction: Increase base rate specifically for this session
    this.model.baseRate += 300;
    this.isPaused = true;
    this.lastWordSpokenTime = 0;
    this.saveProfile();
  }

  predictRequiredTime(token) {
    let time = this.model.baseRate;
    const raw = token.raw;

    // 1. Length Factor
    time += raw.length * this.model.lengthMultiplier;

    // 2. Letter Complexity
    if (/[A-Z]/.test(raw)) time += this.model.complexityBonus;
    if (/[0-9]/.test(raw)) time += this.model.digitPenalty;
    if (/[^a-zA-Z0-9\s]/.test(raw)) time += this.model.complexityBonus;

    // 3. Pattern Recognition (e.g. 'th', 'str' - if we learned they are slow)
    Object.keys(this.model.patternWeights).forEach((p) => {
      if (raw.includes(p)) time += this.model.patternWeights[p];
    });

    return time;
  }

  getTrainingStatus() {
    // Progress is based on how many calibration points we have (mocked for now)
    const points = this.accuracies.length;
    let percent = Math.min(100, (points / 50) * 100);

    if (percent < 20) return `Learning: Initializing (${percent.toFixed(0)}%)`;
    if (percent < 80) return `Learning: Calibration (${percent.toFixed(0)}%)`;
    return `Optimized (${percent.toFixed(0)}%)`;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  _train(token, actualTime) {
    if (!token) return;

    const predicted = this.predictRequiredTime(token);
    const error = actualTime - predicted;

    // Adaptive Learning (Learning rate 0.15)
    this.model.baseRate += error * 0.15;

    // Pattern learning (Simplified: if word has "th" and we were slow, th gets heavier)
    const commonPatterns = ["th", "str", "ing", "tion", "ph"];
    commonPatterns.forEach((p) => {
      if (token.raw.includes(p)) {
        this.model.patternWeights[p] =
          (this.model.patternWeights[p] || 0) + error * 0.05;
      }
    });

    // Accuracy Tracking
    const accuracy = 1 - Math.abs(error) / actualTime;
    this.accuracies.push(accuracy);
    if (this.accuracies.length > 100) this.accuracies.shift();

    if (this.accuracies.length % 5 === 0) this.saveProfile();
  }
}
