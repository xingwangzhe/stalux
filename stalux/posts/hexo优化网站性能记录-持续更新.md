---
title: hexo优化网站性能记录-持续更新
abbrlink: 9f6ebe30
date: 2024-10-15 14:36:06+00:00
updated: '2024-10-15 14:36:08'
categories:
- hexo
tags:
- 记录
- HTML
- CSS
- js
- '404'
---

![2024-10-15-135544](https://i.ibb.co/sQqSRzh/2024-10-15-135544.png)
*优化前的效果:(*
<!--more-->

## 使用插件[hexo-all-minifier](https://github.com/chenzhutian/hexo-all-minifier.git)

如果你访问github有困难，可以访问此镜像库[hexo-all-minifier](https://gitcode.com/gh_mirrors/he/hexo-all-minifier/overview)

>这里我选择静默的原因是因为这些插件的输出日志影响hexon的加载

```yml
all_minifier: true

js_concator:
  enable: true
  bundle_path: '/js/bundle.js'
  front: false
  silent: true

html_minifier:
  enable: true
  ignore_error: false
  silent: true
  exclude:

css_minifier:
  enable: true
  silent: true
  exclude: 
    - '*.min.css'

js_minifier:
  enable: true
  mangle: true
  silent: true
  output:
  compress:
  exclude: 
    - '*.min.js'

image_minifier:
  enable: true
  interlaced: false
  multipass: false
  optimizationLevel: 2
  pngquant: false
  progressive: false
  silent: true
```
这个是优化后的效果
[![2024-10-15-143007](https://i.ibb.co/sR8QYqD/2024-10-15-143007.png)](https://ibb.co/JtD2JHb)

爆赞！
