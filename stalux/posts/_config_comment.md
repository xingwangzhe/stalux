---
title: Waline Comment System Configuration
tags:
    - Configuration
    - Comments
    - Waline
categories:
    - Theme Config
date: "2025-05-10 16:00:00"
updated: "2026-07-22 00:00:00"
desc: Comment system configuration from comment.yml — enable/disable toggle and Waline integration settings.
abbrlink: f4442947
---

## comment.yml — Comment System

File: `stalux/config/comment.yml`

```yaml
id: comment
enabled: false # Master switch: enable comments site-wide
waline:
    serverURL: https://walines.xingwangzhe.fun # Waline server address
    lang: zh-CN # Waline UI language
    login: "force" # "enable" | "disable" | "force"
    dark: true # Dark mode support
    reaction: false # Reaction feature
    meta: [nick, mail, link] # Required user fields
    requiredMeta: [] # Mandatory fields
    commentSorting: "latest" # "latest" | "oldest" | "hottest"
    wordLimit: 200 # Max comment length
    pageSize: 10 # Comments per page
    recaptchaV3Key: "" # reCAPTCHA v3 site key
    turnstileKey: "" # Cloudflare Turnstile key
```

### Key Fields

| Field                 | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| `enabled`             | Global toggle. Set to `true` to enable comments on all pages                        |
| `waline.serverURL`    | **Required** for Waline to work. Points to your Waline server                       |
| `waline.login`        | `"enable"` — allow anyone; `"force"` — require login; `"disable"` — no login needed |
| `waline.meta`         | User info fields collected from commenters                                          |
| `waline.requiredMeta` | Fields that must be filled in (subset of `meta`)                                    |

### Getting Started

1. Deploy a Waline server (see [Waline docs](https://waline.js.org/))
2. Set `enabled: true` and fill in `waline.serverURL`
3. Adjust other settings as needed
4. Test by leaving a comment on any post

### Common Modifications

| Operation              | How                                                            |
| ---------------------- | -------------------------------------------------------------- |
| Toggle comments on/off | Change `enabled`                                               |
| Switch Waline server   | Update `serverURL`                                             |
| Enable anti-spam       | Set `recaptchaV3Key` or `turnstileKey`                         |
| Change sort order      | Set `commentSorting` to `"latest"`, `"oldest"`, or `"hottest"` |
