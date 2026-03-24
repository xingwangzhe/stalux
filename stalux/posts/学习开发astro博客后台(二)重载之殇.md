---
title: 学习开发Astro博客后台(二)重载之殇
abbrlink: 2dd2b505
date: 2025-07-04 18:44:32
updated: 2025-07-04 18:44:32
categories:
    - 后端
tags:
    - Astro
    - 博客
    - 后端
---

## 添加md编辑

在前文中,已经实现了非常简陋的功能,下一步准备粗略地写一个md编辑,然后再通过`fetch`请求将数据发送到后端。

[Vditor](https://b3log.org/vditor/)是一个非常好用的前端`Markdown`编辑器,它支持实时预览、代码高亮、表格等功能,还内置katex,mermaid等功能,非常适合用来编辑博客文章。于是我使用这个来粗略实现一下编辑器

![潦草编辑器](https://i.ibb.co/N6R3HGxV/2025-05-30-201219.webp)

```astro title="src/components/Editor.astro""

---
const { options = {},post = {} } = Astro.props;
export const prerender = false;
---
<div class="editor-container">
<link rel="stylesheet" href="https://unpkg.com/vditor/dist/index.css" />
<div class="save-status" id="save-status">就绪</div>
<div id="Editor"></div>
<script is:inline define:vars={{options,post}}>
  window.editorOptions = options || {};
  window.post = post || {};
</script>

<script>
  import Vditor from 'vditor'
  // Declare editorOptions on window
  declare global {
    interface Window {
      editorOptions: any,
      post: any;
    }
  }

  <!--省略-->

  let vditor = new Vditor('Editor', {
    ...window.editorOptions,//自定义的配置
    after: () => {
      //console.log('Vditor 初始化完成');
      //afte钩子,实现初始化内容
      if (window.editorOptions.value) {
        vditor.setValue(window.editorOptions.value);
      }
      updateSaveStatus('就绪', 'ready');      // 监听自定义 HMR 事件
      if (import.meta.hot) {
        import.meta.hot.on('locastrol-content-update', (data) => {
          //console.log('[Locastrol] 检测到内容文件更新，但已阻止页面重载:', data);
          updateSaveStatus('内容已同步', 'synced');
          setTimeout(() => {
            updateSaveStatus('就绪', 'ready');
          }, 2000);
        })
      }
    },
    input: ()=>{
      // 清除之前的自动保存定时器
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      if (!isAutoSaving) {
        updateSaveStatus('正在编辑...', 'editing');
      }

      // 设置新的自动保存定时器（防抖）
      autoSaveTimeout = setTimeout(()=>{
        autoSave(vditor.getValue());
      }, 1500);
    }
  });


<!--省略-->
```

:::warning

特别注意的是,定义`<script define:vars><script>`会导致`import Vditor from 'vditor'`失效

因为此时script变成了`module`类型,阻止了Vditor的正常加载

:::

:::tip

下面是一个技巧,来变相传参 ,这样参数才能正确写入到Vditor中

```astro title="src/components/Editor.astro"
<script is:inline define:vars={{options,post}}>
  window.editorOptions = options || {};
  window.post = post || {};
</script>

<script>
  import Vditor from 'vditor'
  // Declare editorOptions on window
  declare global {
    interface Window {
      editorOptions: any,
      post: any;
    }
  }
  ...
  </script>
```

:::

:::danger
但同时,vars会裸暴露在前端

所以不要一股脑直接传递一个结构体对象,而是具体精细的传递需要的参数

特别注意不要把`私密信息`从**astro构建时传递到前端运行时**

:::

## 阻止后台页面更新

由于我后台使用了`astro:content`来加载内容,所以每次内容更新都会导致页面重载,这就导致了后台md编辑器无法正常工作

所以需要阻止页面重载,理论上可以通过`import.meta.hot`来监听`astro:content`的更新事件,然后阻止页面重载

但是我问了Copilot,并没有很好地实现,反复折磨下,终于给出了相对可行的方案

## 前台/后台页面刷新控制机制的技术原理

### 问题的根源

在开发Astro博客后台时，遇到的核心问题是：**前台页面需要正常刷新以显示最新内容，而后台编辑页面绝对不能刷新**，否则会丢失用户正在编辑的内容。

这个问题的根源在于Astro的HMR（Hot Module Replacement）机制：

- 当`src/content/posts/`目录下的markdown文件发生变化时
- Astro会触发`astro:content`模块的更新
- 默认情况下，这会导致所有使用该模块的页面重新加载

### 技术实现原理

#### 1. HMR事件拦截机制

理论上这么说,但是我客户端基本没实现,问了ai也没正确实现 :(

```javascript
if (import.meta.hot) {
    import.meta.hot.on("locastrol-content-update", (data) => {
        // 拦截自定义更新事件，阻止页面重载
        updateSaveStatus("内容已同步", "synced");
    });
}
```

**工作原理：**

- `import.meta.hot`是Vite提供的HMR API
- 通过监听自定义事件`locastrol-content-update`来接收内容更新通知
- 这个事件是由外部工具（如locastrol）发送的，而不是Astro原生的重载事件

#### 2. 页面类型差异化处理

这个是容易实现的,但是只是实现了一半,因为`astro:content`会导致所有`.astro`页面刷新

**前台页面（正常刷新）：**

- 使用标准的`astro:content`导入
- 保持Astro默认的HMR行为
- 内容更新时自动重载页面

**后台页面（不能阻止刷新）：**

- 即使通过外部API获取内容数据，而不直接使用`astro:content`,也没法阻止刷新
- 使用自定义HMR事件监听机制,我没实现
- 手动控制内容同步，避免页面重载,呃呃,体验更不好了,还得手动...

#### 3.真正的实现?(完全地copilot,我真不会)

采用**WebSocket消息拦截 + HMR更新阻止**。

##### 核心技术架构

**1. 客户端状态追踪系统**

```typescript
// 客户端状态管理
const clientStates = new Map<string, ClientState>();

interface ClientState {
    isEditorPage: boolean;
    url: string;
    lastActivity: number;
}
```

- 通过`x-client-id`请求头唯一标识每个客户端
- 维护全局的客户端状态映射表
- 实时追踪哪些客户端正在编辑器页面

**2. 心跳机制**

```typescript
// 心跳API处理
if (url === "/api/locastrol/heartbeat" && req.method === "POST") {
    clientStates.set(clientId, {
        isEditorPage: Boolean(isEditorPage),
        url: clientUrl,
        lastActivity: Date.now(),
    });
}
```

- 客户端每30秒发送心跳包报告状态
- 服务器根据心跳更新客户端状态
- 超过30秒无活动的客户端被视为非活跃

**3. WebSocket消息拦截**

```typescript
// 完全劫持WebSocket的send方法
const originalSend = server.ws.send;
server.ws.send = function (payload: any, client?: any) {
    // 检查是否有编辑器页面活跃
    let hasActiveEditor = false;
    for (const [clientId, state] of clientStates) {
        if (state.isEditorPage && Date.now() - state.lastActivity < 30000) {
            hasActiveEditor = true;
            break;
        }
    }

    // 如果有编辑器页面活跃，完全阻止所有WebSocket刷新消息
    if (hasActiveEditor && typeof payload === "object" && payload !== null) {
        if (
            payload.type === "full-reload" ||
            payload.type === "update" ||
            payload.type === "connected" ||
            payload.type === "error"
        ) {
            return; // 完全阻止消息发送
        }
    }

    return originalSend.call(this, payload, client);
};
```

- 直接劫持Vite开发服务器的WebSocket发送方法
- 根据活跃编辑器状态决定是否发送刷新消息
- 实现了"有编辑器活跃时全局阻止刷新"的策略

**4. HMR更新拦截**

```typescript
// HMR更新拦截
handleHotUpdate({ file, server }) {
  // 检查是否有编辑器页面活跃
  let hasActiveEditor = false;
  for (const [clientId, state] of clientStates) {
    if (state.isEditorPage && (Date.now() - state.lastActivity < 30000)) {
      hasActiveEditor = true;
      break;
    }
  }

  if (hasActiveEditor) {
    return []; // 阻止HMR更新
  } else {
    return undefined; // 允许正常更新
  }
}
```

- 在Vite插件层面拦截热更新
- 返回空数组阻止更新，返回undefined允许更新
- 实现了文件级别的更新控制

**实际工作流程：**

```
1. 用户打开编辑器页面
   ↓
2. 客户端开始发送心跳包（每30秒）
   ↓
3. 服务器标记该客户端为"编辑器活跃"
   ↓
4. 文件系统发生变化
   ↓
5. Vite尝试触发HMR更新
   ↓
6. locastrol检测到活跃编辑器
   ↓
7. 同时拦截HMR事件和WebSocket消息
   ↓
8. 编辑器页面保持不刷新，前台页面正常刷新
```

这种实现方案的核心优势在于**从根源上阻止了所有可能导致页面刷新的WebSocket消息和HMR事件**，而不是依赖客户端的事件监听，确保了编辑器页面的绝对稳定性。

:::tip
但实际上,前台页面倒是能够正常刷新,但是热重载失效了,算了,勉强先这样吧
:::

下个月又要开始课设了,估计没时间写这个后台插件了,只能暂时搁置咯

> 已经有好几个搁置了,都推到暑假了...没人催的话,我大概会忘记吧...😀💧
