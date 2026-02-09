# Gemini API Hybrid Speech System - Technical Design

## 1. Overview

The system uses a two-tier speech architecture:

1.  **Fast Layer**: Web Speech API (Native) for immediate response and word-by-word control.
2.  **Quality Layer**: Gemini AI (Generative) for high-fidelity neural speech with synchronized tokens.

## 2. API Format

The `GeminiHandler` expects or simulates a response from a multimodal Gemini endpoint:

- **Request**: Text content + Request for Audio and Timestamps.
- **Response**:
  - `audioUrl`: Link to generated audio file.
  - `timestamps`: JSON map of `{ wordIndex: millisecondOffset }`.

## 3. Resiliency (Key Pooling)

- Keys are stored in `localStorage`.
- System uses `Key[0]` by default.
- On failure (429, 401, etc.), the key is moved to the bottom of the list.
- User is only notified if ALL keys in the stack fail.

## 4. State Machine

- **INITIAL**: Native Speech available.
- **PROCESSING**: (Alt+G) Overlay visible, API fetch in progress.
- **BACKGROUND_FETCH**: (Esc during Processing) Overlay hidden, fetch continues, Native Speech resumes.
- **AI_READY**: Fetch complete. User notified that Gemini Voice is available.
- **GEMINI_MODE**: (Shift) Playback uses Gemini audio + timestamps for highlighting.
