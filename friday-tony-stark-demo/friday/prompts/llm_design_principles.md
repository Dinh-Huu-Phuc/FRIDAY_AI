# LLM Design Principles for FRIDAY

1. Never assume the model understands like a human; guide important behavior with explicit context and constraints.
2. Reduce ambiguity before inference by cleaning STT, normalizing text, and preserving domain vocabulary.
3. Provide only relevant context: user preferences, recent turns, task constraints, and useful vocabulary.
4. Use runtime memory for reasoning, not immediate weight updates.
5. Perform long-term learning in controlled batches after cleaning, safety filtering, scoring, and evaluation.
6. Write prompts as concise behavioral contracts with role, task, prohibitions, and output format.
7. Use deterministic rules for known transformations and reserve the LLM for contextual ambiguity.
8. Always provide a safe fallback for model errors, timeouts, or low-quality output.
9. Never train on system errors, secrets, spam, meaningless repetition, unsafe refusals, or low-quality responses.
10. Evaluate and version every candidate model; promote only measurable improvements and preserve rollback.
