# Research: Limitations and Negative Results

> **Status: experimental research, not shipped.** Nothing in this folder changes what the SkillSync npm package does. The package ships only the rule-based scanner.

Methods: [ARCHITECTURE_AND_METHODS.md](ARCHITECTURE_AND_METHODS.md). Results: [RESULTS.md](RESULTS.md).

## 1. Limits of the headline BP1 result

- **One synthetic generator.** Train, validation and test all come from the same author-built generator and share its templates. The test set holds out *scenarios*, not attack families or writing styles.
- **Strong template confound.** Before training, a phrase list built from train data alone classified about 85% of validation rows, with 100% accuracy on those rows. On test, that frozen phrase list caught 58.3% of attacks with no false alarms. BP1 beats it on recall, but part of what BP1 learned is probably the generator's wording.
- **Mild length confound.** Attack texts are slightly longer. A rule that only counts tokens reaches 85% recall, at a 65% false-alarm rate.
- **Small test set.** 10 scenarios and 120 benign texts. Confidence intervals are wide, and a low false-alarm rate cannot be certified. BP1's false-alarm rate on test (2.5%–5.0% per run) is above the 1-in-60 budget used to pick thresholds on validation.
- **Label quality.** Labels come from the dataset author: one person reviewed about 30%, with automated checks for the rest and no independent adjudication.
- **Context mix.** Half the rows are direct-user messages and only 12 are emails, so the data says little about content an agent reads from email, documents or tools.
- **The phrase-list baseline is adaptive.** Its rule family was chosen after seeing validation data, so it is a development baseline, not a pristine pre-specification.
- **Not evaluated:** real deployments, natural text, unseen attack families, adversarial adaptation, latency or model size in the shipped product.

## 2. Earlier experiments that did not pass

These were run before BP1 on different data. They are reported so the BP1 result is not read in isolation.

### Small multi-head model on mixed benchmark data

- **Setup:** a MiniLM-L6-v2-based model (about 22M parameters) with verdict, span and category outputs. It passed its development checks.
- **Frozen evaluation set:** 1,500 attack texts from public prompt-injection benchmarks (LLMail-Inject and SEP), plus 239 benign files: 160 benign LLMail-Inject emails, 75 content-bearing `.cursorrules` files and 4 Neo4j packages.
- **How it was scored:** a benign file counts as a false alarm if *any* section of the file is flagged (whole-file rule), not as one pooled classification. Recall and false-alarm figures are means over the training seeds.

| Model | Pooled attack recall (seed mean) | Benign-file false-alarm rate (seed mean, whole-file) |
|---|---|---|
| Small multi-head model | 37% | 44% |
| ProtectAI base model, unmodified | 8% | 0.8% |
| ProtectAI base model, fine-tuned on that benchmark data | 17% | 0.1% |

- The fine-tuned base model improved recall over the unmodified model by 9.4 points (95% CI 6.1 to 13.0).
- Its point estimate for false alarms was lower, but the interval crosses zero (−2.0 to +0.3 points), so the false-alarm comparison is **inconclusive**, not an improvement.
- The small model's 44% false-alarm rate on whole benign files makes it unusable as a gate.
- **Confounds:** the attack texts carry an email wrapper the benign files lack; the classes differ in length; and roughly a quarter of the LLMail-Inject labels we inspected were disputable.
- **Protocol notes:**
  - In one run the evaluation set was scored before the fine-tuned fits had finished. Those early scores were reported as uninspected and were not kept, but this was not independently verified. The evaluation should therefore not be read as a strict once-only, original-order evaluation.
  - A grouping key in the bootstrap was corrected to use benchmark subtasks rather than individual items.

### Context-insertion experiments

These tried to remove the wrapper and length shortcuts by inserting attack and benign content into matched contexts.

- **C1:** failed its pre-registered length gate. Length-only AUROC was 0.567, outside the required 0.45–0.55 band.
- **C1R (revised):** failed its primary semantic/generalisation gate when evaluated with the NotInject benign set.
- **CAL-R (recalibration):** failed its whole-calibration-set check.
- A review of the inserted "benign" content found many insertions that were incoherent or ambiguous rather than clearly benign, plus a shape shortcut. A follow-up semantic review was stopped before completion, and its partial output was not used.

No model from these experiments is claimed to work.

### Data sources not used

- **AgentDojo** was excluded as a held-out source because earlier experiments had already used it.
- **PromptShield** was considered as a second option but not used. Its upstream licences (including CC BY-NC components) need checking first.

## 3. What would be needed for a stronger claim

- Independently labelled data from natural agent contexts (email, documents, tool output), kept apart from all training and selection.
- Held-out attack families and writing styles, not just held-out scenarios.
- A much larger benign set, to estimate false-alarm rates at gate-relevant levels.
- Public training and evaluation code. See [REPRODUCTION.md](REPRODUCTION.md) for what is and isn't available today.
