---
title: Waline Comment System Configuration
tags:
    - Configuration
    - Comments
    - Waline
categories:
    - Theme Config
date: "2025-05-10 14:00:00"
updated: "2026-01-26 00:00:00"
desc: Waline is the default integrated comment system. This article is rewritten according to the current config.yml values, explaining each field, common modifications, and deployment points.
abbrlink: f4442947
---

## Overview

[Waline](https://waline.js.org/) is the default integrated comment system. This article is rewritten according to the current config.yml values, explaining each field, common modifications, and deployment points.

## Current Default Configuration

```yaml title="config.yml"
comment:
    enabled: false
    waline:
        serverURL: "https://walines.xingwangzhe.fun"
        lang: en-US
        # locale: # Optional, custom language configuration
        login: "enable" # 'enable' | 'disable' | 'force' (enabling force login prevents impersonation)
        recaptchaV3Key: "" # Optional, configure reCAPTCHA v3 site key to enable captcha
        turnstileKey: "" # Optional, configure Cloudflare Turnstile key to enable captcha
        dark: true
        reaction: false
        meta:
            - nick
            - mail
            - link
        requiredMeta: []
        commentSorting: "latest"
        # imageUploader: # Optional, custom image upload function
        # highlighter: # Optional, custom code highlighting function
        # texRenderer: # Optional, custom TeX rendering function
        # search: # Optional, custom search functionality
        wordLimit: 200
        pageSize: 10
```

## Field Descriptions

- `serverURL` (required): Waline server address, must match the deployment environment protocol (use https for HTTPS sites).
- `comment.enabled`: Site-wide comment toggle; set to `true` to render the comment section based on `comment.waline`; default `false`.
- `lang`: Interface language, default `zh-CN`, can be changed to `en-US`, etc.
- `locale`: Optional, custom language configuration object for overriding the default language pack.
- `login`: Login mode, optional values: `'enable'` (default, login enabled), `'disable'` (login disabled, users can only fill in info to comment), `'force'` (force login, users must register and log in to post comments, prevents impersonation).
- `recaptchaV3Key`: Optional, configure Google reCAPTCHA v3 site key to enable captcha functionality.
- `turnstileKey`: Optional, configure Cloudflare Turnstile site key to enable captcha functionality.
- `dark`: Dark mode adaptation, can be set to a boolean or a CSS selector (e.g., `'html[data-theme="dark"]'`).
- `noCopyright`: Whether to hide the footer copyright info, default `false`.
- `emoji`: Emoji pack array, supports multiple sources; uses Weibo emoji pack by default.
- `reaction`: Whether to enable post reactions/likes; disabled by default.
- `meta`: User fields to collect, default `nick`, `mail`, `link`.
- `requiredMeta`: Array of required fields, can be set to `['nick']` or `['nick', 'mail']`, etc.
- `commentSorting`: Comment sorting method, options: `'latest'`, `'oldest'`, `'hottest'`.
- `imageUploader`: Optional, custom image upload function for handling image upload logic.
- `highlighter`: Optional, custom code highlighting function for rendering code blocks.
- `texRenderer`: Optional, custom TeX rendering function for rendering math formulas.
- `search`: Optional, custom search function configuration for emoji pack search, etc.
- `wordLimit`: Maximum characters per comment, default 200.
- `pageSize`: Number of comments per page, default 10.

## Common Modification Scenarios

- Change domain or deployment environment: Only update `serverURL`.
- Enable likes/emoji reactions: Set `reaction` to `true`.
- Add more emoji packs: Append new remote addresses to the `emoji` array.
- Enable force login to prevent impersonation: Set `login` to `"force"`.
- Add captcha protection: Configure `recaptchaV3Key` or `turnstileKey`.
- Adapt to dark theme: Set `dark` to `'html[data-theme="dark"]'` or a similar selector.
- Set required fields: Set `requiredMeta` to `['nick']` or `['nick', 'mail']`.
- Customize comment sorting: Set `commentSorting` to `'hottest'` to sort by popularity.
- Hide copyright info: Set `noCopyright` to `true`.
- Custom image upload: Provide an `imageUploader` function to implement custom upload logic.
