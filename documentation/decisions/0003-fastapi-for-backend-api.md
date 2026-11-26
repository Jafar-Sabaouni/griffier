# 0003: Use FastAPI for the Backend API

- **Status:** Accepted
- **Date:** 2026-11-26

## Decision

Griffier uses **FastAPI** as the Python HTTP API framework for audio uploads, transcription, passage marking, and intelligence endpoints.

## Why

For an ~8-hour prototype, FastAPI offers the cleanest balance of build speed, type safety, and ecosystem support:

- **Fastest path to a clean API:** Built-in Pydantic v2 validation, multipart file upload handling, and automatic OpenAPI docs remove boilerplate and keep the API contract aligned with the TypeScript frontend.
- **Async by default:** External calls to AssemblyAI, LLM providers, and web search APIs are I/O-bound; FastAPI handles concurrent async requests natively.
- **Mature AI ecosystem:** Wide adoption across Python AI backends means smooth integration with Pydantic models, async HTTP clients, and straightforward route testing via `TestClient` / `httpx`.

## Alternatives Considered

- **Litestar:** Strong typed async alternative with cleaner built-in dependency injection and `msgspec` support, but carries a steeper learning curve and smaller ecosystem for a short prototype.
- **Django Ninja:** Brings FastAPI-style typing on top of Django, which only pays off when using Django's ORM, auth, and admin — all intentionally deferred in [0002](./0002-in-memory-storage-for-prototype.md).
- **Starlette / Quart:** Starlette requires wiring validation and OpenAPI manually; Quart is geared toward migrating legacy Flask apps to async rather than greenfield typed APIs.
- **Robyn:** Rust-backed runtime aimed at raw HTTP throughput, which is not Griffier's bottleneck compared to external STT and LLM latency.

## Trade-offs

- **Coupled to Pydantic:** FastAPI ties API request and response schemas to Pydantic v2. For a prototype, that trade-off is worth the automatic validation and OpenAPI generation.
- **Lighter built-in architecture than Litestar:** Dependency wiring and module structure stay explicit and disciplined through thin route handlers and protocol-backed services.
