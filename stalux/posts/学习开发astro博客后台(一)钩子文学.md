---
title: 学习开发astro博客后台(一)钩子文学
abbrlink: f593cf78
date: 2025-07-04 18:44:32
updated: 2025-07-04 18:44:32
categories:
    - 开发
tags:
    - astro
    - 后端
    - 开发
---

前端会点，后端不怎么会，想着 Astro 默认作为 SSG 前端框架，得需要一个伪后台。我看了官方文档，有很多后台，但都不是我想要的那种 **dev** 开发环境下的后台，所以我准备手搓一个**解耦的后台实现**，也就是作为 **npm** 包来分发。

当然回过头来，我还**什么都不会**，所以从官方文档，从头开始。

![钩子](https://i.ibb.co/DHYwBJfz/2025-05-28-102654.webp)

> 很详细啊，难得官方有中文文档，赞👍，虽然我不太懂钩子，但是不懂就学嘛，还是挺有意思的。

## 创建项目

```bash
npm init
```

创建 `package.json` 文件。

### 安装必要的依赖

安装前置，相关依赖，配置一下命令，方便编译成 JS：

```json title="package.json"
...
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./src/pages/admin.astro": "./src/pages/admin.astro"
  },
  "files": [
    "dist",
    "src/pages",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  },
  "peerDependencies": {
    "astro": "^5.8.0"
  },
...
```

基本构建：

```bash title="终端"
D:\test\locastrol> bun run build
$ bun run clean
$ rimraf dist
$ tsc
```

### 测试

```ts title="src/index.ts"
import { AstroIntegration } from "astro";

interface Options {
    collections: String;
}

export function locastrol(config: Options = { collections: "" }): AstroIntegration {
    const { collections } = config;

    return {
        name: "locastrol",
        hooks: {
            "astro:config:setup": ({ injectRoute, updateConfig, command }) => {
                if (command == "dev") {
                    // 通过 Vite 环境变量传递 collections 参数
                    updateConfig({
                        vite: {
                            define: {
                                "import.meta.env.LOCASTROL_COLLECTIONS":
                                    JSON.stringify(collections),
                            },
                        },
                    }); // 后台首页
                    // 编辑器路由 - 使用动态路由
                    injectRoute({
                        pattern: "/locastrol/editor",
                        entrypoint: "locastrol/src/pages/index.astro",
                    });
                    injectRoute({
                        pattern: "/locastrol/editor/[slug]",
                        entrypoint: "locastrol/src/pages/[slug].astro",
                    });
                    // API 路由
                    injectRoute({
                        pattern: "/api/locastrol/posts/[slug]",
                        entrypoint: "locastrol/src/api/posts/[slug].ts",
                    });
                    injectRoute({
                        pattern: "/api/locastrol/posts",
                        entrypoint: "locastrol/src/api/posts.ts",
                    });
                }
            },
            "astro:server:start": ({ address }) => {
                console.log(
                    "\x1b[43m\x1b[30m%s\x1b[0m \x1b[36m%s\x1b[0m",
                    "✅Locastrol后台已经启动",
                    `http://localhost:${address.port}/locastrol/editor`,
                );
            },
        },
    };
}

export type { Options };
```

...

```bash title="终端"
cd d:\test\astrotest && New-Item -ItemType SymbolicLink -Path "node_modules\locastrol" -Target "d:\test\locastrol"
```

把本地依赖**软链接上**，这样方便**随改随测**。

![软链接截图](https://i.ibb.co/fVnRCpBV/2025-05-28-110824.webp)

## 奇异搞笑 **astro: content** 导入

我当时不明白，为什么我不能导入来获取这个方法，问了一下 Copilot：

```ts
import { getCollection } from "astro:content";
```

Copilot 回答说：`astro:content 是 Astro 的虚拟模块，只在 Astro 项目运行时可用`，于是它推荐了各种**疯狂的高超技巧**来实现获取内容合集，我照做了，但是总是感觉别扭。问另一个 AI，让我另辟蹊径，直接写 Astro 组件？

欸，果然只问一个 AI，这个 AI 就会犯轴，转不过弯，好多时间浪费在那了...

```astro title="src/pages/admin.astro"
---
import { getCollection } from "astro:content";
const POSTS = 'blog';
const posts = await getCollection(POSTS);
---

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <div>hello world</div>
    <ul><!-- 列出所有文章,具体类型先any,我喜欢anyscript :) -->
        {posts.map((post: { slug: any; data: { title: unknown; }; }) => (
            <li>
                <a href={`/blog/${post.slug}`}>{post.data.title}</a>
            </li>
        ))}
    </ul>
</body>
</html>

```

> 直接通过组件来实现的**内容集合查询**

## 具体讲讲钩子这块

### 插件得先注入

这块主要是看官方的文档,首先我得配置一下我这个插件的`注入方式`,

```ts title="src/index.ts"
import { AstroIntegration } from 'astro';

interface Options{
  collections: String;
}

export function IntergrationName(config: Options = { }): AstroIntegration {...}
```

这个应该是**默认插件导出**,导出名就是`Intergration`,然后在`astro.config.mjs`中配置一下

```js title="astro.config.mjs"
import { defineConfig } from 'astro/config';
import { IntergrationName } from 'locastrol';
export default defineConfig({
  integrations: [IntergrationName({...})],
});

```

### 钩子,对事件的响应,或者说回调?

很明显,钩子总是与事件有关
`astro:config:setup`这个钩子,在配置阶段触发,可以用来修改配置,比如说我想要在开发环境下,注入一些路由,或者是修改一些配置

我就注入了一些路由,比如说`/locastrol/editor`这个路由,它会指向`src/pages/index.astro`,也就是我的后台首页

:::tip

值得注意的是,以locastrol这个包名作为`entrypoint`的开头是因为我这个是npm包,得包名开头才能被识别为npm包的路径,不会导致astro混淆

而且还要确保包导出了这些文件

:::

```ts title="src/index.ts"
hooks: {
  'astro:config:setup': ({ injectRoute, updateConfig, command }) => {
    if (command == 'dev') {
      // 通过 Vite 环境变量传递 collections 参数
      updateConfig({
        vite: {
          define: {
            'import.meta.env.LOCASTROL_COLLECTIONS': JSON.stringify(collections)
          }
        }
      });
      // 后台首页
      injectRoute({
        pattern: '/locastrol/editor',
        entrypoint: 'locastrol/src/pages/index.astro'
      });
      injectRoute({
        pattern: '/locastrol/editor/[slug]',
        entrypoint: 'locastrol/src/pages/[slug].astro'
      });
    }
  },
}
```

:::warning
加上`if (command == 'dev')`条件判断很重要,不然ssg会把后台页面也渲染出来

到时候一些私密内存变量就会不小心暴露出来了
:::

```js
'astro:server:start': ({ address }) => {
        console.log('\x1b[43m\x1b[30m%s\x1b[0m \x1b[36m%s\x1b[0m', '✅Locastrol后台已经启动', `http://localhost:${address.port}/locastrol/editor`);
      },
```

这个钩子在服务器启动时触发,我在这里打印了一条日志,告诉用户后台已经启动,并给出访问地址,不过我好奇,为什么ai给我这么*邪乎*的颜色代码,就没有更好的实现吗?

## roadmap ^ ^

看了一眼官方文档,暂时先俩这些钩子,先列个表单列出所有文章,后续查询可以使用官方的**内容集合**来做到*查*,用nodejs api来做到*增删改*,也许可以再加个中间件来实现**身份验证**?

不过那倒是有点背离*dev* *local*后台的初心了,而且我还有好多功能没实现呢!
