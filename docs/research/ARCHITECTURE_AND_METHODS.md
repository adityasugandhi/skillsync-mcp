# Research: Architecture and Methods

> **Status: experimental research, not shipped.** The SkillSync npm package contains only the rule-based scanner (101 regex patterns). The detector described here is not in the package, is not downloaded at install time, and is not used by the install gate.

Summary result: see [RESULTS.md](RESULTS.md). Limits and negative results: see [LIMITATIONS_AND_NEGATIVE_RESULTS.md](LIMITATIONS_AND_NEGATIVE_RESULTS.md).

## 1. Shipped product vs. research

| | Shipped (`@stranzwersweb2/skillsync-mcp` 1.4.1) | Research (this folder) |
|---|---|---|
| Detector | Deterministic regex scanner: 101 patterns (47 critical, 3 critical multi-line, 51 warning) in 19 categories | Fine-tuned DeBERTa-v3-base text classifier ("BP1") |
| ML model | None | ~184M-parameter transformer, trained offline |
| Install gate | Blocks critical pattern matches; medium/high needs `force` | Not connected |
| Search | Third-party SkillsMP API (SkillsMP states it uses Cloudflare AI) | n/a |

An earlier research track used a small MiniLM-based model with verdict, span and category outputs. It is a separate model and is not described by the BP1 numbers below.

## 2. Model

- Base: [`protectai/deberta-v3-base-prompt-injection-v2`](https://huggingface.co/protectai/deberta-v3-base-prompt-injection-v2), revision `90c9989b1a342275dd0d1a95aad283c04e075671`.
  - Weights `model.safetensors`: 737,719,272 bytes, SHA-256 `6521cb8d0ac08148c81464899c424e6148fcc62befa371089fa4061d8b6e0424`.
  - `tokenizer.json` SHA-256 `f0a66ad0d735d8dca9ecac4ff50fcdef4bb6adbadd2941a926844844d2c2059b`; `config.json` SHA-256 `05079f4735092040b780d459027afab413faa6eeb66a548571a58832304b60bb`.
- Architecture: the existing DeBERTa-v3-base sequence classifier with labels 0 = SAFE, 1 = INJECTION. No new architecture or head was added; all weights are fine-tuned.
- Score: `logit(INJECTION) - logit(SAFE)`; a text is flagged when the score is at or above a threshold chosen on validation data.
- Comparison arm "P0": the same base model, unmodified, with its own validation-chosen threshold.

## 3. Data

- Source: **Agentic Prompt-Injection Boundary Pairs** by GitHub user `3nesdeniz` ([repository](https://github.com/3nesdeniz/agentic-prompt-injection-boundary-pairs)), commit `30af820d093245ee2863e4b10a3efbfbddb4d3e1` (Hugging Face revision `a5682e7573e1c7bc4b12e64d49c0dcd90ca776cf`). Licence: CC BY 4.0. We do not redistribute the corpus.
- Content: short synthetic texts. Each pair contains one text that preserves an intended authorization or trust boundary (label 0) and one that attempts to cross it (label 1). The author describes the data as synthetic and curated, with a single-author review of a stratified sample (about 30%) and automated checks for the rest; there is no independent adjudication.

| Split | File SHA-256 | Rows | Label 1 / 0 | Pairs | Scenarios |
|---|---|---|---|---|---|
| Train | `98fc7ea70a45215ba50d21efcd79cfed33afcbc1ac95d0fc388066b42cea2238` | 840 | 420 / 420 | 420 | 35 |
| Validation | `1e5f483277ca776f0bb7d26c1a85ca4cd6d73f8d30f638c75265d82a6de751c3` | 120 | 60 / 60 | 60 | 5 |
| Test | `034523eefaec18c291f9daa7699037acb0e7a91b1aeb1b205878b124f6e18f10` | 240 | 120 / 120 | 120 | 10 |

### Pre-training checks (train and validation only; test not read)

- File hashes matched the repository's checksum manifest. No schema violations or missing fields.
- No exact or normalised duplicate texts within or between train and validation. No pair or scenario overlap between train and validation. (The test split was checked separately, after training; see §6.)
- Length: the longest text is 150 tokens, so nothing is truncated at 512 tokens. Attack texts are slightly longer. Token-length AUROC was 0.578 (train) and 0.611 (validation), and a fixed length rule reached 0.62 balanced accuracy on validation.
- Wording: many word pairs occur in only one class. A phrase list built from train alone classified about 85% of validation rows, with 100% accuracy on those rows. This is a strong template confound.
- Source context (e.g. direct user, retrieved document, tool request) is balanced within every pair, so it carries no label signal. Half the rows are direct-user messages and only 12 are emails.
- Input: text only. Metadata fields (attack family, category, expected action, source context, IDs) were never used as model or baseline input; three of them are equivalent to the label.

## 4. Training recipe

The recipe was fixed and recorded before the first optimizer step.

| Setting | Value |
|---|---|
| Seeds | 42, 43, 44 (all reported; no best-seed selection, no early stopping) |
| Epochs | 3 (159 optimizer steps) |
| Optimizer | AdamW, learning rate 2e-5, weight decay 0.01 (all parameters), default betas/eps, no gradient clipping |
| Schedule | linear warm-up for 9 steps (`int(0.06 * 159)`), then linear decay to 0 |
| Batch | micro-batch 4, gradient accumulation 4 (effective 16). Each epoch has 210 micro-batches, i.e. 52 full accumulation groups plus a final partial group of 2 micro-batches, giving 53 optimizer steps per epoch (159 total) |
| Loss | binary cross-entropy with logits on `logit1 - logit0`, positive weight 1.0 (balanced classes) |
| Max length | 512 tokens, truncation on, dynamic padding |
| Data order | per-epoch shuffle from a generator seeded with `seed + epoch` |
| Hardware | Apple MPS, fp32. MPS kernels are not bit-deterministic, so exact reruns may differ slightly |

After each run, the checkpoint was saved with a SHA-256 manifest, reloaded from disk, and checked to give identical scores on 16 validation texts (maximum difference 0.0 for all three runs).

## 5. Thresholds and baselines

Thresholds were chosen per model on **validation data only**:

1. Candidate thresholds are the observed validation scores; a text is flagged if `score >= t`.
2. Feasible thresholds allow at most `floor(0.02 * 60) = 1` benign false alarm out of 60.
3. Choose the threshold that catches the most attacks; break ties with the lowest threshold.
4. Use the midpoint to the next-lower observed score when it gives identical decisions; if nothing is feasible, flag nothing.

| Model | Validation threshold | Attacks caught (of 60) | False alarms (of 60) |
|---|---|---|---|
| P0 (base) | 14.985377311706543 | 10 | 1 |
| BP1 seed 42 | -2.541528105735779 | 60 | 1 |
| BP1 seed 43 | -2.8378076553344727 | 60 | 1 |
| BP1 seed 44 | -2.841301918029785 | 60 | 1 |

Two non-learned baselines were frozen before the test set was read:

- **Phrase list ("bigram k10")**:
  - Lower-case the text and split it into runs of ASCII letters.
  - Collect the set of consecutive word pairs.
  - A word pair is an attack phrase if it occurs in at least 10 train attack rows and no train benign rows; benign phrases are defined the other way round. This gives 62 attack phrases and 96 benign phrases.
  - Flag a text if it contains an attack phrase and no benign phrase; conflicting or uncovered texts are not flagged.
  - **Adaptive:** this rule family was chosen after the validation diagnostic, where it scored 47/60 attacks with 0 false alarms. It is a development baseline, not a pristine pre-specification.
- **Length**: flag a text if it has 32 or more tokens under the base tokenizer, counting special tokens with no truncation. This rule came from the pre-training diagnostic.

## 6. Evaluation protocol

- The test file was fetched once, after all three runs, checkpoint verification and threshold freezing. Before any scoring, the hash was verified and these checks passed:
  - 240 rows (120/120) in 120 valid pairs;
  - 10 scenarios, with no scenario or pair overlap with train or validation;
  - no exact duplicates;
  - every attack family in the test split also appears in train, so this is not an unseen-family test.
- Arms: P0, the three BP1 runs (also reported as a 3-run mean), and both baselines.
- Primary metrics are attack detection (recall) and the benign false-alarm rate, reported together. Secondary metrics are per-family recall, per-scenario counts, and AUROC of the continuous scores.
- Uncertainty comes from a paired bootstrap over the 10 test scenarios: 1,000 resamples, `numpy.random.default_rng(20261103)`, 95% percentile intervals.
- No test-based tuning, and no rescoring of older evaluation sets for model selection.

Results: [RESULTS.md](RESULTS.md).
