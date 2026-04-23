You are working inside an existing Python project named `friday-tony-stark-demo`.

Your task is to build a shared **math + vector DB + RAG + language foundation** for FIRDAY.

The system must support both:
- `friday/trainModel/` for training, dataset preparation, embeddings, indexing, retrieval-aware learning
- `friday/runtime/` for live agent retrieval, memory grounding, response adaptation, language switching, and decision support

Do not build a toy example.
Keep code modular, typed, production-style, and consistent with the existing repo.

==================================================
1. ARCHITECTURE RULES
==================================================

Follow these rules strictly:

1. Shared reusable logic must go into `friday/core/`
2. Shared localization logic must go into `friday/language/`
3. Mathematical formulas must not live only inside `trainModel/`
4. Vector retrieval logic must not be duplicated across train and runtime
5. RAG logic must be shared and reusable
6. `trainModel/` should import from shared core modules
7. `runtime/` should import from shared core modules
8. Documents/specs must live in `friday/docs/`
9. Keep responsibilities separate:
   - math formulas -> `core/math/`
   - vector DB and RAG -> `core/rag/`
   - language/i18n -> `language/`
   - training pipeline -> `trainModel/`
   - live agent runtime -> `runtime/`

==================================================
2. TARGET FOLDER STRUCTURE
==================================================

friday/
├── core/
│   ├── __init__.py
│   ├── constants.py
│   ├── math/
│   │   ├── __init__.py
│   │   ├── regression.py
│   │   ├── classification.py
│   │   ├── similarity.py
│   │   ├── fusion.py
│   │   ├── uncertainty.py
│   │   ├── expected_loss.py
│   │   ├── monte_carlo.py
│   │   ├── bayes.py
│   │   ├── continuous_return.py
│   │   └── neural_ode.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── math_entities.py
│   │   └── rag_entities.py
│   │
│   └── rag/
│       ├── __init__.py
│       ├── chunker.py
│       ├── embeddings.py
│       ├── ingest.py
│       ├── indexer.py
│       ├── retriever.py
│       ├── reranker.py
│       ├── prompt_builder.py
│       ├── citations.py
│       ├── store.py
│       └── utils.py
│
├── language/
│   ├── __init__.py
│   ├── constants.py
│   ├── schemas.py
│   ├── manager.py
│   ├── detector.py
│   ├── vi/
│   │   ├── common.json
│   │   ├── agent.json
│   │   ├── errors.json
│   │   ├── prompts.json
│   │   └── system.json
│   └── en/
│       ├── common.json
│       ├── agent.json
│       ├── errors.json
│       ├── prompts.json
│       └── system.json
│
├── docs/
│   ├── emotion_math.md
│   ├── integral_ai_math.md
│   └── rag_system.md
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
│       └── vectordb/
│
├── trainModel/
│   ├── __init__.py
│   ├── config.py
│   ├── schemas.py
│   ├── collector.py
│   ├── cleaner.py
│   ├── dataset_builder.py
│   ├── trainer.py
│   ├── evaluator.py
│   ├── scorer.py
│   ├── pipeline.py
│   ├── safety_filter.py
│   ├── versioning.py
│   │
│   ├── data/
│   │   ├── raw/
│   │   │   ├── json/
│   │   │   └── xlsx/
│   │   ├── interim/
│   │   ├── processed/
│   │   └── artifacts/
│   │
│   ├── losses/
│   │   ├── __init__.py
│   │   ├── mse_loss.py
│   │   ├── bce_loss.py
│   │   ├── contrastive_loss.py
│   │   └── triplet_loss.py
│   │
│   ├── emotion/
│   │   ├── __init__.py
│   │   ├── extractor.py
│   │   ├── regressor.py
│   │   ├── classifier.py
│   │   ├── fusion.py
│   │   └── calibrator.py
│   │
│   ├── memory/
│   │   ├── __init__.py
│   │   ├── session_memory.py
│   │   ├── user_memory.py
│   │   ├── manager.py
│   │   └── store.py
│   │
│   └── tests/
│       ├── test_emotion.py
│       ├── test_memory.py
│       ├── test_losses.py
│       ├── test_dataset_builder.py
│       ├── test_rag.py
│       └── test_pipeline.py
│
├── runtime/
│   ├── __init__.py
│   ├── agent_state.py
│   ├── decision_engine.py
│   ├── retrieval_context.py
│   ├── response_policy.py
│   ├── scorer.py
│   └── memory_runtime.py
│
├── prompts/
├── tools/
├── runtime_context.py
└── server/
    ├── agent_friday.py
    └── main.py

Keep existing files if they already exist. Only add or update what is necessary.

==================================================
3. SHARED MATH REQUIREMENTS
==================================================

Implement shared reusable math utilities in `friday/core/math/`.

Required formulas and purposes:

A. Multi-label emotion classification
For each label i:
p_i = sigmoid(z_i)

Binary cross entropy:
L_bce = -sum(y_i * log(p_i) + (1 - y_i) * log(1 - p_i))

Use for:
- emotion classifier
- trainModel trainer/evaluator

B. Continuous emotion regression
L_mse = (1 / n) * sum((y_i - y_hat_i)^2)

Use for:
- emotion regression
- continuous mood/score prediction

C. Session mood smoothing
m_t = alpha * m_(t-1) + (1 - alpha) * e_t
default alpha = 0.8

Use for:
- session memory
- runtime scoring
- trainModel scoring

D. User style memory
u_t = lambda * u_(t-1) + (1 - lambda) * h_t
default lambda = 0.9

Use for:
- persistent user style representation
- long-term adaptation

E. Uncertainty
H(p) = -sum(p_i * log(p_i + epsilon))
default epsilon = 1e-12

Use for:
- cautious response policy
- safety filtering
- confidence scoring

F. Final fusion
S_t = w1 * e_t + w2 * m_t + w3 * u_t_projected
defaults: w1=0.5, w2=0.3, w3=0.2

G. Vector similarity
sim(a, b) = (a · b) / (||a|| * ||b||)

H. Contrastive loss
L_contrastive = y * d(a,b)^2 + (1-y) * max(0, margin - d(a,b))^2

I. Triplet loss
L_triplet = max(0, d(a,p) - d(a,n) + margin)

J. Expected loss
J(theta) = E[L(x,theta)] = integral L(x,theta)p(x)dx

K. Monte Carlo approximation
integral f(x)p(x)dx ≈ (1/N) * sum f(x_i)

L. Bayesian evidence
p(D) = integral p(D|theta)p(theta)dtheta

M. Continuous discounted return
G_t = integral_t^infinity exp(-gamma*(tau-t)) * R(tau) d tau

N. Neural ODE state
h(T) = h(0) + integral_0^T f(h(t), t, theta) dt

==================================================
4. VECTOR DB + RAG REQUIREMENTS
==================================================

Implement shared RAG logic in `friday/core/rag/`.

It must support:
- ingest raw docs, notes, memories, logs
- chunk documents with configurable size/overlap
- preserve metadata:
  - source_path
  - source_type
  - chunk_id
  - title if available
- create embeddings for chunks and queries
- build/update vector indexes
- retrieve top-k relevant chunks
- optionally rerank results
- build grounded prompt context for the LLM
- keep store adapter abstract so it can later plug into Chroma, FAISS, Qdrant, or similar

==================================================
5. DATASET REQUIREMENTS
==================================================

Support dataset storage in both:
- JSON / JSONL
- XLSX

Rules:
- JSON/JSONL is canonical machine-friendly format
- XLSX is human-editable format
- before training, both sources must be merged and normalized

`trainModel/data/` structure:
- raw/json/
- raw/xlsx/
- interim/
- processed/
- artifacts/

`dataset_builder.py` must:
- load JSON/JSONL from `data/raw/json/`
- load XLSX from `data/raw/xlsx/`
- normalize into one schema
- merge rows by `id`
- allow XLSX to override editable fields when same `id` exists
- clean invalid rows
- split into train/valid/test
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
- emotion_labels
- emotion_scores
- intent
- memory_tags
- quality_score
- is_safe
- notes

==================================================
6. LANGUAGE / I18N REQUIREMENTS
==================================================

Implement a shared localization module in `friday/language/`.

Support at least:
- Vietnamese (`vi`)
- English (`en`)

Required responsibilities:

A. `constants.py`
- supported languages
- default language
- language aliases
- fallback language

B. `schemas.py`
- language state model
- user language preference model
- session language state model if useful

C. `manager.py`
- load JSON translation files from `language/vi/` and `language/en/`
- get text by key, for example:
  - `common.app_name`
  - `agent.language_switched`
  - `errors.not_found`
- support fallback behavior if key is missing

D. `detector.py`
Detect explicit language-switch commands from the user, including examples like:
- "đổi sang tiếng anh"
- "nói tiếng việt"
- "trả lời bằng tiếng anh"
- "switch to english"
- "answer in vietnamese"
- "from now on, answer in English"
- "từ giờ nói tiếng Việt"

Behavior rules:
- if the user explicitly asks to switch language, update `current_language`
- after switching, the agent must respond in the new language
- do not permanently save language preference unless the user clearly indicates a long-term preference
- long-term preference phrases include:
  - "from now on"
  - "always answer in English"
  - "từ giờ"
  - "luôn trả lời bằng..."

Add `current_language` to runtime state / runtime context.

The runtime must use the language manager so agent/system text can be returned in the active language.

Translation files should contain structured keys such as:

`language/vi/common.json`
- app_name
- status_ready
- status_busy
- button_run
- button_stop

`language/vi/agent.json`
- greeting
- language_switched
- ask_clarify
- task_started

`language/vi/errors.json`
- not_found
- invalid_request
- unsupported_language

Mirror the same structure under `language/en/`.

==================================================
7. TRAIN + RUNTIME USAGE
==================================================

`trainModel/` must import from:
- `friday/core/math/`
- `friday/core/rag/`

`runtime/` must import from:
- `friday/core/math/`
- `friday/core/rag/`
- `friday/language/`

Runtime flow should be:

1. receive user input
2. detect explicit language switch if present
3. update `current_language` if needed
4. create query embedding
5. retrieve top-k context from vector DB
6. rerank if available
7. build RAG prompt context
8. estimate emotion and uncertainty
9. update session mood and user style memory
10. compute fused state
11. apply response policy
12. generate answer in the active language

==================================================
8. SAFETY + DESIGN RULES
==================================================

- do not diagnose the user
- do not overclaim emotion when entropy is high
- do not duplicate core formulas in random files
- do not tightly couple vector storage to one vendor
- keep retrieval separate from prompt building
- keep dataset preparation separate from training
- keep runtime retrieval separate from storage adapters
- keep language detection separate from language content loading
- keep code typed, modular, and testable

==================================================
9. CONFIG DEFAULTS
==================================================

Centralize defaults in shared constants:
- alpha = 0.8
- lambda = 0.9
- w1 = 0.5
- w2 = 0.3
- w3 = 0.2
- epsilon = 1e-12
- margin = 0.2
- top_k = configurable
- chunk_size = configurable
- chunk_overlap = configurable
- default_language = "vi"
- fallback_language = "en" or configurable

==================================================
10. OUTPUT FORMAT
==================================================

Provide the result in this order:
1. Short architecture summary
2. File-by-file implementation plan
3. Full code for each new or updated file
4. Notes on dependencies
5. Example dataset input/output
6. Example retrieved RAG result
7. Example runtime flow using retrieved context
8. Example language switch flow (`vi` <-> `en`)

Build this as a real v1 foundation for FIRDAY:
- shared math
- shared vector retrieval
- shared RAG
- shared language support
- train/runtime reuse
- clean folder structure
- safe and extensible design