/**
 * Gemini API Handler for Hybrid Speech System
 * Handles API key pooling, rotation, and content generation.
 */

export class GeminiHandler {
  constructor() {
    this.keys = this._loadKeys();
    this.currentKeyIndex = 0;
    this.isFetching = false;
    this.abortController = null;
  }

  _loadKeys() {
    const saved = localStorage.getItem("gemini_api_keys");
    if (saved) {
      try {
        // In a real app, this would be encrypted
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  saveKeys(keys) {
    this.keys = keys.filter((k) => k.trim() !== "");
    localStorage.setItem("gemini_api_keys", JSON.stringify(this.keys));
    this.currentKeyIndex = 0;
  }

  hasKeys() {
    return this.keys.length > 0;
  }

  /**
   * Fetches audio and timestamps from Gemini
   * @param {Array} tokens - List of tokens from the tokenizer
   * @param {Function} onProgress - Callback for progress updates
   */
  async fetchAudio(tokens, onProgress) {
    if (this.isFetching) {
      this.abortController.abort();
    }

    this.isFetching = true;
    this.abortController = new AbortController();

    let attempts = 0;
    const maxAttempts = this.keys.length;

    while (attempts < maxAttempts) {
      const key = this.keys[this.currentKeyIndex];

      try {
        onProgress(10, "Connecting...");
        const result = await this._makeRequest(tokens, key, onProgress);
        this.isFetching = false;
        return result;
      } catch (error) {
        if (error.name === "AbortError") throw error;
        console.error(
          `Gemini request failed with key ${this.currentKeyIndex}:`,
          error,
        );
        this._rotateKeys();
        attempts++;
        if (attempts >= maxAttempts) {
          this.isFetching = false;
          throw new Error(
            "All API keys failed. Please check your keys and quota.",
          );
        }
        onProgress(
          10,
          `Retrying with backup key... (${attempts}/${maxAttempts})`,
        );
      }
    }
  }

  async _makeRequest(tokens, key, onProgress) {
    const text = tokens.map((t) => t.raw).join(" ");
    onProgress(30, "Generating Speech Content...");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: text }],
        },
      ],
      generationConfig: {
        response_mime_type: "audio/mp3",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (e) {}
      const msg = errorData?.error?.message || response.statusText;
      throw new Error(`Gemini API Error: ${msg}`);
    }

    const data = await response.json();

    // Extract audio from response
    // Typical Gemini multi-modal response: candidates[0].content.parts[0].inlineData
    const audioPart = data.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData,
    );

    if (!audioPart || !audioPart.inlineData?.data) {
      throw new Error(
        "Gemini did not return audio data. Use a supported TTS model.",
      );
    }

    onProgress(70, "Processing High-Quality Audio...");

    const audioBase64 = audioPart.inlineData.data;
    const audioBlob = this._base64ToBlob(audioBase64, "audio/mp3");
    const audioUrl = URL.createObjectURL(audioBlob);

    onProgress(90, "Synchronizing Timestamps...");

    // Get total duration to improve timestamp distribution
    const duration = await this._getAudioDuration(audioUrl);
    const timestamps = this._generateBestEffortTimestamps(tokens, duration);

    return {
      audioUrl: audioUrl,
      timestamps: timestamps,
      text: text,
      duration: duration,
    };
  }

  _base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  async _getAudioDuration(url) {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
      });
      // Fallback if metadata fails to load
      setTimeout(() => resolve(0), 2000);
    });
  }

  _generateBestEffortTimestamps(tokens, totalDuration) {
    const timestamps = {};
    if (tokens.length === 0) return timestamps;

    if (totalDuration === 0) {
      // Fallback to speed-based if duration unknown
      let currentTime = 0;
      tokens.forEach((_, index) => {
        timestamps[index] = currentTime;
        currentTime += 400; // default 400ms per token
      });
      return timestamps;
    }

    // Distribute words linearly over the duration as a "best effort"
    const durationPerToken = (totalDuration * 1000) / tokens.length;

    tokens.forEach((_, index) => {
      timestamps[index] = index * durationPerToken;
    });

    return timestamps;
  }

  _rotateKeys() {
    if (this.keys.length > 1) {
      const failedKey = this.keys.splice(this.currentKeyIndex, 1)[0];
      this.keys.push(failedKey);
      localStorage.setItem("gemini_api_keys", JSON.stringify(this.keys));
    }
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.isFetching = false;
    }
  }
}
