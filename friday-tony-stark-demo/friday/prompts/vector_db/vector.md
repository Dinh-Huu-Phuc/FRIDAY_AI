You are working inside an existing Python project named `friday-tony-stark-demo`.

Your task is to build a shared **Vector DB + RAG + LLM + system_socket foundation** for FIRDAY.

The system must support both:
- `friday/trainModel/` for dataset preparation, chunking, embedding generation, vector indexing, and retrieval-aware training
- `friday/runtime/` for live retrieval, grounded answering, memory lookup, realtime streaming, and agent response support

Do not build a toy example.
Keep the code modular, typed, production-style, and consistent with the existing repository.

==================================================
1. ARCHITECTURE RULES
==================================================

Follow these rules strictly:

1. Shared reusable logic goes into `friday/core/`
2. Realtime websocket infrastructure must be clearly named with `system_socket`
3. Vector store logic must be abstracted behind an adapter layer
4. Retrieval logic must be separate from prompt building
5. Prompt building must be separate from LLM client logic
6. Training logic stays in `friday/trainModel/`
7. Runtime orchestration stays in `friday/runtime/`
8. WebSocket transport lives in `friday/app/realtime/`
9. Keep raw knowledge files human-editable
10. Only add or update what is necessary; preserve existing working modules

==================================================
2. TARGET FOLDER STRUCTURE
==================================================

friday/
├── app/
│   ├── realtime/
│   │   ├── __init__.py
│   │   ├── system_socket.py
│   │   ├── system_socket_manager.py
│   │   ├── system_socket_events.py
│   │   ├── system_socket_broadcaster.py
│   │   ├── system_socket_channels.py
│   │   └── system_socket_settings.py
│
├── core/
│   ├── __init__.py
│   ├── constants.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── rag_entities.py
│   │   └── llm_entities.py
│   │
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── chunker.py
│   │   ├── embeddings.py
│   │   ├── ingest.py
│   │   ├── indexer.py
│   │   ├── retriever.py
│   │   ├── reranker.py
│   │   ├── prompt_builder.py
│   │   ├── citations.py
│   │   ├── store.py
│   │   └── utils.py
│   │
│   └── llm/
│       ├── __init__.py
│       ├── client.py
│       ├── prompts.py
│       ├── responder.py
│       └── safety.py
│
├── knowledge/
│   ├── raw/
│   │   ├── docs/
│   │   ├── memories/
│   │   ├── logs/
│   │   └── notes/
│   ├── processed/
│   │   ├── chunks.jsonl
│   │   ├── embeddings.jsonl
│   │   └── manifest.json
│   └── indexes/
│       ├── faiss/
│       │   ├── index.faiss
│       │   ├── metadata.pkl
│       │   └── config.json
│       └── chroma/
│
├── runtime/
│   ├── __init__.py
│   ├── agent_state.py
│   ├── rag_runtime.py
│   ├── retrieval_context.py
│   ├── response_policy.py
│   ├── scorer.py
│   ├── memory_runtime.py
│   ├── system_socket_event_bus.py
│   ├── system_socket_event_types.py
│   ├── system_socket_publishers.py
│   └── system_socket_subscribers.py
│
├── trainModel/
│   ├── __init__.py
│   ├── dataset_builder.py
│   ├── trainer.py
│   ├── evaluator.py
│   ├── data/
│   │   ├── raw/
│   │   │   ├── json/
│   │   │   └── xlsx/
│   │   ├── interim/
│   │   ├── processed/
│   │   └── artifacts/
│   └── tests/
│       ├── test_dataset_builder.py
│       ├── test_rag.py
│       └── test_runtime_rag.py
│
├── docs/
│   ├── rag_system.md
│   ├── vector_db_design.md
│   └── llm_integration.md
│
├── runtime_context.py
└── server/
    ├── agent_friday.py
    ├── main.py
    └── server.py

==================================================
3. VECTOR DB REQUIREMENTS
==================================================

Implement a shared vector database layer in `friday/core/rag/`.

Requirements:
- support document embeddings and query embeddings
- support local vector search using FAISS first
- keep `store.py` abstract so it can later support Chroma or Qdrant
- support metadata with each chunk:
  - id
  - source_path
  - source_type
  - title
  - tags
  - chunk_id
  - created_at if available

Implement:
- `embeddings.py`: text -> embedding
- `indexer.py`: add/update/delete vectors
- `retriever.py`: top-k similarity search
- `reranker.py`: optional reranking
- `store.py`: adapter interface and FAISS implementation first

Use cosine similarity or normalized vector search where appropriate.
Do not hardcode the system to one vector backend.

==================================================
4. RAG REQUIREMENTS
==================================================

Implement a shared RAG pipeline in `friday/core/rag/`.

It must support:
- ingest raw files from `knowledge/raw/`
- parse `.md` and `.txt`
- chunk long content with configurable chunk size and overlap
- preserve metadata from file header or inferred metadata
- write processed chunks to `knowledge/processed/chunks.jsonl`
- optionally write embedding export to `knowledge/processed/embeddings.jsonl`
- build grounded prompt context from retrieved chunks
- support citations/source references

Each raw knowledge file should support fields like:
- title
- date
- source
- tags
- content

Recommended markdown shape:

# Title
- date: YYYY-MM-DD
- source: internal-doc
- tags: [rag, runtime, training]

## Content
Main content here.

==================================================
5. LLM REQUIREMENTS
==================================================

Implement an LLM layer in `friday/core/llm/`.

Required files:
- `client.py`: model adapter / provider wrapper
- `prompts.py`: prompt templates
- `responder.py`: combine question + RAG context + prompt -> answer
- `safety.py`: output checks and guardrails

The LLM layer must support:
- OpenAI-compatible chat completion APIs
- easy replacement with GPT-4, GPT-4o, Llama 3, Ollama, or another provider
- structured prompt building with retrieved context
- optional citations in the final response

Do not mix retrieval logic into the LLM client.

==================================================
6. TRAIN DATA REQUIREMENTS
==================================================

Support dataset storage in both:
- JSON / JSONL
- XLSX

Rules:
- JSON/JSONL is canonical machine-friendly format
- XLSX is human-editable format
- before training, both sources must be merged and normalized

`trainModel/dataset_builder.py` must:
- load JSON/JSONL from `trainModel/data/raw/json/`
- load XLSX from `trainModel/data/raw/xlsx/`
- normalize rows into one schema
- merge by `id`
- allow XLSX to override editable fields when the same `id` exists
- clean invalid rows
- split train/valid/test
- export processed JSONL
- optionally export processed XLSX
- generate manifest and validation report

Normalized schema should include:
- id
- user_id
- session_id
- timestamp
- source
- input_text
- target_text
- tags
- notes

==================================================
7. SYSTEM_SOCKET REQUIREMENTS
==================================================

Implement websocket infrastructure with explicit `system_socket` naming.

Backend websocket files:
- `app/realtime/system_socket.py`
- `app/realtime/system_socket_manager.py`
- `app/realtime/system_socket_events.py`
- `app/realtime/system_socket_broadcaster.py`
- `app/realtime/system_socket_channels.py`
- `runtime/system_socket_event_bus.py`
- `runtime/system_socket_event_types.py`
- `runtime/system_socket_publishers.py`
- `runtime/system_socket_subscribers.py`

Responsibilities:
- manage websocket connections
- broadcast events to clients
- support channels like:
  - agent
  - runtime
  - logs
  - rag
- publish events from runtime to websocket clients

Example event types:
- rag_retrieval_started
- rag_retrieval_completed
- rag_chunks_ready
- llm_response_started
- llm_response_token
- llm_response_completed
- runtime_updated
- error

Do not place websocket business logic directly inside `server/agent_friday.py`.

==================================================
8. RUNTIME FLOW REQUIREMENTS
==================================================

Implement runtime orchestration in `friday/runtime/rag_runtime.py`.

Expected flow:
1. receive user query
2. publish websocket event: retrieval started
3. compute query embedding
4. retrieve top-k chunks
5. rerank if available
6. build prompt context
7. call LLM responder
8. optionally stream tokens/events via system_socket
9. return final grounded answer with source metadata if available

==================================================
9. KNOWLEDGE BASE REQUIREMENTS
==================================================

Support raw knowledge base under:

knowledge/raw/
- docs/
- memories/
- logs/
- notes/

Purpose:
- docs: official docs, SOPs, system architecture, internal guides
- memories: long-term user/team knowledge, preferences, decisions
- logs: reusable summarized work sessions and lessons learned
- notes: benchmarks, comparisons, implementation notes, checklists

The ingestion pipeline must:
- recursively scan these folders
- parse metadata
- infer category from path
- attach category metadata to each chunk

==================================================
10. DEPENDENCY / IMPLEMENTATION NOTES
==================================================

Design the implementation so it works first with:
- FAISS for vector search
- Sentence-Transformers for embeddings
- FastAPI WebSocket for realtime transport
- OpenAI-compatible LLM client abstraction

Keep these replaceable later.

==================================================
11. OUTPUT FORMAT
==================================================

Provide the result in this order:
1. Short architecture summary
2. File-by-file implementation plan
3. Full code for each new or updated file
4. Dependency notes
5. Example raw knowledge file
6. Example retrieved RAG result
7. Example system_socket event flow
8. Example runtime answer flow

Build this as a real v1 foundation for FIRDAY:
- Vector DB
- RAG
- LLM integration
- system_socket realtime streaming
- clean folder structure
- safe and extensible design

