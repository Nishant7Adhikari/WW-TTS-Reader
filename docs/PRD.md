# Product Requirements Document: AI-Driven Writing Speed Prediction (PAD System)

## 1. Overview

The goal of this project is to implement a predictive system for the "Next Word" trigger in the WW TTS Reader. By analyzing the user's manual navigation timing, the system will build a profile of the user's writing speed and eventually take over the navigation automatically via an AI Adaptive Auto-Read mode.

## 2. Target Audience

Students and learners who use the app for dictation-based note-taking, requiring a system that matches their physical writing speed.

## 3. Core Features

### 3.1 Data Collection & Multi-Profile Support

- **Multi-Profile Session Learning:**
  - Users can create and switch between different subjects or writing "modes" (e.g., "College Biology" - slow/detailed vs "General Notes" - fast/casual).
  - Each profile stores distinct timing data in **IndexedDB**.
  - Ability to start "New Data Collection" to reset or refine a specific profile.
- **Timing Capture:** Track the duration between a word being spoken and the user hitting `Right Arrow` (Manual) or the engine triggering `Next` (Auto).

### 3.2 Complex Word Profiling

- **Length-Based:** Character count as a primary factor.
- **Pattern Recognition:** Detect frequently occurring letter clusters.
- **Letter Complexity:** Analyze for slow-writing characters or combinations (e.g., excessive capital letters, digits, or complex symbols).
- **Outlier Rejection:** Automatic filtering of "gaps" greater than 10 seconds (e.g., getting water) to keep the model clean unless explicitly paused.

### 3.3 Live Calibration & Corrective Signals

- **Corrective Signal (Left Arrow - "Too Fast"):**
  - Hitting `Left Arrow` during Auto-Read indicates the engine was "Too Fast".
  - Action: Immediately pause Auto-Read and Learning, slightly increase the "required time" weight for that word type, and wait for the user to manually resume with `Right Arrow`.
- **Calibration Signal (Right Arrow - "Too Slow"):**
  - Hitting `Right Arrow` _before_ the engine triggers the next word in Auto-Read mode indicates the engine was "Too Slow".
  - Action: Record the faster manual completion time, update the model to decrease the "required time" weight (speed up), and cancel the pending auto-trigger for the current word.
- **Manual Resumption:** Learning only resumes once the user returns to the correct word position and hits `Next`.
- **Live Recalibration:** The engine constantly adjusts weights based on every manual correction (Hitting `Next` earlier than predicted or hitting `Left` to go back).

### 3.4 Explicit Controls & Breaks

- **Explicit Pause (Space Key):**
  - The `Space` key acts as a master toggle to pause everything (Speech, Auto-Read, and Learning).
  - This distinguishes an intentional "Tea Break" from a natural writing struggle.
- **Auto-Read Toggle:** A clear shortcut (`Ctrl + Shift + Right Arrow`) to switch between AI Adaptive and Manual modes.

### 3.5 Machine Learning Logic (Client-Side)

- **Model Storage:** Persistent IndexedDB storage for cross-session learning.
- **Prediction Algorithm:** Weighted moving average considering length and complexity.
- **Accuracy Tracking:** A background score comparing Predicted Completion Time (PCT) vs. Actual Input.

## 4. Technical Constraints

- **Storage:** IndexedDB.
- **Latency:** Zero-lag requirement for predictive triggers.
- **Privacy:** 100% local processing; timing data never leaves the device.

## 5. UI/UX Requirements

- **Training Status (Mandatory):**
  - A visible indicator showing the learning progress for the current profile (e.g., "Learning: 65% Optimized").
  - Provides transparency for debugging and user confidence.
- **Profile Selector:** Simple UI to switch between writing profiles.
- **Notification:** A prompt to enable AI Auto-Speech when prediction accuracy manages to hit **80-90%**.

## 6. Success Metrics

- **Correction Rate:** < 10% of words require a manual `Left Arrow` adjustment in Adaptive mode.
- **Rhythm Sync:** System triggers `Next` within ±200ms of the user finish-writing for 85% of words.
- **User Trust:** Users transition to AI Auto-Read within the first 100 words of a session.
