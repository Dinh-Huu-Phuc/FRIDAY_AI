# FIRDAY Shared RAG Foundation

## Scope
- Shared ingestion, chunking, embedding, indexing, retrieval, reranking, and prompt-context building.
- Reusable by both `friday/trainModel/` and `friday/runtime/`.

## Key Modules
- `friday/core/rag/ingest.py`: collect docs/notes/memories/logs from local paths.
- `friday/core/rag/chunker.py`: configurable chunk size/overlap with metadata preservation.
- `friday/core/rag/embeddings.py`: embedding model protocol + deterministic hash fallback.
- `friday/core/rag/store.py`: abstract vector store protocol + in-memory store.
- `friday/core/rag/indexer.py`: upsert chunks and save/load index snapshots.
- `friday/core/rag/retriever.py`: top-k retrieval over shared store.
- `friday/core/rag/reranker.py`: optional overlap-based rerank.
- `friday/core/rag/prompt_builder.py`: grounded context block with citations.

## Extension Path
- Keep `VectorStore` interface stable so Chroma/FAISS/Qdrant adapters can be added without touching train/runtime business logic.
