---
title: AI + Rust 两连发：从 20 分钟到 12 秒，博客宇宙的构建优化之旅
abbrlink: ai-rust-bfs-force-two-wheels
date: "2026-07-04 13:00:00"
desc: 两个晚上，让 AI 用 Rust 给我造了两个 NAPI-RS 原生模块——@xingwangzhe/bfs-rs 替代 JS 采样式 BFS，@xingwangzhe/force-rs 替代 d3-force-3d。构建速度从 20 分钟降到 12 秒，六度分隔从"抽样估算"变成"全量精确"。
categories: 技术
tags: [Rust, AI, NAPI-RS, 性能优化, 前端, BFS, 力导布局]
cover: /ai-rust-bfs-force-two-wheels/cover.webp
---

![博客宇宙](/ai-rust-bfs-force-two-wheels/cover.webp)

## 背景：一个项目，两个瓶颈

[FriendLinks](https://github.com/xingwangzhe/FriendLinks) 是一个博客宇宙可视化项目。它爬取数千个独立博客的友链数据，在构建时生成两个核心产物：

| 产物              | 说明                                                                       |
| ----------------- | -------------------------------------------------------------------------- |
| **`/graph.bin`**  | 3D 力导向图二进制数据，46839 节点、89454 边，前端渲染为可交互的博客宇宙    |
| **`/stats.json`** | 六度分隔统计数据，56941 节点的全连通图 BFS，展示任意两个博客之间的平均距离 |

每次 `astro build`，这两个端点各占一半的构建时间。而且都很慢。

---

## 第一个瓶颈：stats.json 的 BFS

六度分隔的核心是 All-Pairs Shortest Paths——对图中每一个节点做 BFS，统计距离分布。

### 旧方案：JS 抽样（无奈之举）

56941 个节点，做全量 BFS 的复杂度是 $O(n \times (n+m))$。在 JavaScript 里，这根本跑不完。

所以旧代码做了妥协：**只在最大连通分量里随机抽 3000 个节点做 BFS，然后把距离分布按比例放大**。

```typescript title="采样 BFS（旧代码）"
// 旧：采样 BFS（约 Jul 1）
const sampledNodes = shuffle(largestComponent).slice(0, 3000);
for (const a of sampledNodes) {
    // 手动 TypedArray BFS，队列复用，内联计数...
}
// 除以 2（无向图双向计数），按节点比例放大...
```

经过几次优化后（TypedArray 复用、内联计数），3000 个节点的 BFS 已经跑得动了——但还是**抽样估算**，不是精确值。而且整个 `/stats.json` 端点还是要花相当长时间。

### 新方案：Rust 全量 BFS

7 月 3 日晚上，我让 AI 用 Rust + [NAPI-RS](https://napi.rs/) 写了一个 BFS 原生模块——`@xingwangzhe/bfs-rs`。

核心是 CSR（Compressed Sparse Row）格式的邻接表 + Rayon 并行：

```rust title="bfs-rs: 全量 BFS（Rust）"
// bfs-rs: 全量 BFS，Rayon 并行
pub fn bfsMergedHistogram(adj: Vec<u32>, offsets: Vec<u32>, n: u32) -> MergedHistogram {
    // Rayon par_chunks(500)，每个 chunk 从不同源节点并行 BFS
    // Mutex 保护的共享 histogram，Rust 侧直接聚合，不返回到 JS
}
```

JS 侧从几百行手动 BFS 循环简化成一次函数调用：

```typescript title="bfsMergedHistogram 调用"
// 新：一行调用
const merged = bfsMergedHistogram(adjArr, offArr, n);
// merged.histogram 就是全量 56941 节点的精确距离分布
```

升级过程也很有意思——第一版 `bfsAll` 返回了所有 $n \times n$ 个距离，直接 $O(n^2)$ 内存 segfault。改成 `bfsBatch` 分批处理，最后进化到 `bfsMergedHistogram`，Rust 侧用 Mutex 聚合 histogram，JS 侧只需要接收最终结果。

**从"抽样估算"到"全量精确"，同样的时间甚至更快。**

---

## 第二个瓶颈：graph.bin 的力导布局

3D 力导向图需要把 46839 个节点布局到三维空间。用的是经典的 Barnes-Hut N-body 模拟 + 弹簧力 + 中心力。

### 旧方案：d3-force-3d（20 分钟）

最初用 `d3-force-3d`，效果很好，但**太慢了**。JavaScript 里单 tick 就要约 1 秒，收敛需要 300+ tick。每次构建光力导仿真就要 **5 分钟以上**。代码里设了 14 分钟的超时上限——在 CI 上经常超时。

```text title="构建日志（旧版）"
构建日志（旧版）：
  tick   50/∞  α=0.3642  46839 节点  (···)
  tick  100/∞  α=0.1326  46839 节点  (···)
  ...
  ✔ 力导仿真完成 · 300 tick · 320.5s           ← 5 分多钟！
```

期间调整过无数次参数——theta 从 0 调到 2.5，TICKS 从 800 砍到 15，repulsion 从 400 改到 3000——但始终突破不了 JS 单线程的天花板。

### 新方案：force-rs（12 秒）

7 月 4 日，让 AI 用 Rust 完成了 Barnes-Hut 八叉树 + Rayon 并行。`d3-force-3d` 的完整力模型——多体斥力、degree-biased 弹簧力、质心平移——全部移植到 Rust，API 简化成一个函数：

```typescript title="force-rs API 调用"
const state = new Float64Array(n * 6 + 1); // [x,y,z,vx,vy,vz, ...alpha]
const links = new Uint32Array(edges.length * 2);
const opts = {
    repulsion: 3000,
    linkDistance: 500,
    centerStrength: 0.005,
    theta: 0.8,
    velocityDecay: 0.6,
    alphaDecay: 0.02,
};

for (let i = 0; i < TICKS_MAX; i++) {
    state = simTick(state, links, n, opts); // 一行
}
```

编译、运行——输出正常。但打开 `.bin` 文件，坐标炸了：

```text title="坐标溢出（调试日志）"
范围: [ -5,424,070,723 , 5,165,802,560 ]   ← ±54 亿！
```

接下来是一段精彩的调试过程。AI 加了逐 tick 的 debug 输出：

```text title="逐 tick debug 输出"
tick  1: max_rep=2.75e3  max_spr=1.52e3  max_v=1.87e3       ← 正常
tick  2: max_rep=4.0e1   max_spr=2.07e4  max_v=1.10e4       ← 弹簧力涨了 10 倍！
tick  3: max_rep=2.32e1  max_spr=8.36e4  max_v=4.16e4       ← 又涨了 4 倍！
...
tick 10: max_rep=0.04    max_spr=1.70e9  max_v=7.28e8       ← 弹簧力 17 亿！
tick 12: max_rep=0.00    max_spr=2.12e10 max_v=6.17e9       ← 超 clamp 上限！
```

排斥力在正常衰减，但**弹簧力每 tick 指数增长约 4 倍**。隔离测试发现：无连接时坐标正常，问题一定在弹簧力。

AI 逐行对比了 `d3-force-3d` 的 link force 源码，发现了根因——**bias 方向写反了**：

```rust title="bias 公式修正"
// ❌ 错误：用自己的度数做 bias → 高度数节点受力大，低度数叶子节点被吹飞
let bias = my_deg / (my_deg + deg[ni] as f64);

// ✅ 正确：用对方的度数做 bias（d3-force 行为）→ 叶子节点被锚定
let bias = deg[ni] as f64 / (my_deg + deg[ni] as f64);
```

d3-force 的设计里，degree=1 的节点应该获得 91.7% 的弹簧力，这样才不会被 46839 个节点的排斥力吹飞。bias 一反过来，38000+ 个叶子节点每人只拿到 8% 的力，直接原地升天。

**一行代码，几个小时的调试，坐标从 ±54 亿变回正常的 ±26 万。**

除此之外还修复了 4 个其他偏差（中心力模型、近距离软化、Barnes-Hut 修正因子、$\theta^2$ 判定）。修复后 14 个测试全过。

---

## 性能对比

| 端点                  | 旧方案                              | 新方案                               | 提升              |
| --------------------- | ----------------------------------- | ------------------------------------ | ----------------- |
| `/graph.bin` 力导仿真 | d3-force-3d JS，~5 分钟（300 tick） | force-rs Rust，**~8 秒**（100 tick） | **~40x**          |
| `/stats.json` BFS     | JS 抽样 3000 节点，估算             | bfs-rs Rust，**全量 56941 节点精确** | 从估算变精确      |
| 单 tick（47K 节点）   | ~1.0 秒                             | **~0.08 秒**                         | **~12x per tick** |
| 整体构建              | ~20 分钟                            | **~40 秒**                           | **~30x**          |

整体构建从 20 分钟压到了 40 秒左右。更关键的是，`graph.bin` 从 300 tick 降到了 100 tick 就能收敛（因为 Rust 的力模型和 d3-force 一致的精度），而 `stats.json` 从"抽样估算"变成了"全量精确"。

---

## CI/CD：自动多平台发布

两个包都用 GitHub Actions 做了自动化。拿 force-rs 举例：

```yaml title=".github/workflows/CI.yml"
# .github/workflows/CI.yml
build:
    strategy:
        matrix:
            - target: x86_64-apple-darwin
            - target: aarch64-apple-darwin
            - target: x86_64-pc-windows-msvc
            - target: x86_64-unknown-linux-gnu
            - target: x86_64-unknown-linux-musl
            - target: aarch64-unknown-linux-gnu
```

每次推送，CI 在 6 个平台上编译、跑 18 个 node 版本组合的测试、然后把所有 `.node` 二进制打成一个 1.3MB 的 npm 包发布，理论上可以发几个子包来减小大小，但那样需要设置npm，我懒。

```bash title="安装两个 npm 包"
bun add @xingwangzhe/bfs-rs     # 全量精确 BFS
bun add @xingwangzhe/force-rs   # 百倍加速力导布局
```

在 FriendLinks 项目里，只需要 `bun update` 就能用上最新版。

---

## 时间线

| 日期               | 事件                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------- |
| 6 月底 ~ 7 月 2 日 | 反复调参 d3-force-3d，始终突破不了 JS 瓶颈                                                   |
| 7 月 1 日          | 用 JS 实现采样 BFS（最大 3000 节点），优化到可接受速度                                       |
| **7 月 3 日 晚**   | **AI 写出 bfs-rs v0.1.0**：从 `bfsAll` 到 `bfsBatch` 到 `bfsMergedHistogram`，一晚上三次迭代 |
| **7 月 4 日 上午** | **AI 写出 force-rs**：Barnes-Hut + Rayon。调试发现 bias 反转，修复后发布 v0.1.2              |
| 7 月 4 日 下午     | FriendLinks 全面切换到两个 npm 包，构建从 20 分钟降到 40 秒                                  |

**两个晚上，两个 Rust 轮子，一次彻底的构建优化。**

---

## 感想

这次经历让我对两个东西有了新的认识：

|       | 认识                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **NAPI-RS 的门槛比想象的低。** 一个 ~200 行的 `lib.rs` + 一个标准 `Cargo.toml`，就能把 JavaScript 里最慢的部分替换成 Rust。状态直接在 `Float64Array` 和 `Vec<f64>` 之间零拷贝传递，不需要序列化。NAPI-RS 生成的 `index.js` 自动处理了平台检测和 fallback。                                                                                                                                                    |
| **2** | **Rust是AI的Native语言。** 我不擅长 Rust——借用检查器、生命周期标注、Rayon 的 `Send + Sync` 约束——这些对 Rust 新手来说都是拦路虎。但 AI 帮我处理了这些细节，让我能聚焦在"力模型是否正确"这种更高层次的问题上。最让我印象深刻的是调试环节：AI 能同时阅读 `d3-force-3d` 的 JS 源码和 `force-rs` 的 Rust 源码，逐行对比力模型公式，发现了那一行 bias 反转。这种跨语言的细致审计，如果纯人工做，可能要多花好几天。 |

一个晚上 BFS，一个晚上力导布局。从"构建太慢了先玩会手机"到"咦这就跑完了"。

项目链接：

- [@xingwangzhe/bfs-rs](https://github.com/xingwangzhe/bfs-rs) — Rust 全量精确 BFS
- [@xingwangzhe/force-rs](https://github.com/xingwangzhe/force-rs) — Rust Barnes-Hut 力导布局

[FriendLinks](https://github.com/xingwangzhe/FriendLinks)（[links.needhelp.icu](https://links.needhelp.icu)）是一个博客宇宙可视化项目。
