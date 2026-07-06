---
title: hexo-next在文章下添加版权信息
abbrlink: 50aa0545
date: "2024-09-04 16:03:03"
updated: "2024-09-04 16:03:05"
desc: 在 Hexo Next 主题文章底部添加版权声明，配置 CC 协议署名与转载声明的完整教程。本文教你修改主题配置文件，实现文章自动显示版权信息
categories:
    - hexo
tags:
    - hexo
    - 记录
    - 教程
cover: https://i.ibb.co/tPDwBMwJ/cp1.png
---

![cp1](https://i.ibb.co/tPDwBMwJ/cp1.png)

<!--more-->

## 修改主题目录下的\_config.yml文件

`themes/next/_config.yml`

```yml
## Creative Commons 4.0 International License.
## See: https://creativecommons.org/share-your-work/licensing-types-examples
## Available values of license: by | by-nc | by-nc-nd | by-nc-sa | by-nd | by-sa | zero
## You can set a language value if you prefer a translated version of CC license, e.g. deed.zh
## CC licenses are available in 39 languages, you can find the specific and correct abbreviation you need on https://creativecommons.org
creative_commons:
    license: by-nc-sa
    sidebar: false
    post: true
    language:
```

post的值改为true表示文章开启添加版权信息。

## 单独设置文章版权

打开`themes/next/layout/_macro/post.swig`
找到creative_commons那一行改为：

```
{%- if theme.creative_commons.license and theme.creative_commons.post and page.copyright %}
  {{ partial('_partials/post/post-copyright.swig') }}
{%- endif %}
```

就是添加了 `page.copyright` ，这样就可以单独控制某篇文章是否添加版权信息了。

可以修改模板文件，这样默认就有 `copyright: true`

模板文件在`scaffolds/post.md`

## 参考

[hexo next主题给文章添加版权信息][1]

[1]: https://xq-120.github.io/2022/05/07/hexo-next%E4%B8%BB%E9%A2%98%E7%BB%99%E6%96%87%E7%AB%A0%E6%B7%BB%E5%8A%A0%E7%89%88%E6%9D%83%E4%BF%A1%E6%81%AF/#:~:text=next%E4%B8%BB%E9%A2%98%E4%B8%8B%E7%BB%99%E6%96%87%E7%AB%A0
