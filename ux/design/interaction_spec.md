# Interaction Specification - WW TTS Reader

## 1. Landing & Input

- **Initial State**: User sees a large clean textarea.
- **Focus**: Textarea is auto-focused (optional) or easily accessible.
- **Action**: User pastes text and clicks "Start Reading Session" or presses `Shift + Enter`.

## 2. Reading Session (Active)

- **Token Focus**: The "current" token is displayed prominently in the center.
- **Context Preview**: A scrollable area below shows the surrounding text with the active word highlighted.
- **Navigation**:
  - `→`: Immediately cancels current speech and speaks the next token. If at end, show toast "End reached".
  - `←`: Reverses one token and speaks it.
  - `Enter`: Re-reads the current token.
  - `Ctrl + →`: Spells the current word letter-by-letter.

## 3. Settings & Status

- **Speed**: Visual indicator in the status bar. Changes via `Ctrl + +/-` or `↑ / ↓`. Feedback via toast message.
- **Caps Mode**: Toggle via `Ctrl + Enter`. When ON, words with capitalization are prefixed with "Caps" or "All caps" to aid in correct case-sensitive note-taking.
- **Progress**: "X / Y" indicator showing position in the text.

## 4. Visual Feedback (Toasts)

- Status changes (speed, caps mode) are confirmed via a transient toast at the bottom to avoid blocking the main view.

## 5. Termination

- Use the "Edit Text" button to return to the input screen. Session state (except for the raw text) is reset.
