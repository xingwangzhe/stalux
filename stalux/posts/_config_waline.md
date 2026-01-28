---
title: Waline 评论系统配置
tags:
  - 配置
  - 评论
  - Waline
categories:
  - 主题配置
date: 2025-5-10T14:00:00+8:00
updated: 2026-1-26T00:00:00+8:00
abbrlink: f4442947
---

## 概要

[Waline](https://waline.js.org/) 是默认集成的评论系统，本篇按当前 config.yml 的值重写，说明每个字段、常见修改和部署要点。

## 当前默认配置

```yaml title="config.yml"
comment:
  waline:
    serverURL: "https://walines.xingwangzhe.fun"
    lang: zh-CN
    # locale: # 可选，自定义语言配置
    login: "enable" # 'enable' | 'disable' | 'force'（开启强制登录可防止伪造）
    recaptchaV3Key: "" # 可选，配置 reCAPTCHA v3 网站 key 以启用验证码
    turnstileKey: "" # 可选，配置 Cloudflare Turnstile key 以启用验证码
    dark: true
    reaction: false
    meta:
      - nick
      - mail
      - link
    requiredMeta: []
    commentSorting: "latest"
    # imageUploader: # 可选，自定义图片上传函数
    # highlighter: # 可选，自定义代码高亮函数
    # texRenderer: # 可选，自定义 TeX 渲染函数
    # search: # 可选，自定义搜索功能
    wordLimit: 200
    pageSize: 10
```

## 字段说明

- `serverURL` (必填): Waline 服务端地址，需与部署环境协议一致（HTTPS 站点请使用 https）。
- `lang`: 界面语言，默认 `zh-CN`，可改为 `en-US` 等。
- `locale`: 可选，自定义语言配置对象，用于覆盖默认语言包。
- `login`: 登录模式，可选值 `'enable'`（默认，启用登录）、`'disable'`（禁用登录，用户只能填写信息评论）、`'force'`（强制登录，用户必须注册并登录才可发布评论，可防止伪造）。
- `recaptchaV3Key`: 可选，配置 Google reCAPTCHA v3 网站密钥以启用验证码功能。
- `turnstileKey`: 可选，配置 Cloudflare Turnstile 网站密钥以启用验证码功能。
- `dark`: 暗色模式适配，可设置为布尔值或 CSS 选择器（如 `'html[data-theme="dark"]'`）。
- `noCopyright`: 是否隐藏页脚版权信息，默认为 `false`。
- `emoji`: 表情包数组，支持多个源；默认使用微博表情包。
- `reaction`: 是否开启文章反应/点赞；默认关闭。
- `meta`: 需要收集的用户字段，默认 `nick`、`mail`、`link`。
- `requiredMeta`: 必填字段数组，可设置为 `['nick']` 或 `['nick', 'mail']` 等。
- `commentSorting`: 评论排序方式，可选 `'latest'`（最新）、`'oldest'`（最早）、`'hottest'`（最热）。
- `imageUploader`: 可选，自定义图片上传函数，用于处理图片上传逻辑。
- `highlighter`: 可选，自定义代码高亮函数，用于渲染代码块。
- `texRenderer`: 可选，自定义 TeX 渲染函数，用于渲染数学公式。
- `search`: 可选，自定义搜索功能配置，用于表情包搜索等。
- `wordLimit`: 单条评论字数上限，默认 200。
- `pageSize`: 每页评论数量，默认 10。

## 常见修改场景

- 更换域名或部署环境：仅更新 `serverURL`。
- 启用点赞/表情反应：将 `reaction` 设为 `true`。
- 增加表情包：在 `emoji` 数组追加新的远程地址。
- 启用强制登录防止伪造：将 `login` 设为 `"force"`。
- 添加验证码保护：配置 `recaptchaV3Key` 或 `turnstileKey`。
- 适配暗色主题：设置 `dark` 为 `'html[data-theme="dark"]'` 或类似选择器。
- 设置必填字段：将 `requiredMeta` 设为 `['nick']` 或 `['nick', 'mail']`。
- 自定义评论排序：将 `commentSorting` 设为 `'hottest'` 以按热度排序。
- 隐藏版权信息：将 `noCopyright` 设为 `true`。
- 自定义图片上传：提供 `imageUploader` 函数以实现自定义上传逻辑。
