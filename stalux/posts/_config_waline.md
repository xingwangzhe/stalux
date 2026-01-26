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

Waline 是默认集成的评论系统，本篇按当前 config.yml 的值重写，说明每个字段、常见修改和部署要点。

## 当前默认配置

```yaml title="config.yml"
comment:
  waline:
    serverURL: "https://walines.xingwangzhe.fun"
    lang: zh-CN
    emoji:
      - "https://unpkg.com/@waline/emojis@1.1.0/weibo"
    reaction: false
    meta:
      - nick
      - mail
      - link
    wordLimit: 200
    pageSize: 10
```

## 字段说明

- `serverURL` (必填): Waline 服务端地址，需与部署环境协议一致（HTTPS 站点请使用 https）。
- `lang`: 界面语言，默认 `zh-CN`，可改为 `en-US` 等。
- `emoji`: 表情包数组，支持多个源；默认使用微博表情包。
- `reaction`: 是否开启文章反应/点赞；默认关闭。
- `meta`: 需要收集的用户字段，默认 `nick`、`mail`、`link`。
- `wordLimit`: 单条评论字数上限，默认 200。
- `pageSize`: 每页评论数量，默认 10。

## 常见修改场景

- 更换域名或部署环境：仅更新 `serverURL`。
- 启用点赞/表情反应：将 `reaction` 设为 `true`。
- 增加表情包：在 `emoji` 数组追加新的远程地址。
- 修改收集字段：按需调整 `meta` 列表（如去掉 `mail` 仅保留 `nick`）。
- 放宽限制：提高 `wordLimit` 或 `pageSize` 以适应长评论或更多分页条数。
