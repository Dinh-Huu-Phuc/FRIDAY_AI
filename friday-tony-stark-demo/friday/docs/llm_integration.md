# FIRDAY LLM Integration

## Architecture Summary

`friday/core/llm/` wraps OpenAI-compatible chat completion APIs without mixing in retrieval logic.

- `client.py`: provider adapter for normal and streaming chat completions.
- `prompts.py`: grounded prompt templates.
- `responder.py`: combines question and RAG context, then calls the LLM client.
- `safety.py`: response cleanup and simple output guardrails.

## Example Runtime Answer Flow

1. Runtime receives a user query.
2. `RagRuntime` publishes `rag_retrieval_started`.
3. `VectorRetriever` embeds the query and retrieves chunks.
4. `KeywordOverlapReranker` optionally reranks.
5. `build_rag_prompt_context` creates a grounded context with citations.
6. `RAGResponder` calls `OpenAICompatibleChatClient`.
7. Streaming mode publishes `llm_response_token`.
8. Runtime returns the final answer plus source metadata.

## Provider Configuration

Use OpenAI-compatible environment variables:

```bash
set OPENAI_API_KEY=...
set FRIDAY_LLM_BASE_URL=https://api.openai.com/v1
```

`FRIDAY_LLM_BASE_URL` can point to OpenAI, Ollama-compatible gateways, local Llama servers, or other compatible providers.
