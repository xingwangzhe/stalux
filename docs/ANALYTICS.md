# 统计

统计工具统一配置在 `stalux/config/head.yml`，不需要修改模板代码。

```yaml title="stalux/config/head.yml"
id: head
# Google Analytics 4
# googleAnalyticsId: "G-XXXXXXXXXX"
# Microsoft Clarity
bingClarityId: "YOUR_CLARITY_PROJECT_ID"
# Umami
# umami:
#   id: ""
#   url: ""
anyhead: ""
```

## 加载策略

| 工具 | 行为 |
| --- | --- |
| Google Analytics | SDK 延后到首屏稳定之后加载（首次交互、LCP 稳定 600ms 或解析后 6 秒任一条件）；`page_view` 快照和 dataLayer 队列在导航发生时立即写入，不依赖 SDK 到达 |
| Clarity | 内置官方 `@microsoft/clarity` npm 依赖，浏览器动态导入并调用 `Clarity.init()`；软导航期间只初始化一次，由 SDK 自行处理历史导航 |
| Umami | 关闭 SDK 自动 pageview，保留点击事件采集；在异步加载前保存各页信息，避免快速导航时串页 |
| Vercount | 在每次 `astro:page-load` 后重新绑定计数节点 |

所有 SDK 使用低优先级的原生异步脚本，每个 SDK 在会话中只加载一次，加载失败不会阻塞正文或站内导航。

GA 记录每页 URL、标题和 referrer，等共享的 Swup 内容动效 gate 结算并让出绘制后，在独立后台任务中按访问顺序发送 pageview；任务饥饿时有界补发，页面隐藏或退出前立即清空队列。SDK 仍在主线程工作，这项调度只减少路由首帧上的同步阻塞。

已有旧运行时或 Partytown 会话首次遇到新运行时会整页刷新一次，避免旧监听器重复上报。

## Google Analytics 后台设置

使用 Google Analytics 时，请在 **管理 → 数据流 → 增强型衡量 → 网页浏览量 → 高级设置** 关闭“根据浏览器历史记录事件判断的页面更改”。

主题已设置 `send_page_view: false` 并显式发送每次导航的 URL 和标题；GA 的历史自动统计需要在后台单独关闭，否则软导航会重复计数。其他增强型衡量选项可以保留。参考 [Google 页面浏览量文档](https://developers.google.com/analytics/devguides/collection/ga4/views)。

## Microsoft Clarity

`bingClarityId` 是 Stalux 沿用的字段名，实际对应 Microsoft Clarity Project ID。登录 Clarity 后，在项目 **Settings → Setup → Get tracking code** 中获取对应 ID。

主题监控官方 tag 的加载失败并允许后续页面重试；tag 加载完成与录制核心、收集请求成功分别验证。官方 npm 包仍使用托管录制引擎，不会自动把 DOM 采集移到 Worker。不要再通过 `anyhead`、Tag Manager 或其他插件重复接入同一个项目。

Project ID 是公开的浏览器标识；**不要把 Clarity Data Export API token 写入这个 YAML 或任何前端代码**。如果站点使用严格 CSP、Cookie 横幅或 CMP，请由宿主站点自行配置相应策略和同意信号；主题不替站点判断法律合规。

部署后可检查脚本 URL 是否完整保留 Project ID，并在浏览器 Network 中确认出现 Clarity `/collect` 请求（收集域名可能为 `a.clarity.ms` 等区域端点）。

## 自定义 head

`anyhead` 会原样注入页面 `head`，用于站点自己的验证 meta、额外样式或脚本。不要在这里重复引入主题已经支持的统计工具。

## 隐私

统计与评论保持真实配置才能反映站点真实性能与行为。主题自身不新增遥测；第三方脚本的数据范围、Cookie 与合规由对应服务和站点配置决定。
