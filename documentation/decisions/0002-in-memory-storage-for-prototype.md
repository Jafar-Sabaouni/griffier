# 0002: Use In-Memory Storage for the Prototype

- **Status:** Accepted
- **Date:** 2026-11-26

## Decision

Griffier stores interviews, transcripts, marked passages, and fact-check results in memory behind an `InterviewRepository` protocol, and stores raw audio separately behind an `AudioStore` protocol backed by a bounded in-memory LRU cache (default 100 MB cap). No database or file-based persistence is included in the prototype.

## Why

A prototype exists to test and validate the core idea: whether a split-screen transcript and intelligence workspace genuinely helps journalists during and after an interview. Decisions around databases, authentication, data retention, and privacy for journalistic source material carry long-term consequences and deserve careful consideration once the product direction is validated. Deferring persistence keeps the focus on the core workflow and avoids premature schema or infrastructure commitments.

## Alternatives Considered

- **SQLite / PostgreSQL:** Adds schemas, migrations, and data-modeling choices that depend on future auth, multi-user, and retention requirements not yet defined.
- **Local JSON files on disk:** Survives restarts, but still introduces file-locking, path configuration, and cleanup concerns unnecessary for validating the concept.

## Trade-offs

- **State resets on restart:** Restarting the backend clears active sessions and requires re-processing audio. Wrapping storage behind an `InterviewRepository` protocol ensures a real database can be plugged in later without changing routes or business logic.
