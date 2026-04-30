# FIRDAY Vector DB Design

## Architecture Summary

The vector layer is shared from `friday/core/vector/` and is used by `friday/trainModel/`, `friday/runtime/`, agents, memory lookup, and RAG.

- `VectorDocument` and `VectorRecord` describe source documents and indexed chunks.
- `EmbeddingModel` converts documents and queries into vectors.
- `VectorStore` is an adapter protocol with `upsert`, `delete`, `query`, `dump`, and `load`.
- `FaissVectorStore` is the first production vector backend and uses normalized inner-product search for cosine-like similarity.
- `InMemoryVectorStore` remains as a deterministic fallback for local development and tests.
- Retrieval, reranking, prompt context building, and LLM calls are separate modules.

## File-by-File Implementation Plan

- `core/vector/vector_schemas.py`: typed vector documents, records, and search results.
- `core/vector/vector_embedder.py`: hash fallback and Sentence-Transformers adapter.
- `core/vector/vector_store.py`: vector store protocol, in-memory store, and FAISS store.
- `core/vector/vector_indexer.py`: vector add/update/delete, JSONL chunk export, embedding export, and index persistence.
- `core/vector/vector_retriever.py`: query embedding plus top-k vector search.
- `core/vector/vector_reranker.py`: optional keyword overlap reranker.
- `core/vector/vector_similarity.py`: normalization and cosine similarity helpers.
- `core/vector/vector_utils.py`: stable ids and metadata helpers.
- `core/rag/rag_ingest.py`: recursively reads `.md`, `.txt`, and `.log` knowledge files.
- `core/rag/rag_chunker.py`: chunks long content with configurable size and overlap.
- `core/rag/rag_prompt_builder.py`: source-aware grounded context construction.
- `core/rag/rag_citations.py`: source citation formatting.
- `core/rag/rag_pipeline.py`: RAG ingestion pipeline that uses vector services.

## Dependency Notes

Base project dependencies still run without heavy vector packages. Install optional RAG dependencies when FAISS and Sentence-Transformers are needed:

```bash
uv sync --extra rag --extra xlsx
```

If optional packages are absent, use `HashEmbeddingModel` and `InMemoryVectorStore`.

Index files live under:

```text
friday/knowledge/indexes/vector/
```

## Example Retrieved RAG Result

```json
{
  "answer": "FIRDAY builds retrieval context from indexed chunks before calling the LLM [1].",
  "sources": [
    {
      "title": "FIRDAY RAG Foundation Example",
      "source_type": "docs",
      "source_path": "friday/knowledge/raw/docs/rag_foundation_example.md",
      "score": 0.83
    }
  ]
}
```
