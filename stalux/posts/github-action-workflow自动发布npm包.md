---
title: github:action/workflow自动发布npm包
abbrlink: 5561
date: "2025-01-06 20:03:44"
updated: "2025-07-04 18:44:32"
desc: github action/workflow进行npm自动发包，并自动更新版本号
categories:
    - github
tags:
    - 学习
    - 记录
    - 教程
---

本文介绍
github action/workflow进行npm自动发包，并自动更新版本号

<!--more-->

## 获取token

## 获取token

[npm | Create New Access Token](https://www.npmjs.com/)

![2025-01-06-195821](https://i.ibb.co/zf5kWKG/2025-01-06-195821.png)

> **Warning**
>
> 请及时复制粘贴，并且不要泄露给他人

## 设置对应仓库的secerts

命名为`NPM_TOKEN`

![2025-01-06-201302](https://i.ibb.co/nfQ7jfV/2025-01-06-201302.png)

## 直接复制粘贴代码

```yml
name: Auto Publish to NPM

on:
    push:
        branches:
            - main

jobs:
    publish:
        runs-on: ubuntu-latest
        if: github.ref == 'refs/heads/main'
        permissions:
            contents: write
            packages: write

        steps:
            - uses: actions/checkout@v3
              with:
                  fetch-depth: 0
                  token: ${{ secrets.GITHUB_TOKEN }}

            - name: Git Configuration
              run: |
                  git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
                  git config --global user.name "GitHub Actions[bot]"

            - uses: actions/setup-node@v3
              with:
                  node-version: "20"
                  registry-url: https://registry.npmjs.org/

            - name: Install dependencies
              run: npm ci || npm install

            - name: Get commit message
              id: commit
              run: |
                  # 获取最后一次提交信息并处理多行信息
                  FULL_MSG=$(git log -1 --pretty=format:"%B")
                  echo "message<<EOF" >> $GITHUB_OUTPUT
                  echo "$FULL_MSG" >> $GITHUB_OUTPUT
                  echo "EOF" >> $GITHUB_OUTPUT

            - name: Determine version bump
              id: version
              if: github.ref == 'refs/heads/main'
              run: |
                  MESSAGE="${{ steps.commit.outputs.message }}"
                  # 检查提交信息中的关键字
                  if [[ $MESSAGE =\x7e "BREAKING CHANGE:" ]] || [[ $MESSAGE =~ "!" ]]; then
                    echo "type=major" >> $GITHUB_OUTPUT
                    echo "Found major change trigger in commit message"
                  elif [[ $MESSAGE =~ ^feat:.*$ ]] || [[ $MESSAGE =~ ^feature:.*$ ]]; then
                    echo "type=minor" >> $GITHUB_OUTPUT
                    echo "Found minor change trigger in commit message"
                  else
                    echo "type=patch" >> $GITHUB_OUTPUT
                    echo "Default to patch version"
                  fi

            - name: Automated Version Bump
              uses: "phips28/gh-action-bump-version@master"
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
              with:
                  version-type: ${{ steps.version.outputs.type }}
                  commit-message: "CI: bumps version to {{version}} [skip ci]"

            - name: Publish to NPM
              run: npm publish --access public
              env:
                  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 提交信息格式

```
例如:
- `feat: 添加新功能` -> 次版本号+1 (1.0.0 → 1.1.0)
- `fix: 修复bug` -> 修订号+1 (1.1.0 → 1.1.1)
- `BREAKING CHANGE: 重构API` -> 主版本号+1 (1.1.1 → 2.0.0)
- `feat!: 不兼容的新功能` -> 主版本号+1 (2.0.0 → 3.0.0)
- `docs: 更新文档` -> 修订号+1 (3.0.0 → 3.0.1)
- `refactor: 代码重构` -> 修订号+1 (3.0.1 → 3.0.2)
- `style: 调整样式` -> 修订号+1 (3.0.2 → 3.0.3)
```
