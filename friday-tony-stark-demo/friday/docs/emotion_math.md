# Emotion Math Specification for FIRDAY

## 1. Overview

This document defines the mathematical design for the emotion-aware learning pipeline inside `friday/trainModel/`.

The purpose of this system is to help FIRDAY:

- estimate the emotional tone of a user's message
- smooth emotional state across a conversation
- adapt to a user's communication style over time
- measure uncertainty before choosing a response style
- generate safer, more appropriate, and more context-aware replies

This system is **not** for diagnosis, labeling the user permanently, or claiming certainty about their internal mental state.

This document is the single source of truth for emotion-related formulas used by training, inference, scoring, and memory modules.

---

## 2. Core Principles

### 2.1 Emotion is probabilistic
Emotion prediction must always be treated as uncertain and probabilistic.

A single utterance may express multiple emotions at once, and a single message does not reveal the user's full emotional state.

### 2.2 Conversation state matters
The final emotional interpretation should not rely only on the latest message.

It must combine:

- current utterance emotion signal
- short-term session mood
- longer-term user communication style

### 2.3 Safety is more important than confidence
If the system is uncertain, it must respond more cautiously.

The agent should prefer gentle, tentative language instead of overclaiming.

### 2.4 No diagnosis
The system must never diagnose or imply a medical or psychological condition.

Forbidden behavior includes statements such as:

- "You are depressed."
- "You have anxiety disorder."
- "I know exactly how you feel."
- "You are mentally unstable."

Preferred style includes:

- "It sounds like this may be frustrating."
- "You seem a bit tired or under pressure."
- "I may be reading this imperfectly, but this situation sounds difficult."

---

## 3. Definitions

### 3.1 Utterance
A single user message at time step `t`.

### 3.2 Emotion vector
A probability vector representing the current message across multiple emotion labels.

Example labels:

- joy
- sadness
- anger
- frustration
- fear
- anxiety
- neutral

Notation:

- `e_t`: current predicted emotion vector at turn `t`

### 3.3 Session mood
A smoothed short-term emotional state across recent turns in the same conversation.

Notation:

- `m_t`: session mood at turn `t`

### 3.4 User style memory
A slowly changing representation of how a user typically communicates.

Notation:

- `u_t`: user style memory at turn `t`

### 3.5 Confidence / uncertainty
A measure of how uncertain the emotion prediction is.

Notation:

- `H(p)`: entropy of predicted probabilities

### 3.6 Utterance embedding
A vector representation of the current message.

Notation:

- `h_t`: embedding of current utterance at turn `t`

### 3.7 Final fused state
A combined state used for downstream response adaptation.

Notation:

- `S_t`: final emotion-aware fused score at turn `t`

---

## 4. Mathematical Model

## 4.1 Multi-label emotion prediction

The system must use **multi-label classification** instead of single-label classification.

Reason:
A user can be frustrated and tired at the same time, or sad and anxious at the same time.

### Formula

For each emotion label `i`:

```text
p_i = sigmoid(z_i)

Where:

z_i = raw logit for label i
p_i = predicted probability for label i

Sigmoid function:

sigmoid(x) = 1 / (1 + exp(-x))
Loss function

Training must use binary cross entropy across all emotion labels:

L = -sum( y_i * log(p_i) + (1 - y_i) * log(1 - p_i) )

Where:

y_i = ground-truth label for emotion i
p_i = predicted probability for emotion i
Why this is required

This allows outputs like:

joy = 0.04
sadness = 0.31
frustration = 0.79
anxiety = 0.26
neutral = 0.10

instead of forcing exactly one emotion.

File mapping

This formula must be used in:

friday/trainModel/trainer.py
friday/trainModel/evaluator.py
friday/trainModel/pipeline.py
4.2 Session mood smoothing

The emotional state of the conversation should not jump sharply between turns.

Use exponential smoothing to preserve short-term conversational mood.

Formula
m_t = alpha * m_(t-1) + (1 - alpha) * e_t

Where:

m_t = updated session mood
m_(t-1) = previous session mood
e_t = current emotion vector
alpha = smoothing factor
Default
alpha = 0.8
Meaning
high alpha -> session remembers previous turns strongly
low alpha -> session reacts more strongly to the latest message
Expected behavior
initialize m_0 from the first valid e_t
update m_t after each user turn
session mood should be vector-based, not a single label
session mood must be stored per conversation/session
File mapping

This formula must be used in:

friday/trainModel/memory/session_memory.py
friday/trainModel/memory/manager.py
friday/trainModel/scorer.py
4.3 User style memory

The system should learn how a user typically communicates across conversations.

This is not a personality verdict.
It is a slow-moving style representation.

Formula
u_t = lambda * u_(t-1) + (1 - lambda) * h_t

Where:

u_t = updated user style memory
u_(t-1) = previous user style memory
h_t = current utterance embedding
lambda = memory retention factor
Default
lambda = 0.9
Meaning
high lambda -> user style changes slowly
low lambda -> user style changes faster
Rules
u_t must be based on embeddings, not raw labels
u_t must evolve more slowly than m_t
u_t should represent long-term style, not current mood
store user style separately from session state
File mapping

This formula must be used in:

friday/trainModel/memory/user_memory.py
friday/trainModel/memory/store.py
friday/trainModel/memory/manager.py
4.4 Uncertainty via entropy

The system must estimate how uncertain its emotion prediction is.

Use entropy as the primary uncertainty signal.

Formula
H(p) = -sum( p_i * log(p_i + epsilon) )

Where:

p_i = predicted probability for emotion label i
epsilon = small value to avoid log(0)
H(p) = entropy
Default
epsilon = 1e-12
Meaning
lower entropy -> higher confidence
higher entropy -> lower confidence
Required behavior

When entropy is high:

reduce certainty in wording
avoid strong interpretations
prefer gentle, tentative language
allow neutral fallback response style
File mapping

This formula must be used in:

friday/trainModel/scorer.py
friday/trainModel/safety_filter.py
friday/trainModel/pipeline.py
4.5 Final emotion-aware fusion

The final adaptive emotional state should combine:

current turn signal
short-term session mood
long-term user style
Formula
S_t = w1 * e_t + w2 * m_t + w3 * u_t_projected

Where:

S_t = final fused score
e_t = current emotion vector
m_t = session mood vector
u_t_projected = user style memory projected into the same emotion-aware space as e_t
w1, w2, w3 = fusion weights
Default weights
w1 = 0.5
w2 = 0.3
w3 = 0.2
Constraint
w1 + w2 + w3 = 1.0
Meaning
current turn has strongest influence
session mood has medium influence
long-term user style has smaller but stable influence
Notes
if u_t is stored as an embedding, it must be projected into the same comparison space before fusion
that projection may be implemented by a learned layer or a deterministic mapper
the fusion output must remain interpretable and stable
File mapping

This formula must be used in:

friday/trainModel/scorer.py
friday/trainModel/pipeline.py
5. Recommended Runtime Flow

The expected inference pipeline is:

receive user utterance
create utterance embedding h_t
predict current multi-label emotion vector e_t
update session mood m_t
update user style memory u_t
project u_t if needed
compute fused state S_t
compute uncertainty H(p)
apply safety rules
choose response tone and phrasing
Flow summary
user text -> embedding h_t
h_t -> emotion predictor -> e_t
previous m_(t-1) + e_t -> m_t
previous u_(t-1) + h_t -> u_t
e_t + m_t + u_t_projected -> S_t
emotion probs -> entropy H(p)
S_t + H(p) -> safe response strategy
6. Safety Policy for Emotion-Aware Behavior
6.1 Low-confidence language policy

When entropy is high, the response must become more cautious.

Preferred phrasing:

"It sounds like this may be frustrating."
"You might be feeling a bit overwhelmed."
"I may be reading this imperfectly, but this seems tiring."

Avoid:

"You are definitely angry."
"I know exactly what you feel."
"You are emotionally unstable."
6.2 High-risk situations

If the user message suggests:

self-harm
suicidal intent
severe crisis
imminent danger

then the emotion engine may still compute internal signals, but it must not decide the final behavior alone.

Higher-level safety handling must take priority over the emotion model.

6.3 No permanent emotional assumptions

The system must not store harmful, rigid, or identity-like emotional assumptions as fixed truths.

Bad examples:

"This user is unstable."
"This user is always negative."
"This user is depressed."

Allowed examples:

short-term session mood state
rolling user style vector
probabilistic history used only for response adaptation
7. File Responsibilities
collector.py

Collect training examples and raw conversation samples.

dataset_builder.py

Build emotion-aware datasets.
Support multi-label targets when available.

trainer.py

Train the emotion model using sigmoid + binary cross entropy.

evaluator.py

Evaluate multi-label classification quality.

Recommended metrics:

precision
recall
F1
macro F1
micro F1
pipeline.py

Run the end-to-end inference flow from utterance to safe emotion-aware state.

scorer.py

Compute:

entropy
fused score
confidence-aware scoring
tone selection helpers
safety_filter.py

Apply language caution rules and block unsafe emotional overclaiming.

memory/session_memory.py

Store and update session mood m_t.

memory/user_memory.py

Store and update user style memory u_t.

memory/manager.py

Coordinate reads and writes for session mood and user style memory.

memory/store.py

Persist emotion-aware state safely.

8. Configuration Defaults

Recommended default values:

alpha = 0.8
lambda = 0.9
w1 = 0.5
w2 = 0.3
w3 = 0.2
epsilon = 1e-12
high_entropy_threshold = configurable
Rules
these values must live in config/constants, not be duplicated randomly
thresholds may be tuned later
any change to these defaults should be documented
9. Worked Example
User message
"I'm really tired of this. I tried to fix it all day and nothing worked."
Example emotion prediction
e_t = {
  frustration: 0.78,
  sadness: 0.34,
  anxiety: 0.29,
  joy: 0.02,
  neutral: 0.10
}
Example previous session mood
m_(t-1) = {
  frustration: 0.60,
  sadness: 0.20,
  anxiety: 0.18,
  joy: 0.05,
  neutral: 0.22
}
Update session mood with alpha = 0.8
m_t = 0.8 * m_(t-1) + 0.2 * e_t

This slightly raises frustration, sadness, and anxiety while preserving continuity from earlier turns.

Example user style memory update
u_t = 0.9 * u_(t-1) + 0.1 * h_t

This slowly adapts long-term style memory based on the current utterance embedding.

Example final behavior
if entropy is low -> validate emotion more directly but still gently
if entropy is high -> use softer and more tentative phrasing

Preferred response example:

"It sounds really frustrating to spend that much time on something and still have it fail. Let’s break it down step by step."

Bad response example:

"You are emotionally unstable."
10. Implementation Rules for Codex and Other Agents

When implementing any emotion-related functionality inside friday/trainModel/, follow these rules:

read this file first
do not replace these formulas with another design unless explicitly requested
treat emotion as multi-label and probabilistic
keep session mood stateful across turns
keep user style memory slower-moving than session mood
use entropy to reduce overclaiming
do not turn emotion estimation into diagnosis
keep training, scoring, memory, and safety responsibilities separated by file
prefer clear, testable, typed implementations
preserve architecture consistency with the rest of the repo
11. Future Extensions

These are valid future improvements, but they do not replace the current base design unless explicitly approved:

valence-arousal regression
personalized calibration
contrastive emotion retrieval
memory decay scheduling
reinforcement updates from user corrections
temporal neural sequence models across turns

Until then, the base system must remain grounded in:

multi-label prediction
session smoothing
user style memory
entropy-based uncertainty
safety-aware response adaptation
12. Final Summary

The FIRDAY emotion-aware pipeline is built on five core components:

multi-label emotion prediction

p_i = sigmoid(z_i)

binary cross entropy training

L = -sum( y_i * log(p_i) + (1 - y_i) * log(1 - p_i) )

session mood smoothing

m_t = alpha * m_(t-1) + (1 - alpha) * e_t

user style memory

u_t = lambda * u_(t-1) + (1 - lambda) * h_t

uncertainty handling with entropy

H(p) = -sum( p_i * log(p_i + epsilon) )

These components are combined into a fused state:

S_t = w1 * e_t + w2 * m_t + w3 * u_t_projected

This design helps FIRDAY respond with better emotional awareness while staying cautious, non-diagnostic, and safer for real users.