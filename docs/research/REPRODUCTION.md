# Research: Reproduction

> **Status: experimental research, not shipped.** This page describes how to rebuild the BP1 experiment from public inputs. It is **not** a claim of full reproducibility. The training and evaluation code has not been published yet, and the trained checkpoints are not distributed.

## What is public

- **Data:** [Agentic Prompt-Injection Boundary Pairs](https://github.com/3nesdeniz/agentic-prompt-injection-boundary-pairs) at commit `30af820d093245ee2863e4b10a3efbfbddb4d3e1`, licensed CC BY 4.0. Split hashes are in [ARCHITECTURE_AND_METHODS.md](ARCHITECTURE_AND_METHODS.md#3-data).
- **Base model:** [`protectai/deberta-v3-base-prompt-injection-v2`](https://huggingface.co/protectai/deberta-v3-base-prompt-injection-v2) at revision `90c9989b1a342275dd0d1a95aad283c04e075671`. Weight, tokenizer and config hashes are in the same file.
- **Full recipe, threshold rule, baselines and evaluation protocol:** [ARCHITECTURE_AND_METHODS.md](ARCHITECTURE_AND_METHODS.md).
- **Results to compare against:** [RESULTS.md](RESULTS.md).

## What is not public (yet)

- The training, scoring and bootstrap code.
- The trained BP1 checkpoints. They are about 712 MB each and are kept offline.
- Per-row test scores.

## Steps to rebuild

1. Download the train and validation splits at the pinned commit, and verify their SHA-256 hashes. Do not open the test split until step 6.
2. Download the base model at the pinned revision, and verify the weight hash.
3. Fine-tune three runs (seeds 42, 43, 44) with the recipe table in [ARCHITECTURE_AND_METHODS.md §4](ARCHITECTURE_AND_METHODS.md#4-training-recipe). Use text only; do not feed metadata fields.
4. Score validation with each run and with the unmodified base model. Pick each threshold with the rule in §5 (at most 1 false alarm out of 60, maximise attacks caught, lowest threshold on ties).
5. Rebuild the two baselines exactly as specified in §5: the phrase list from train data only, and the length rule (32 or more tokens).
6. Download the test split once, verify its hash, then score all arms with the frozen thresholds.
7. Compute recall, false-alarm rate and AUROC. Then run a paired bootstrap over the 10 test scenarios: 1,000 resamples, `numpy.random.default_rng(20261103)`, 95% percentile intervals.

## Expected variation

- Training ran on Apple MPS in fp32, where kernels are not bit-deterministic. Reruns, and runs on other hardware, should land close to the reported numbers but not match them exactly.
- With only 120 benign test texts, a difference of one false alarm moves the rate by 0.8 points.
