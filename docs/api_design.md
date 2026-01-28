# API Design - WW TTS Reader

## Modules

### 1. `tokenizer.js`

Responsible for converting raw text into structured tokens for the speech engine.

- **`TOKEN_TYPES`**: `WORD`, `PUNCT`, `SYMBOL`.
- **`CASING`**: `LOWER`, `CAPITALIZED`, `ALL_CAPS`, `NONE`.
- **`Tokenizer.tokenize(text)`**: Main entry point. Returns `Array<Token>`.
- **`Token` Schema**:
  ```json
  {
    "raw": "string",
    "type": "TOKEN_TYPES",
    "casing": "CASING",
    "spokenNormal": "string",
    "spokenSpell": "string",
    "spokenNoCaps": "string"
  }
  ```

### 2. `speechController.js`

Wrapper around `window.speechSynthesis`.

- **Properties**: `rate`, `capsNarration`, `voice`.
- **`speak(token, mode)`**: Mode can be `NORMAL`, `SPELL`.
- **`setRate(newRate)`**: Clamped between 0.1 and 3.0.
- **`toggleCapsNarration()`**: Toggles global state.

### 3. `keyboard.js`

Input listener for global navigation.

- **`KeyboardHandler(actions)`**: Maps keys to the following actions:
  - `ArrowRight`: `next()`
  - `ArrowLeft`: `prev()`
  - `Enter`: `repeat()`
  - `Ctrl + ArrowRight`: `spell()`
  - `Ctrl + Enter`: `toggleCaps()`
  - `Ctrl + +/-`: `updateRate()`

### 4. `app.js`

State manager and UI orchestrator.

- **`App` State**: `tokens`, `currentIndex`, `isSessionRunning`.
- **Screen Transitions**: `input-screen` <-> `session-screen`.
- **UI Update Loop**: Updates status bars, active token highlights, and context scrolls.
