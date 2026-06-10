---
title: 我做了一个现代Web版本的标签云，支持图片视频Web组件
abbrlink: 384eafa7
date: "2026-06-10 20:00:00"
tags:
    - 标签云
    - 3D
    - Canvas
    - TypeScript
    - 前端开发
categories:
    - 前端开发
desc: 从零构建一个纯数学驱动的 3D 标签云引擎，支持文本、图片、SVG、HTML、视频和 Web Components 六种模态，仅 3KB gzipped。
---

> 本文由DeepSeek润色

标签云页面Demo: [https://tagscloud.needhelp.icu/](https://tagscloud.needhelp.icu/)

## 前言

最近想美化一下博客的标签云页面。我希望标签能在一个 3D 球面上旋转。搜了一圈发现现有的轮子

[cong-min/TagCloud](https://github.com/cong-min/TagCloud)——已经是 2017 年的作品了：ES5 编写、仅支持纯文本、纯 DOM 渲染。而且我还有一些"奇思妙想"

——比如让标签云里混入图片、视频、甚至 Web Components。

于是我决定从零重构一个现代版本：**[@xingwangzhe/tags-cloud](https://www.npmjs.com/package/@xingwangzhe/tags-cloud)**。

<!--more-->

## 先看源码

原项目 [TagCloud](https://github.com/cong-min/TagCloud) 的核心算法其实非常优雅，值得保留。它由三个纯数学模块组成：

### 数学计算

> 好久都没做过纯数学题了，在Deepseek写代码的时候，顺便问一下这都是什么物理意义，计算能算，但逻辑需要思考很长时间...

**1. 斐波那契球面分布**

把 N 个标签均匀地散布在球面上，不是一件简单的事。如果直接按经纬度等距切分，极点附近的点会被挤压在一起。旧库用了一个巧妙的方案：

$$
\begin{aligned}
\phi(i) &= \arccos\left(-1 + \frac{2i+1}{N}\right) \\[4pt]
\theta(i) &= \sqrt{N\pi} \times \phi(i) \\[4pt]
P(i) &= \bigl(R\sin\phi\cos\theta,\ R\sin\phi\sin\theta,\ R\cos\phi\bigr)
\end{aligned}
$$

$(2i+1)$ 的偏移确保没有任何点恰好落在球面极点。$\sqrt{N\pi}$ 的黄金螺旋角让相邻点之间的经度差保持无理数比例，避免视觉上的对齐条纹。时间复杂度 $O(N)$，100 个标签瞬间完成。

**2. 旋转矩阵**

交互体验用的是 **Shoemake Arcball**——一种基于四元数的 3D 旋转方案。用户拖拽时，屏幕坐标被投影到虚拟球面上，起点和终点之间构造一个四元数差量，然后叠加到当前旋转状态。相比欧拉角，四元数没有万向锁问题，旋转更流畅。

**3. 透视投影**

$$
\begin{aligned}
per &= \frac{4R}{4R + z} \\[4pt]
\alpha &= \operatorname{clamp}(per^2 - 0.25,\ 0,\ 1) \\[4pt]
x_{screen} &= c_x + x_{rot} \times per \\[4pt]
y_{screen} &= c_y + y_{rot} \times per
\end{aligned}
$$

Z 轴越深（远离屏幕）→ $per$ 越小 → 标签缩小 + 变透明。$per^2 - 0.25$ 的公式让远处的标签更快地淡出视野，避免球面背面的标签干扰视觉。近处的标签（$per \approx 1$）$\alpha = 0.75$，清晰可见。

### 渲染，但是我不想用 DOM

旧库的渲染方式是把每个标签做成一个 `<span>` 元素，每帧更新它的 `transform` 和 `opacity`。100 个标签就是 100 个 DOM 节点在每一帧被重新布局——性能可想而知。

我的想法是：**数学留在 CPU 里，渲染尽量走 Canvas**（文本和图片）。需要交互的富媒体（SVG、视频、Web Components）保留 DOM overlay。Canvas 的 `fillText` 和 `drawImage` 是像素级操作，不触发回流，60fps 毫无压力。

## 用 TS 改写

从 ES5 到 TypeScript 不只是加类型标注。整个架构被拆成了清晰的模块边界：

```title="项目结构"
src/
├── core/
│   ├── distribution.ts   // 斐波那契球面分布
│   ├── rotation.ts       // 旋转变换
│   └── projection.ts     // 透视投影
├── TagCloud.ts           // 主引擎
└── index.ts              // 导出入口
```

```ts title="基础用法"
import { TagCloud } from "@xingwangzhe/tags-cloud";

const cloud = new TagCloud(document.getElementById("cloud"), {
    tags: ["TypeScript", "Canvas", "3D", "Astro", "Bun"],
    radius: 300,
    spinY: 0.15, // Y 轴自旋速度（°/帧）
    fontSize: 16,
    color: "#ffffff",
    onTagClick(item) {
        if (typeof item === "string") {
            window.location.href = `/tags/${item}/`;
        }
    },
});

// 运行时 API
cloud.setTags(["新的", "标签", "列表"]);
cloud.pause();
cloud.resume();
cloud.destroy();
```

类型系统让配置项一目了然。`TagCloudOptions` 的每一个字段都有 JSDoc，IDE 里悬停就能看到中英文说明。

## 多模态

这是新库最大的亮点——**不再局限于纯文本**。`tags` 参数接受一个联合类型：

```ts title="TagItem 联合类型"
type TagItem =
  | string                              // 纯文本 → Canvas 渲染
  | { type: "image"; ... }              // 图片   → Canvas 渲染
  | { type: "svg"; ... }                // SVG    → DOM overlay 渲染
  | { type: "html"; ... }               // HTML   → DOM overlay 渲染
  | { type: "video"; ... }              // 视频   → DOM overlay 渲染
  | { type: "element"; ... }            // 任意元素 → DOM overlay 渲染
```

渲染引擎自动分流：文本和图片走 Canvas 获得最佳性能；SVG、HTML、视频和 Web Components 走 DOM overlay 保持交互性和可访问性。

### 图片

```ts title="图片标签"
new TagCloud(container, {
    tags: [
        {
            type: "image",
            src: "/avatar.webp",
            width: 40,
            height: 40,
            onClick: () => open("/profile"),
        },
        "JavaScript",
        "TypeScript",
    ],
    radius: 300,
    spinY: 0.15,
});
```

图片通过 `CanvasRenderingContext2D.drawImage()` 绘制，支持自定义宽高和点击回调。头像、Logo、图标都可以混在文字标签中间，在 3D 球面上一起旋转。

### 视频

```ts title="视频标签"
new TagCloud(container, {
    tags: [{ type: "video", src: "/demo.mp4", width: 120, height: 68 }, "前端", "全栈"],
    radius: 350,
    spinY: 0.1,
});
```

视频标签走 DOM overlay 渲染，`autoplay muted loop playsinline` 自动静音循环播放。点击视频标签会触发全屏——想象一下在标签云里漂浮着一段产品 Demo 的缩略视频。

### Canvas 渲染

整个 Canvas 渲染器是内置的，但完全可替换。`onRender` 回调暴露了每帧的投影数据：

```ts title="自定义渲染回调"
new TagCloud(container, {
    tags: ["A", "B", "C"],
    onRender(tags) {
        // tags: TagData[] — 每帧的投影坐标
        // { item, x, y, z, scale, alpha }[]
        tags.forEach((t) => {
            // 你可以用 Three.js、PixiJS 或任何方式绘制
        });
    },
});
```

如果不传 `onRender`，引擎会用内置的 Canvas 渲染器：自动创建 `<canvas>`、处理高 DPI 缩放、Z 排序后逐层绘制文本和图片。DOM overlay 也自动管理——创建、更新 transform、清理已移除的标签。

内置渲染器的细节：

- Canvas 绘制文本和图片（高性能像素操作）
- DOM overlay 渲染 SVG/HTML/Video/Element（保持交互性）
- 每帧按 Z 深度排序（远处的先画），实现正确的遮挡关系
- 点击检测用 raycast——遍历上一帧的 Canvas 标签坐标，找最近的命中

## 核心 API 一览

| 选项              | 类型        | 默认值      | 说明                      |
| ----------------- | ----------- | ----------- | ------------------------- |
| `tags`            | `TagItem[]` | —           | 标签列表                  |
| `radius`          | `number`    | `300`       | 球面半径 (px)             |
| `spinY`           | `number`    | `0`         | Y 轴自旋速度，+右转 -左转 |
| `spinX`           | `number`    | `0`         | X 轴自旋速度，+下转 -上转 |
| `reverse`         | `boolean`   | `false`     | 反转拖拽方向              |
| `inertiaDecay`    | `number`    | `0.96`      | 惯性衰减系数              |
| `dragSensitivity` | `number`    | `3`         | 拖拽灵敏度                |
| `fontFamily`      | `string`    | `system-ui` | 字体                      |
| `fontSize`        | `number`    | `14`        | 字号 (px)                 |
| `color`           | `string`    | `#fff`      | 文字颜色                  |
| `onTagClick`      | `function`  | —           | 点击回调                  |
| `onRender`        | `function`  | 内置        | 自定义渲染器              |

实例方法：`setTags()`、`pause()`、`resume()`、`destroy()`。

## 性能

| 指标            | 数值                         |
| --------------- | ---------------------------- |
| Bundle 大小     | ~12KB (ESM) / ~3KB (gzipped) |
| 零运行时依赖    | 是                           |
| 100 标签 帧耗时 | < 5ms (旋转+投影+排序+渲染)  |
| 内存占用        | ~6KB (100 个标签的浮点坐标)  |

数学计算全部是标量运算，没有矩阵乘法库依赖。每帧的浮点运算量：$N$ 个标签 $\times$ ($8$ 次乘法 $+$ $4$ 次加法) 用于旋转矩阵变换 $+$ $1$ 次除法用于透视投影 $+$ $O(N \log N)$ 的 Z 排序。不碰 WebGL，纯 CPU 计算在 60fps 下完全够用。

## Demo 在线

我的博客标签云实例 [https://xingwangzhe.fun/tags/](https://xingwangzhe.fun/tags/)

标签云页面Demo: [https://tagscloud.needhelp.icu/](https://tagscloud.needhelp.icu/)

npm 安装：

```bash title="安装"
bun add @xingwangzhe/tags-cloud
# 或
npm install @xingwangzhe/tags-cloud
```

GitHub: [https://github.com/xingwangzhe/tags-cloud](https://github.com/xingwangzhe/tags-cloud)

欢迎 Star 和 PR！
