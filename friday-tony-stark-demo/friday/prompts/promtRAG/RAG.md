# FRIDAY Retrieval-Augmented Generation Specification

Design and implement a production-ready RAG subsystem that integrates cleanly with FRIDAY.

## Goals
- Index allowlisted project documents and user-provided knowledge.
- Preserve source metadata, document identity, chunk order, and timestamps.
- Normalize text, split it into meaningful overlapping chunks, and deduplicate content.
- Keep embedding and vector-store providers behind typed interfaces.
- Retrieve a small, relevant context set with scores and source citations.
- Never index `.env`, credentials, private keys, raw logs, database dumps, or blocked paths.
- Treat retrieved text as untrusted data, not executable instructions.

## Components
- Document and chunk schemas.
- Safe file loader with extension, size, and path policies.
- Configurable chunker.
- Embedding provider interface with deterministic test implementation.
- Local vector index and persistence layer.
- Retriever with filters, top-k limits, and score thresholds.
- Context formatter with token/character budgets and citations.
- Index build/update/delete services.
- Query service and FastAPI/MCP integration points.
- Tests for retrieval quality, persistence, blocked files, prompt injection, and malformed input.

## Constraints
- Match existing repository conventions and dependencies.
- Use atomic writes, type hints, concise documentation, and safe fallbacks.
- Do not expose secrets or internal filesystem paths in end-user responses.
- Do not use placeholders, TODOs, or abbreviated code.

Respond entirely in English with the proposed file tree followed by complete runnable code.
