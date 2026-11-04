# Proxy protocol: cross-validated by work, version 2

Version: `c2m.folds/2`. It amends [`c2m.folds/1`](PROTOCOL.md) after seed 0 had scored 15 of its 18 students,
all on one M3 Max. It was written and committed before any run under it. It changes when and where students
train, not what they measure. Both versions' results are reported.

## Unchanged

Everything `c2m.folds/1` fixes about the question, folds, training rows, student and settings, questions,
scores and estimates. A unit measured under version 1 is the same measurement under version 2, so its record
stands and is not run again.

## Changes

- **Where.** Seed 0 trains on the M3 Max, as all 15 of its students scored so far did. Seeds 1 and 2 may train
  on Linux with NVIDIA GPUs through MLX's CUDA backend, at the same mlx and mlx-lm versions as the Mac. Every
  unit records the host it ran on: operating system, machine, and GPU.
- **When.** Seeds 1 and 2 may run while seed 0 is still training. No score from seed 1 or 2 is read until
  seed 0 has finished every pipeline and fold. The primary result is still seed 0 alone.
- **In parallel.** A run may be restricted to some folds (`--folds`) as well as some seeds and pipelines, so
  units train side by side, each in its own process. The order units finish in changes nothing they measure.

## Reported in addition

- The host of every unit.
- Beside the robustness estimates over seeds 0, 1 and 2, the same estimates over seeds 1 and 2 alone, so a
  difference between hosts shows apart from a difference between seeds.
- That the floor (the untuned student) ran on the Mac only.
