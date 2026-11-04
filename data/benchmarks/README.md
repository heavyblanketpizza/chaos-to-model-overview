# Benchmark data

Every number in the charts and in [docs/benchmarks.md](../../docs/benchmarks.md), copied from the comparison harness's reports. Local paths were removed; nothing else was changed.

| File | Contents |
| --- | --- |
| [`headline.csv`](headline.csv) | The summary table, one measure per row |
| [`corpus.json`](corpus.json) | The 12 source files, with SHA-256, language and format |
| [`parsing.json`](parsing.json) | Extracted characters, Hangul, table rows, page-number lines, split words and replacement characters, per file and pipeline |
| [`datasets.json`](datasets.json) | QA and rephrase sets per pipeline |
| [`proxy-folds.json`](proxy-folds.json) | Cross-validated student scores, 95% intervals and paired differences under [protocol `c2m.folds/1`](../../docs/protocol/c2m.folds-1.md) |

In `proxy-folds.json`, `c2m_minus_other` is signed so that a positive value favours c2m on every score.
