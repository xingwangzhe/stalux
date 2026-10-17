# Stalux 1.35.16 运行时验证记录（2026-10-17）

本次先修改 Stalux，再在真实 myblog 的独立副本中完成链接 dev、实体包生产 build 和 preview 验证。真实配置、内容、评论和统计服务保留。用户要求优先发版，剩余 Lighthouse 重复审计已停止；不宣称完成原计划全部性能门槛。

## 修改与验证

- 导航字体等待预算从 1000ms 降至 150ms，增加有界预热缓存、失败重试和取消清理；旧页面可见时不安装目标字体。
- 移除文章内容额外入场延迟；背景解码和替换避开视图过渡，保留字体、整体风格和路由动画。
- 修复归档触屏首次点击、估算高度造成的位移、代码样式换页加载，以及移动端文章统计区域占位。
- 代码行和 Mermaid 使用可验证尺寸的离屏渲染，保留横向滚动、键盘访问和打印。
- WebMCP 忽略无关时钟和背景属性变动，同时保留动态表单、标签及 shadow DOM 更新。
- 统计改为官方原生异步 SDK，避免 Partytown 的导航 DOM 异常；保留真实统计功能。Clarity 使用 SDK 自身路由生命周期。

最终完整 `bun run validate` 通过：49 个测试文件、272 项测试，Astro 0 错误、0 警告，主题构建和静态 Agent/SEO 验证通过。myblog 副本两次生产构建完成：724 个 HTML，第二次 1426 restored，724/724 字体后处理命中缓存；247 篇正文及文章元数据与基线一致，字体引用、Pagefind、sitemap、404、首页隐藏 Agent 摘要检查通过。

桌面/手机 dev 与 preview 功能回归通过，覆盖导航、搜索、目录、灯箱首次点击、真实评论、菜单和 WebMCP；快速点击、前进后退、滚动恢复、字体失败、外部服务超时、减少动态效果和无 View Transition 退路通过。四组各 60 次真实导航压力测试完成。计时器额外浏览器统计尚未完成，不将其列为已验证项。

## 实测条件与结果

Node 26.12.0、Bun 1.4.3、Chrome 155.0.8059.84、Playwright 1.63.0、Lighthouse 13.5.0；桌面 1440×900 / CPU 1 倍，手机 390×844 / CPU 4 倍；网络延迟 150ms、下载 1.6Mbps。相同内容快照及资源缓存策略；本机负载仍会影响结果。点击至内容可见使用 View Transition ready 后双帧代理，不能等同显示器实际呈现时间。

每条路线 20 次热缓存点击，以下为 P95 毫秒：

| 路线 | 桌面基线 | 桌面候选 | 手机基线 | 手机候选 |
| --- | ---: | ---: | ---: | ---: |
| 首页 | 496 | 614 | 572 | 914 |
| 归档 | 604 | 743 | 2102 | 1275 |
| 普通文章 | 1119 | 761 | 1158 | 1068 |
| 最长代码文章 | 1597 | 882 | 4795 | 1374 |
| 图片文章 | 1055 | 723 | 1344 | 1850 |

手机导航会话 CLS 从 0.4309 降至 0.0250；移动端图片文章独立复现的正文位移修复后从 0.1004 降至 0.0045。桌面会话 CLS 为 0.0012 → 0.0037。首页及部分路线仍未达原定 P95 目标，手机图片路线存在尾延迟回退，不能以文章改善掩盖。

已完成的 Lighthouse 首页桌面三轮：基线 Performance 中位数 81（81–82），候选 82（81–82），两者 LCP 约 2.04s、CLS 0。归档桌面三轮：76 → 74，LCP 约 2.86s → 2.87s。其余页面/手机完整三轮矩阵未完成；不宣称 Performance ≥90 或全站 LCP 达标。

基线两类设备导航均记录 7 次 Partytown DOM 异常；候选桌面为 0，手机长文章导航中记录 2 次远程 Clarity 0.8.72-beta 的 `null.sequence` 异常，定位到 SDK 自身异步上传/路由重启，正文和导航继续工作。该外部 SDK 限制保留，不屏蔽错误或宣称全程零异常。长任务数量仍有统计 SDK 的影响。

## 证据与后续边界

本机完整证据：`/home/xingwangzhe/桌面/博客/work/runtime-20261017/`，包含 `validate-final.log`、`candidate10-build*.log`、`assets.json`、`consumer-final.log`、`dev-final/`、`preview-final/`、`edge-cases.json`、`header-check.json`、`layout-check/`，以及 `baseline-release/`、`candidate-release/` 内的导航、压力、CDP 轨迹和已完成 Lighthouse HTML/JSON。文件名以实际目录为准；诊断中间候选不替代最终候选证据。

Astro 官方文档 MCP 返回 HTTP 403 / Error 1010，生命周期核对采用官方 View Transitions 文档及已安装 Astro 7.4.0 源码。标准依据：[Web Vitals](https://web.dev/articles/vitals)、[Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/)。Lighthouse 常规加载审计不直接测量 INP，本地实验不能替代真实访客数据。
