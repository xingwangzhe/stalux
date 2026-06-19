---
title: 可能解决Tauri多窗口应用阻塞问题
abbrlink: 50b9d330
date: "2025-09-17 14:21:48"
updated: "2025-09-17 16:56:53"
desc: 之前我的主进程main.ts都是挂载在index.astro上
categories:
    - Tauri
tags:
    - Tauri
    - ts
    - 多窗口
    - 阻塞
---

:::tip

本文存在AI分析生成的内容，仅供参考

请注意辨别

:::

## 我发现的一个有趣现象🤔

### 存在问题的旧版

之前我的主进程`main.ts`都是挂载在`index.astro`上

```astro title="旧版本 index.astro"

---
import Layout from '../layouts/Layout.astro';
import About from '../components/about/About.vue';
---

<Layout title="pages.about">
  <About client:only />
</Layout>
<script type="module" src="src/xxxx/main.ts"></script>

```

每次打开`主窗口`都会出现阻塞现象,比如说窗口的`最小化`,`全屏`,`关闭`等操作都需要等到窗口完全加载完毕才会响应(包括可能的后台逻辑也要初始化完毕才会响应)，就是在视觉上好像是加载完了，但是无论如何都无法与窗口交互，我得`resize`一下窗口(某些进程可能被迫中止？)，然后会强制刷新一下窗口，这个时候就可以交互了。

### 意外发现的解决方案

```astro title="新版本 index.astro"


<script type="module" src="src/xxxx/main.ts"></script>

```

此处about内容转到其它页，保持主页只加载`main.ts`,且保持隐藏，我发现这个问题就解决了，窗口可以正常交互了。

接着，对于主窗口，采取**不可见**方式

```json title="tauri.conf.json"
{
  "windows": [
    {
      "label": "main",
      ...
      "visible": false,
      ...
    }
  ]
}
```

然后我重新打开各个窗口，发现没有任何阻塞问题了

## 基于 main.ts 代码的深入分析

:::info
以下内容为AI分析生成，仅供参考
:::

现在看到了 `main.ts` 具体代码，基于这段代码重新分析阻塞问题的根本原因：

### 1. main.ts 代码结构分析

:::ai
AI分析：以下是对main.ts代码结构的分析
:::

`main.ts` 包含以下关键元素：

```javascript
// 模块导入
import { filespace } from './filespace';
import { autostart } from './autostart';
import { quitItem } from './quitItem';
// ... 其他导入

// 直接执行的异步代码（模块级别）
try {
  const menu = await Menu.new({...});
  const _tray = await TrayIcon.new(options);
} catch (error) {
  // 错误处理
}
```

### 2. 阻塞问题的根本原因

:::ai
AI分析：以下是对阻塞问题根本原因的分析
:::

**模块级别异步执行的陷阱**：

1. **导入阻塞效应**：
    - 导入的模块（`filespace`、`autostart` 等）可能包含复杂的初始化逻辑
    - 这些模块的导入和执行会阻塞 JavaScript 的执行线程
    - 在旧版本中，这发生在页面渲染完成后，干扰了窗口事件处理

2. **系统托盘创建的时序问题**：
    - `TrayIcon.new()` 是一个异步操作
    - 在旧版本中，这个操作在窗口已经显示后才开始
    - 可能导致系统托盘初始化与窗口事件循环产生冲突

3. **WebView 线程阻塞**：
    - 模块级别的异步代码执行会占用 WebView 的主线程
    - 窗口事件处理也依赖于这个主线程
    - 结果是窗口事件无法及时响应

### 3. 脚本位置调整的真正效果

**旧版本（底部加载）**：

```
页面渲染 → DOM 完成 → 脚本加载 → 模块导入执行 → 托盘创建 → 窗口事件阻塞
```

**新版本（头部加载）**：

```
脚本加载 → 模块导入执行 → 托盘创建 ↔ 页面渲染 → 窗口事件正常
```

通过提前执行脚本：

- 系统托盘的创建与页面渲染并行进行
- 避免了在窗口显示后才进行大量异步操作
- 确保 WebView 主线程在关键时刻保持可用

### 4. 更精确的根本机制

:::ai
AI分析：以下是对根本机制的更精确分析
:::

这个阻塞问题实际上是 **异步操作时序与窗口事件处理的竞争条件**：

- **竞争一方**：系统托盘创建等异步操作
- **竞争一方**：窗口事件处理循环
- **结果**：异步操作阻塞了事件处理，导致窗口无响应

### 5. 代码层面的优化建议

:::ai
AI分析：以下是基于代码结构的优化建议
:::

基于我的代码结构，我建议进行以下优化：

```javascript
// 方案1：延迟执行托盘创建
window.addEventListener("load", async () => {
    try {
        const menu = await Menu.new({
            items: [about, filespace, notes, autostart, restartItem, quitItem],
        });
        const options = {
            tooltip: "Wngtools",
            menu: menu,
            icon: await defaultWindowIcon(),
        };
        const _tray = await TrayIcon.new(options);
    } catch (error) {
        console.error("创建系统托盘失败:", error);
    }
});

// 方案2：使用 setTimeout 延迟执行
setTimeout(async () => {
    // 托盘创建代码
}, 100);
```

### 6. 验证和调试建议

:::ai
AI分析：以下是验证和调试的建议
:::

**添加调试日志**：

```javascript
console.log("开始创建系统托盘...");
const startTime = Date.now();

// 在关键位置添加时间戳
console.log(`托盘创建完成，耗时: ${Date.now() - startTime}ms`);
```

**监控窗口事件**：

```javascript
// 在 main.ts 中添加窗口事件监听
import { getCurrentWindow } from "@tauri-apps/api/window";

const window = getCurrentWindow();
window.onCloseRequested(() => {
    console.log("窗口关闭事件被触发");
});
```

:::warning
AI分析：以下是关于代码规范的警告
:::

代码中直接在模块级别执行异步操作是很危险的做法。虽然头部加载解决了问题，但还是建议使用更规范的初始化方式来避免潜在的竞态条件。
