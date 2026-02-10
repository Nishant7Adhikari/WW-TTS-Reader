# Predictive Adaptive Dictation (PAD) - The "Writing Speed" Idea

## The Concept

Transform the "Auto-Read" feature from a static timer into a dynamic, personalized assistant. Instead of the user manually hitting `Right Arrow` after writing each dictated word, the system learns the user's writing pace and predicts when they will be ready for the next word.

## Why this is needed

The current "WW TTS Reader" is an active study tool where the user (typically) writes down what is being dictated.

- **Manual Mode:** Interrupts the writing flow to hit a key.
- **Static Auto-Read:** Often too fast or too slow, causing stress or wasted time.
- **PAD Solution:** A "smart" auto-read that feels like a human partner who knows exactly how fast you write.

## How it Works

### 1. The Learning Phase (Training)

While the user is in manual navigation mode (hitting `Right Arrow`), the system quietly records:

- `timestamp_word_spoken`
- `timestamp_next_pressed`
- `word_metadata`: (Length, Complexity, Character composition)

### 2. The Prediction Engine

The engine analyzes the collected data to find patterns:

- **Length-based:** "User takes ~1.2s for 5-letter words."
- **Complexity-based:** "User takes 40% longer for words with double letters or uppercase."
- **Adaptive:** If the user starts slowing down (fatigue), the engine adjusts.

### 3. Confidence & Automation

Once the system has enough data to hit a **80-90% prediction accuracy** (comparing predicted vs. actual manual hits), it notifies the user:

> "I've learned your writing pace! Would you like to enable AI Adaptive Dictation? (ctrl + shift + r arrow symbol)"

### 4. Continuous Improvement

- **Multi-Profile Mastery:** Switch between "Science Lab" (slow, complex) and "Quick Journaling" (fast, simple) profiles.
- **Explicit Pause:** Hit `Space` to grab a tea; the engine won't think you've suddenly become the world's slowest writer.
- **Live Recalibration:** Hit `Left Arrow` if it's too fast, and the AI says "My bad, I'll slow down" and waits for you to lead.
- **IndexedDB Persistence:** Your writing profile grows over weeks.
- **User-in-the-Loop:** Only automates when the user gives the green light.

## Features at a Glance

- **Zero-Config Learning:** Works in the background.
- **Outlier Detection:** Doesn't learn during breaks.
- **IndexedDB Persistence:** Your writing profile grows over weeks.
- **User-in-the-Loop:** Only automates when the user gives the green light.
