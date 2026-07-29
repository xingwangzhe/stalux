---
title: About
description: About the Stalux blog theme
---

## 👋 About Stalux

**Stalux** — a modern, high-performance [Astro](https://astro.build) blog theme designed for content creators who value both aesthetics and efficiency. Developed by **xingwangzhe**, the name blends "Static" and "Luxury," reflecting the goal of delivering a premium writing and reading experience with static-site speed.

## ✨ Design Philosophy

*"Simple, but not simplistic; beautiful, but not flashy."*

Stalux features a dark-themed design with elegant glassmorphism aesthetics. Subtle tiled background patterns add visual depth without distracting from the content. Every element is crafted to keep the focus where it belongs — your writing.

## 🔤 Font Optimization

Built with a 25 MB Chinese font (LXGW WenKai), but your visitors never download the full file. The build system automatically generates per-route font subsets:

- **Common subset** (~350 KB) — shared characters loaded on every page
- **Per-route subset** (~0.5–3 KB each) — unique characters per article

Each page downloads only the characters it needs.

## 🚀 How to Use

**Dual-mode:** Use as a source template or install as an npm package.

```bash
# Plugin mode (recommended)
bun create astro
bun add @xingwangzhe/stalux
bunx stalux init
```

```bash
# Template mode
git clone https://github.com/xingwangzhe/stalux.git
bun install && bun run dev
```

All configuration is done through YAML files under `stalux/config/` — no coding required.

## 🔗 Links

- [GitHub Repository](https://github.com/xingwangzhe/stalux)
- [Live Demo](https://stalux.needhelp.icu)
- [npm Package](https://www.npmjs.com/package/@xingwangzhe/stalux)

## 📄 License

MIT License — free to use, modify, and distribute.
