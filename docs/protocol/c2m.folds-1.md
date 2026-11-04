# Proxy protocol: cross-validated by work

This file fixes how `proxy_folds.py` measures what a small student learns from each pipeline's dataset.
It was written and committed before any run it describes. A change to it after results exist is a new
protocol version, and both results are reported.

Version: `c2m.folds/1`.

## Question

Each pipeline (c2m, Unsloth Studio's PDF Document QA recipe, NeMo Curator's DiverseQA) made a question-answer
training set from the same 12 source files with the same teacher. A student tuned on which set answers
questions about works it never saw best?

## Folds

- A unit of hold-out is a work, as c2m's `current_works` groups documents. Every row of every pipeline is
  joined to its work by its source file's SHA-256.
- The works, sorted by `work_id`, are shuffled with `random.Random(0)` and dealt round-robin into 6 folds.
  With 12 works each fold holds 2.
- In a fold, a pipeline's student trains on that pipeline's rows whose sources all lie outside the fold, and
  answers the fold's questions. Every work is held out exactly once.
- c2m's own whole-work splits (`train`, `validation`, `test`) are not used here.

## Training

- Each pipeline trains on all of its rows outside the fold, as it made them. c2m's rows are its `research`
  export's sft rows exactly as exported (`answer`, `short`, and `abstain` variants). Unsloth's and Curator's
  are rendered as `compare_datasets.py` renders them: c2m's system prompt, `Passage: … Question: …`, the
  answer as the reply.
- Student and settings are the workspace's `[proxy]` section, unchanged between pipelines: the same model,
  iterations, batch size, learning rate, LoRA layers, and sequence length. Datasets of different sizes train
  for the same number of steps.
- Seed 0 is the primary result. Seeds 1 and 2 are a robustness check, run after seed 0 has finished for every
  pipeline and fold, and reported whatever they show. A seed sets mlx-lm's batch order and LoRA
  initialization. One run takes about 50 minutes on an M3 Max, so seed 0 alone is 18 runs.
- A floor: the untuned student answers every fold's questions once.

## Questions

- The pool is every RL row of c2m's `research` export (all splits) and every Unsloth row, admitted only when
  its gold answer is extractive: the answer's `c2m.exact/1` key is non-empty and appears in its passage's
  key. Exact and containment scoring are only meaningful for an answer the passage states.
- Curator writes no question to the pool: most of its questions on Korean passages are in English.
- Every question is asked in the same form, whatever its source: c2m's system prompt, then
  `Passage: … Question: …`, then `Reply with only the answer, copied exactly from the passage.`
- Two questions with the same key (system, prompt, and answer) are asked once.

## Scores

Every question gets three scores from each tuned student. Replies are greedy and capped at 256 tokens.

| Score | Definition |
| --- | --- |
| `contains` (primary) | 1.0 when the gold answer's key appears in the reply's key and the reply has at most 5× as many letters and digits as the gold answer, or 40, whichever is more; else 0.0. Letters are counted composed (NFC), so a Hangul syllable is one. The cap stops a reply that copies the passage from scoring. |
| `exact` | 1.0 when the reply's key equals the gold key (`c2m.exact/1`); else 0.0. |
| `loglik` | The log-likelihood of the gold answer and its turn's end, in nats per character of the answer. |

## Estimates

- The primary estimates use seed 0. The robustness check repeats them with each question's mean over seeds
  0, 1, and 2.
- A pipeline's score is the mean over questions, with a 95% interval clustered by work
  (`core/proxy.py`, 12 clusters).
- Pipelines are compared by paired differences over the same questions, clustered by work, against c2m.
  The comparison is reported for the whole pool and for each question source (c2m's, Unsloth's).
- A difference is called a difference only when its interval excludes zero.

## Reported regardless

- Every score, interval, and paired difference above, for every pipeline and the floor.
- Each pipeline's median reply length in characters.
- The earlier single-split runs (Nov 3, 2026: 21 questions in 2 works). The c2m runs among them used an export
  made before c2m taught the RL task's short-answer instruction in its sft set.
- The c2m commit, whether its tree was clean, the export id, and the SHA-256 of every input file.
