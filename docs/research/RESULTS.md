# Research: Results

> Experimental detector: 99.2% attack detection on Boundary Pairs synthetic test data, in each of three training runs (119/120 attacks each). Average benign false-alarm rate 3.9% (per-run 2.5%, 4.2%, 5.0%). 10 held-out scenarios from one synthetic generator; not evidence of real-world protection. Shipped rule-based scanner is separate.

Methods: [ARCHITECTURE_AND_METHODS.md](ARCHITECTURE_AND_METHODS.md). Limits: [LIMITATIONS_AND_NEGATIVE_RESULTS.md](LIMITATIONS_AND_NEGATIVE_RESULTS.md).

## Test set (240 texts: 120 attacks, 120 benign, 10 scenarios)

| Arm | Attacks caught | Recall | Benign false alarms | False-alarm rate | AUROC |
|---|---|---|---|---|---|
| P0: base model, unmodified | 31 / 120 | 25.8% | 4 / 120 | 3.3% | 0.719 |
| BP1 seed 42 | 119 / 120 | 99.2% | 3 / 120 | 2.5% | 0.999 |
| BP1 seed 43 | 119 / 120 | 99.2% | 5 / 120 | 4.2% | 0.999 |
| BP1 seed 44 | 119 / 120 | 99.2% | 6 / 120 | 5.0% | 0.999 |
| BP1, 3-run mean | | 99.2% | | 3.9% | |
| Phrase-list baseline (adaptive) | 70 / 120 | 58.3% | 0 / 120 | 0.0% | n/a |
| Length baseline (>= 32 tokens) | 102 / 120 | 85.0% | 78 / 120 | 65.0% | n/a |

All thresholds were fixed on validation data before the test set was read (validation false-alarm budget: at most 1 of 60).

## Paired scenario bootstrap

Differences use the BP1 3-run mean minus each comparison arm. The 95% intervals come from resampling the 10 test scenarios (1,000 resamples, seed 20261103).

| Comparison | Recall difference | 95% CI | False-alarm difference | 95% CI |
|---|---|---|---|---|
| BP1 vs. P0 | +73.3 pts | [+62.5, +84.2] | +0.6 pts | [-4.2, +8.4] |
| BP1 vs. phrase list | +40.8 pts | [+26.7, +56.7] | +3.9 pts | [0.0, +10.8] |
| BP1 vs. length | +14.2 pts | [+9.2, +18.3] | -61.1 pts | [-70.3, -52.5] |
| P0 vs. phrase list | -32.5 pts | [-49.2, -13.3] | +3.3 pts | [+0.8, +5.8] |

Reading:

- BP1 catches far more attacks than the base model, at a similar false-alarm rate. The false-alarm difference is inconclusive.
- BP1 beats both shortcut baselines on recall, but it raises more false alarms than the phrase list.
- With only 10 scenarios and 120 benign texts, all intervals are wide and unstable. A low false-alarm rate cannot be certified.

## Per attack family (attacks caught, of 10 each)

| Family | P0 | BP1 s42 | BP1 s43 | BP1 s44 | Phrase list | Length |
|---|---|---|---|---|---|---|
| approval_workflow_bypass | 0 | 10 | 10 | 10 | 4 | 10 |
| authority_claim_bypass | 2 | 10 | 10 | 10 | 8 | 10 |
| direct_instruction_override | 4 | 10 | 10 | 10 | 7 | 9 |
| indirect_content_injection | 2 | 10 | 10 | 10 | 5 | 9 |
| memory_context_poisoning | 1 | 10 | 10 | 10 | 5 | 10 |
| multi_agent_trust_spoofing | 3 | 10 | 10 | 10 | 5 | 7 |
| obfuscation_encoding | 8 | 10 | 10 | 10 | 8 | 10 |
| rag_context_poisoning | 2 | 10 | 10 | 10 | 6 | 10 |
| roleplay_jailbreak | 2 | 10 | 10 | 10 | 5 | 10 |
| sensitive_data_exfiltration | 2 | 10 | 10 | 10 | 5 | 3 |
| system_prompt_extraction | 4 | 10 | 10 | 10 | 8 | 4 |
| tool_action_abuse | 1 | 9 | 9 | 9 | 4 | 10 |

The family names are the dataset author's labels. They are used only for grouping, after scoring. Every family also appears in the training data.

## What this does and does not show

- **Shows:** fine-tuning the same base model on this source teaches it to separate boundary-crossing from boundary-preserving texts on held-out scenarios *from the same synthetic generator*, far better than the unmodified model.
- **Does not show:**
  - real-world protection or production accuracy;
  - transfer to natural emails, documents or tool outputs;
  - detection of unseen attack families;
  - semantic understanding beyond this generator's templates.
- The shipped SkillSync scanner is a separate rule-based system and was not evaluated here.
