# 0001: Use AssemblyAI STT-3.7 for Interview Transcription

- **Status:** Accepted
- **Date:** 2026-11-26

## Decision

Griffier uses **AssemblyAI `STT-3.7`** (batch API) with speaker diarization and speaker identification, wrapped behind a `Transcriber` protocol. Both uploaded audio files and browser recordings (sent when recording stops) go through this same path for v1.

## Why

Griffier is built for journalistic interviews, which usually involve two or more speakers and a mix of Dutch and English. The choice for `STT-3.7` came from four practical reasons:

- **Speaker names, not just labels:** Beyond separating speakers (`speaker_labels: true`), AssemblyAI's speaker identification maps speakers to actual names or roles (such as interviewer and interviewee). That makes the transcript easier to read and lets the Intelligence panel attribute each claim to the right person.

- **Strong on real interviews:** It handles Dutch/English code-switching, overlapping speech, and short clips reliably, which matters both for real interviews and short live demos.

- **Simple and affordable:** Batch transcription with diarization and speaker identification costs about $0.25/hour (billed per second), and needs no local GPU or separate diarization stack.

- **Room to grow:** If live streaming becomes a requirement later, `STT-3.7-Realtime` provides a direct upgrade path without changing the rest of the app.

## Alternatives Considered

- **ElevenLabs `Scribe v3`** ($0.20/hr batch, $0.22/hr live): Stronger on crowded panels (up to 32 speakers) and very cheap for live streaming, but lacks built-in speaker name/role mapping.
- **Deepgram `Nova-3`** (~$0.47–$0.67/hr for Dutch + diarization): Fast streaming, but pricier for Dutch with diarization and slightly behind `STT-3.7` on overlapping interview speech.
- **OpenAI `gpt-4o-transcribe` / self-hosted Whisper + pyannote:** OpenAI is less turnkey for multi-speaker diarization and role mapping; self-hosting adds too much setup overhead for a prototype.

## Trade-offs

- **No live transcription while recording in v1:** Transcription runs once recording stops. Keeping it behind the `Transcriber` protocol makes streaming easy to add later if needed.
- **Extra API key:** Requires `ASSEMBLYAI_API_KEY` in the environment. Tests stay offline using a fake `Transcriber`.
