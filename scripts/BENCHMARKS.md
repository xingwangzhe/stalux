# Stalux performance benchmarks

Use disposable physical copies of a consumer and the same Node 26 executable, Bun version, lockfile, content and configuration for the baseline and candidate. Keep raw reports outside Git. Copy the packed Stalux package into the candidate's `node_modules/@xingwangzhe/stalux`; do not symlink the theme.

```sh
bun run benchmark:builds /absolute/consumer-copy /absolute/report-directory --node /absolute/node26/bin/node
bun run benchmark:performance /absolute/theme-checkout /absolute/micro.json
```

The build driver refuses a project containing `.git`. It clears only the copy's build caches, measures three cold/warm/single-post cycles with GNU time, and records wall time, user/system CPU time, peak RSS, Astro restores, HTML-cache hits and stage logs. Every build checks that the static homepage Agent summary is present, accessible and visually clipped.

A single-post case selects a published Markdown file through Bun's YAML parser, changes its body and `updated` timestamp deterministically, and asserts that the new visible paragraph reaches its generated HTML. The original source bytes are restored even on failure. `STALUX_BENCHMARK_DATE` can pin the synthetic date across comparisons.

- `--cold-only --rounds 1` repeats a suspected cold-build regression.
- `--edit-only` starts with one warm-up and measures three successive revisions of the same article, without clearing the existing caches. Warm-up data is labeled separately.
- Run baseline and candidate serially. Alternate them when investigating regressions; never run Lighthouse alongside a build benchmark.

The microbenchmark warms each case five times and takes fifteen timed samples. It covers 1,000/5,000/20,000 posts and byte offsets, increasing DOM/text sizes, increasing unique glyph sets, exact ID lookups and timezone formatting. An optional fourth argument filters case names:

```sh
bun run benchmark:performance /absolute/theme-checkout /absolute/font.json font-
```

Font cases warm the native subset cache to separate character extraction from WOFF2 generation. The UTF-8 offset baseline reproduces the original prefix-decoding algorithm when the old checkout lacks the new helper. Template compaction deliberately uses sizes that the existing Astro compiler can parse; one shared compiler instance is warmed and reused as in a real build. Report end-to-end compaction separately from the isolated offset algorithm.

Microbenchmark RSS and heap fields are sample-end snapshots, not per-operation peak memory. GNU time reports maximum resident set size, not the sum of concurrently resident child processes. Keep these measurements distinct, publish ranges with medians, and do not infer real-user INP from Lighthouse TBT.
