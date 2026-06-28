---
title: d3-force-3d 构建时预计算 3D 网络布局，减少客户端渲染压力
abbrlink: d3-force-precompute-3d
desc: 在 Astro 构建时用 d3-force-3d 预计算 1600+ 节点的 3D 力导布局，客户端加载即用、零仿真等待的经验与踩坑记录
date: "2026-06-28 15:17:00"
updated: "2026-06-28 15:30:00"
categories:
    - 技术
tags:
    - d3.js
    - 3D
    - 可视化
    - 性能优化
    - 力导图
cover: /links/2.0-overview.webp
---

## 前言

[友链图谱](https://links.needhelp.icu/) 是一个汇聚了 **1600+ 节点**、**2200+ 连接**的 3D 友链网络可视化项目。数据源是 `links/*.yml` 文件，渲染层基于 `3d-force-graph`（Three.js + d3-force-3d）。

在[上一篇文章](https://xingwangzhe.fun/posts/2d3d-graph-v2)中，我介绍了友链图谱从 2D 升级到 3D 的整体架构——包括 3D 力导布局的数学原理、节点渲染和高亮系统。但那时的方案是：**构建时只输出数据，客户端自行跑力导仿真**。

这个方案有两个痛点：

| 痛点       | 表现                                                    |
| ---------- | ------------------------------------------------------- |
| 加载慢     | 每次刷新都要从 [-5,5] 随机位置重新跑动画                |
| hover 卡顿 | 每次悬停触发 `Graph.refresh()` → 遍历 1600 节点计算颜色 |
| 构建浪费   | 构建 2 秒完成，但客户端要跑 5-10 秒动画                 |

> 声明：本文在撰写过程中使用了 AI 工具辅助分析技术资料、整理踩坑经验及润色排版。

## 思路：构建时预计算位置

「既然 `d3-force-3d` 在客户端跑，那在构建时（Node.js）也跑一遍不就提前拿到位置了吗？」

[d3-force-3d](https://github.com/vasturiano/d3-force-3d) 官方文档明确支持这种做法：

> `simulation.tick()` — "This method can be used in conjunction with `simulation.stop` to **compute a static force layout**."

于是我在 Astro API 端点 `graph.json.ts` 中加入了构建时预计算：

```ts
import { forceSimulation, forceLink, forceManyBody, forceCenter } from "d3-force-3d";

const sim = forceSimulation(nodes, 3) // 明确 3 维！
    .force(
        "link",
        forceLink(links)
            .id((d) => d.id)
            .distance(30),
    )
    .force("charge", forceManyBody().strength(-60))
    .force("center", forceCenter(0, 0, 0)) // 默认 strength=1
    .alphaDecay(0.02)
    .velocityDecay(0.3);

for (let i = 0; i < 300; i++) sim.tick();
sim.stop();
```

客户端改成加载预计算位置，直接冻结：

```ts
.cooldownTicks(0)
.cooldownTime(0)
```

然而……事情没那么简单。

## 踩坑 1：平面坍塌

跑出来的效果：

```
X: std=635  范围 [-1780, 1594]
Y: std=523  范围 [-2107, 1317]
Z: std=141  范围  [-200,  200]  ← 被压扁了！
3D ratio = 0.223  ⚠️ 扁平
```

Z 轴被压到只有 ±200，不管怎么调参数——`distance=30` 还是 `40`，`charge=-60` 还是 `-120`，`alphaDecay=0.02` 还是 `0.005`——Z 永远塌在初始半径以内。

**原因**：`forceCenter(0,0,0)` 的默认强度是 **1.0**，而 `charge` 只有 **-60**、`link` 只有 **distance=30**。center 力比其他力大了两个数量级，强行把所有节点往原点拉，Z 轴首当其冲被消解。

有趣的是，客户端渲染时同样的参数看起来却是"3D 网络"——因为客户端跑到 200 tick 就停了（`cooldownTicks`），还没收敛到平面，停在了一个好看的**暂态**。但构建时要的是一劳永逸，不能依赖"没跑完"。

## 踩坑 2：花哨尝试一一失败

| 方案                                       | 结果                        |
| ------------------------------------------ | --------------------------- |
| `forceRadial(800).strength(0.05)`          | 强制球壳，不是网络          |
| 自定义 `zBias` 力（随机 Z 扰动）           | 被 alpha 衰减消解，Z 还是塌 |
| 去掉 `forceCenter`，只用 `forceX`/`forceY` | 中心节点子节点形成圆盘      |
| `forceCenter.strength(0.3)`                | 0.651，不够                 |

每次调整都离目标差一点，走了很多弯路。

## 最终方案：三轴等强 + 弱居中

关键洞察是：**不要对抗 forceCenter，而是把它减弱到和其他力一个量级**。

```ts
const sim = forceSimulation(nodes, 3)
    .force(
        "link",
        forceLink(links)
            .id((d) => d.id)
            .distance(40),
    )
    .force("charge", forceManyBody().strength(-120))
    .force("center", forceCenter(0, 0, 0).strength(0.02)) // ← 关键！
    .alphaDecay(0.01)
    .velocityDecay(0.4);

for (let i = 0; i < 500; i++) sim.tick();
sim.stop();
```

| 参数              |    值    |            作用            |
| ----------------- | :------: | :------------------------: |
| `link.distance`   |    40    |        连接节点间距        |
| `charge`          |   -120   |   排斥力（比默认强一倍）   |
| `center.strength` | **0.02** |     极弱居中，仅防漂移     |
| `alphaDecay`      |   0.01   |      慢冷却，充分收敛      |
| `velocityDecay`   |   0.4    | 与 3d-force-graph 默认对齐 |
| tick              |   500    |          完全跑完          |

**为什么 0.02 有效？**

`strength=0.02` 意味着每 tick 所有节点只向中心移动 2% 的距离。这刚好抵消整体漂移，但完全不足以压倒 link 和 charge 力。三种力在同一个量级上互相平衡，自然形成 3D 散布。

结果：

```
X: std=478  范围 [-1288, 1265]
Y: std=312  范围  [-640, 1315]
Z: std=357  范围 [-1076,  802]
3D ratio = 0.747  ✅ 良好的 3D 网络
```

三轴散布均衡，没有平面、没有球壳、没有圆盘，是一个真正的**体积网络**（volumetric network）。

## 客户端配置

客户端直接加载预计算位置，不再跑额外仿真：

```ts
.graphData(graphData)
.warmupTicks(0)
.cooldownTicks(0)
.cooldownTime(0)
.d3AlphaDecay(0.02)
.d3VelocityDecay(0.3);
```

注意 `link` 和 `charge` 力**不能禁用**（`d3Force(null)`），否则 3d-force-graph 的连线渲染会丢失。只要 `cooldownTicks(0)`，仿真在一 tick 后立即冻结，位置不会被挪动。

## 效果对比

| 指标       |     客户端渲染      |          构建时预计算           |
| ---------- | :-----------------: | :-----------------------------: |
| 页面加载   |   等 5-10 秒动画    |          **即开即用**           |
| 构建时间   |        2 秒         | **20 秒**（一次编译，永久使用） |
| hover 卡顿 | 有（Graph.refresh） |          无（已优化）           |
| 3D 散布    |  暂态，依赖 timing  |            **稳定**             |
| 布局可复现 |     ❌ 每次随机     |    ✅ 固定（只要 seed 不变）    |

## 总结

构建时预计算 3D 力导布局**完全可行**，关键不是"要不要用 forceCenter"，而是**把 forceCenter 的强度降到和其他力一个量级**。

| center.strength |             结果             |
| :-------------: | :--------------------------: |
|       1.0       |     平面（center 主宰）      |
|       0.0       |        漂移（无约束）        |
|    **0.02**     | **3D 网络 ✅（三种力平衡）** |

项目仓库：[xingwangzhe/FriendLinks](https://github.com/xingwangzhe/FriendLinks) — 欢迎 star 和 PR！

友链图谱在线体验：[https://links.needhelp.icu/](https://links.needhelp.icu/)
