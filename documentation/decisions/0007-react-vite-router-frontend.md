# 0007: Use React, TypeScript, Vite, and React Router for the Frontend

- **Status:** Accepted
- **Date:** 2026-11-26

## Decision

Griffier's frontend is built with **React**, **TypeScript**, **Vite**, and **React Router**, communicating directly with the FastAPI backend over HTTP.

## Why

With FastAPI already serving as the dedicated backend, a clean client-side React setup gives full flexibility:

- **Clean and capable:** Vite with React Router covers routing, data loading, and SPA ergonomics cleanly without the framework ceremony or server-boundary complexity of full-stack meta-frameworks like Next.js.
- **Proven ergonomics:** Fast dev server, straightforward strict TypeScript setup, and direct familiarity reduce friction on an ~8-hour prototype.
- **Clear separation of concerns:** The frontend owns UI state, audio recording (`MediaRecorder`), and the split-screen workspace; Python/FastAPI owns all AI, transcription, and external API calls.

## Alternatives Considered

- **Next.js:** Adds a Node.js server runtime, Server/Client Component boundaries, and caching layers that overlap with FastAPI without adding value to a single-user journalist workspace.
- **Plain React without a router:** Works for a single screen, but React Router keeps URLs clean and makes adding views (such as interview history or detail routes) effortless later.

## Trade-offs

- **No built-in SSR/SEO:** Not needed for an authenticated/private journalist workspace tool; if public pages are ever required later, they can be served separately or with React Router's framework mode.
