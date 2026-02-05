---
title: 制作github贪吃蛇贡献图
abbrlink: 16664
date: 2024-11-11 09:19:33+00:00
updated: "2025-07-04T18:44:32.352+08:00"
categories:
  - github
tags:
  - 学习
  - 记录
  - 教程
  - 前端
  - HTML
  - github
---

![蛇图](https://raw.githubusercontent.com/xingwangzhe/xingwangzhe/29ce52882c33be28a727b27630e8a4e9227e273f/github-snake.svg)

_如图所示，非常有趣：）_

[xingwangzhe/xingwangzhe: My personal repository](https://github.com/xingwangzhe/xingwangzhe)

_你可以查看我的主页仓库来看具体效果：）_

<!--more-->

## 创建workflow

在你的主页目录下建立

`.github/workflows/snake.yml`

![2024-11-11-092848](https://i.ibb.co/6nqrxx8/2024-11-11-092848.png)

接下来你需要复制我仓库中的snake.yml中的代码，方便起见，我直接贴在下面

```yml
name: Generate snake animation

on:
  schedule:
    - cron: "0 0 * * *" # run daily at mignight UTC

  workflow_dispatch:

  push:
    branches:
      - main

jobs:
  generate:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: generate snake.svg
        uses: Platane/snk@v3
        with:
          # github user name to read the contribution graph from (**required**)
          # using action context var `github.repository_owner` or specified user
          github_user_name: ${{ github.repository_owner }}

          # list of files to generate.
          # one file per line. Each output can be customized with options as query string.
          #
          #  supported options:
          #  - palette:     A preset of color, one of [github, github-dark, github-light]
          #  - color_snake: Color of the snake
          #  - color_dots:  Coma separated list of dots color.
          #                 The first one is 0 contribution, then it goes from the low contribution to the highest.
          #                 Exactly 5 colors are expected.
          outputs: |
            dist/github-snake.svg
            dist/github-snake-dark.svg?palette=github-dark
            dist/ocean.gif?color_snake=orange&color_dots=#bfd6f6,#8dbdff,#64a1f4,#4b91f1,#3c7dd9

      - name: Deploy to GitHub Pages
        uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

然后点击上部导航栏的`Actions`查看snake.yml的状态，创建完毕后，会出现新的分支`output`。打开这个分支

![2024-11-11-093349](https://i.ibb.co/023kFFm/2024-11-11-093349.png)

你就会发现贪吃蛇的图了

## 引用使用

> 你需要把下面的路径中的[`xingwangzhe`](https://github.com/xingwangzhe)换成自己的github用户名

```html
<!-- snake -->
<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://github.com/xingwangzhe/xingwangzhe/blob/output/github-snake-dark.svg"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="https://github.com/xingwangzhe/xingwangzhe/blob/output/github-snake.svg"
  />
  ![github-snake](github-snake.svg)
</picture>
```

于是乎，**大功告成！**

## 参考

[【教程】我在GitHub个人主页玩贪吃蛇\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV17nDsYPE1g/?vd_source=15276cfc65b1ac8fad46ad8f5ed33307)
