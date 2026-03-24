---
title: 抓取个人博客文章目录到github主页
abbrlink: 10908
date: 2024-11-11 19:51:52
updated: 2025-07-04 18:44:32
categories:
    - github
tags:
    - 学习
    - 记录
    - 教程
---

![2024-11-11-194849](https://i.ibb.co/9tk9ZCR/2024-11-11-194849.png)

_如图所见，我在我的github主页上加了我的最近的个人博客的文章_

## 所用项目

[gautamkrishnar/blog-post-workflow: Show your latest blog posts from any sources or StackOverflow activity or Youtube Videos on your GitHub profile/project readme automatically using the RSS feed](https://github.com/gautamkrishnar/blog-post-workflow)

<!--more-->

## 创建`blog-post-workflow.yml`

具体的路径应该是`.github/workflows/blog-post-workfliw.yml`

复制粘贴

```yml
## This is a basic workflow to help you get started with Actions

name: Latest blog post workflow

## Controls when the workflow will run
on:
    # Triggers the workflow on push or pull request events but only for the main branch
    #   push:
    #     branches: [ main ]
    #   pull_request:
    #     branches: [ main ]
    schedule: # Run workflow automatically
        - cron: "0 3 * * *" # Runs at 3:00 # 定时任务，每天3：00触发

    # Allows you to run this workflow manually from the Actions tab
    workflow_dispatch:

## A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
    # This workflow contains a single job called "build"
    update-readme-with-blog:
        name: Update README with latest blog posts
        # The type of runner that the job will run on
        runs-on: ubuntu-latest

        # Steps represent a sequence of tasks that will be executed as part of the job
        steps:
            # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
            - name: Checkout
              uses: actions/checkout@v2

            # Runs a single command using the runners shell
            - name: Update posts
              uses: gautamkrishnar/blog-post-workflow@master
              with:
                  feed_list: "https://xingwangzhe.fun/atom.xml" #这里应该替换成自己的rss地址
                  max_post_count: 7 # 顾名思义，最大文章数。
```

## 添加关键词

在你的主页的readme里面添加

```html
<!-- BLOG-POST-LIST:START -->
<!-- BLOG-POST-LIST:END -->
```

## 给予编辑权限

在你主页仓库的`settings`里，打开`Actions`设置，选择`general`,然后选中第一个。并点击`save`保存设置。

![2024-11-11-200456](https://i.ibb.co/hKb9tyM/2024-11-11-200456.png)

## 触发流程

然后在`Actions`选择触发`Run workflow`

![2024-11-11-200147](https://i.ibb.co/Jjm8L4q/2024-11-11-200147.png)

然后静待结束，就大功告成了！

当然这个还有更多的参数使用，不过我懒得弄：），怎么方便怎么来吧：）

## 参考

[利用GitHub Actions自动获取博客rss文章 | 二丫讲梵](https://wiki.eryajf.net/pages/1b1ba3/#%E5%89%8D%E8%A8%80)
[gautamkrishnar/blog-post-workflow: Show your latest blog posts from any sources or StackOverflow activity or Youtube Videos on your GitHub profile/project readme automatically using the RSS feed](https://github.com/gautamkrishnar/blog-post-workflow)
