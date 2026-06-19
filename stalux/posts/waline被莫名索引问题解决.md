---
title: Waline被莫名索引问题解决
abbrlink: f654ae55
date: "2025-07-04 18:44:32"
updated: "2025-07-04 18:44:32"
desc: "- fix: route to robots.txt"
categories:
    - 前端
tags:
    - 记录
    - 教程
    - 胡思乱想
---

:::tip

我今天交的两个 **PR** 解决这个问题：

- [fix: route to robots.txt](https://github.com/walinejs/waline/pull/3125)
- [fix: static for robots.txt](https://github.com/walinejs/waline/pull/3126)

详情可以直接查看，这样可以省去阅读此文的冗余。

:::

## Waline 首页被莫名索引

很多人应该都用过 **Waline**，Waline 前端需要配置域名，大部分人都是 `waline.example.com`，但是我搜索我站点时，发现 Waline 首页莫名其妙被索引了。

之前的官方库里有静态文件 `robots.txt`，但 URL 没找到？

![robots.txt在哪](https://i.ibb.co/tpLhmm9p/2025-06-10-14-06-04.webp)

> 这是测试域名，我已经删除了，不要想搞坏事哟！！！

### 方案一：现在就更新 Vercel 部署

[Waline：vercel一键部署](https://waline.js.org/guide/deploy/vercel.html)

因为我交过 PR 了，所以现在是正常的，但是环境变量估计得重配？我自己使用的是手动修复。

### 方案二：手动修复

当你通过 Vercel 部署，你的 GitHub 会存在一个私有仓库，修改其 `vercel.json` 文件内容，应该这么改，第二个代码块是方便**复制粘贴**的版本：

```diff lang="json" title="vercel.json"

{
  "name": "comment",
  "github": {
    "silent": true
  },
  "builds": [
+  {
+   "src": "robots.txt",
+   "use": "@vercel/static"
+  },
    {
      "src": "index.cjs",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    {
-     "source": "/(.*)",
+     "source": "/((?!robots\\.txt$).*)",
      "destination": "index.cjs"
    }
  ]

}

```

```json
{
    "name": "comment",
    "github": {
        "silent": true
    },
    "builds": [
        {
            "src": "robots.txt",
            "use": "@vercel/static"
        },
        {
            "src": "index.cjs",
            "use": "@vercel/node"
        }
    ],
    "rewrites": [
        {
            "source": "/((?!robots\\.txt$).*)",
            "destination": "index.cjs"
        }
    ]
}
```

> **注意：** 下面是原理解释，如果你对具体原理不感兴趣，完全可以退出了，上面所讲已经解决了你的问题。

## Why and Why?

我好像有一种**诡异的直觉**，似乎理所应当地认为 Vercel 默认会把 `robots.txt` 当做静态资源，自动路由，自动复制生成，但是问题是，这种直觉建立在我经常使用 **SSG** 的幻觉上，但显然 Waline 评论系统不是。

### 路由：由得自己

默认路由使用这个来引用 Waline 在 Vercel 封装的模块，但从后来的 Waline 首页来看，它能和 SEO 关系上的也只有 `<head>` 标签里面的 meta 元素了，当然实际上也没有在这一层面上禁止索引，所以看看就好，可以跳过这段代码：

```js title="index.cjs"
const Application = require("@waline/vercel");
module.exports = Application({
    plugins: [],
    async postSave(comment) {
        // do what ever you want after comment saved
    },
});
```

查看更重要的 Vercel 路由配置，重写路由这方面：

```json
  ...
  "rewrites": [
    {
      "source": "/((?!robots\\.txt$).*)",
      "destination": "index.cjs"
    }
  ]
  ...

```

#### 正则头疼

- `^`：匹配字符串的开始位置，这里表示要从 URL 路径的开头开始匹配。

- `\/`：匹配字符 `/`，因为 `/` 在正则表达式中有特殊含义，所以需要用反斜杠 `\` 进行转义。  
  这里表示要匹配 URL 路径中的第一个 `/`。

- `(`：开始一个捕获组，用于将后续匹配的部分作为整体进行处理。

- `(?!robots.txt$)`：这是一个**负向前瞻断言**，意思是当前匹配的位置不能是 `robots.txt` 这个字符串的开头，并且要求 `robots.txt` 必须完整地出现在 URL 路径的末尾（因为 `$` 匹配字符串的结尾）。

    > 也就是说，如果 URL 路径是 `/robots.txt`，则整个正则表达式不会匹配这个路径。

- `.*`：匹配任意数量（包括零个）的任意字符（除了换行符），这里的 `.` 表示任意字符，`*` 表示零次或多次重复前面的 `.`。  
  所以这部分会匹配 `/` 后面的所有字符，只要这些字符不构成一个以 `robots.txt` 结尾的路径。

- `)`：结束捕获组。

所以整体来说，这个正则表达式 `/((?!robots.txt$).*)` 的意思是匹配以 `/` 开头，并且后面跟着任意字符（不包括换行符），但不能是以 `/robots.txt` 结尾的 URL 路径。

在重写规则中，它的作用是将除了 `/robots.txt` 以外的所有 URL 路径的请求都重写到 `index.cjs` 文件。

**例如：** 当访问 `/about`、`/contact.html`、`/api/data` 等路径时，都会被重写到 `index.cjs`，而访问 `/robots.txt` 则不会被重写，而是直接按正常方式处理（比如返回实际的 `robots.txt` 文件内容，如果存在的话）。

#### 别忘静态生成

我得向vercel声明一下这个是静态资源，不用构建，直接复制粘贴就行：

```json
...
"builds": [
    {
      "src": "robots.txt",
      "use": "@vercel/static"
    },
    ...
  ],

...
```

至此，彻底解惑。
