# 一言卡片与 Waline 生命周期修订

1.37.0 在 1.36.0 基础上修订一言卡片、评论初始化、评论字体边界及导航，不增加配置字段。

## 官方约定与实现

| 依据 | 对应实现 |
| --- | --- |
| [Astro ClientRouter 生命周期](https://docs.astro.build/en/guides/view-transitions/#lifecycle-events)，2026-10-18 通过官方 Docs MCP 查询成功 | `registerPageLifecycle("waline")` 在 `astro:page-load` 挂载，在 `astro:before-swap` 清理；模块只注册一次全局生命周期 |
| [Waline 实例 API](https://waline.js.org/reference/client/api.html) | 保留 `init()` 返回的实例，离页调用 `destroy()`；挂载失败与销毁异常均释放动态样式 |
| [Waline SPA 用法](https://waline.js.org/cookbook/reactivity.html) | `update()` 不接受新 `el`；Astro 替换 body，故新页重新 init，不能只更新已移除 DOM 上的旧实例 |
| [Waline CSS 变量](https://waline.js.org/reference/client/style.html) | 评论容器设置独立 `--waline-font-family`，正文、输入框、按钮使用系统字体，代码使用系统等宽字体 |

懒加载使用单次加载保护；离页后到达的模块不能挂载旧元素。资源导入或同步初始化失败时展示本地化页面重载按钮，监听随当前页清理；浏览器可缓存模块下载失败，不能假设再次 import 同一模块一定恢复。评论 API 的网络错误仍由 Waline 自身处理；不把资源重试包装成服务端重试。

组件在构建时写入当前路由作为默认 `path`；客户端仍对缺失、空白路径兜底到 `location.pathname`，显式自定义 path 保留。文章和 About 页面继续保留原有路径语义。

评论无法在构建时确定文字，不能继承逐页 LXGW WenKai 子集。字体隔离仅作用于评论容器，正文和一言继续使用主题字体。

## 一言卡片

增加装饰引号、主题色顶部细线、正文留白和来源层次。来源可换行，手机缩小内边距；日期定位链接有至少 44px 高度及键盘焦点。移除整卡链接，避免正文及来源链接嵌套在锚点中。

## 导航

桌面导航与首页导航容器采用 sticky，保持页面流中的原高度。滚动超过 24px 后显示半透明背景和 20px backdrop blur，回到顶部恢复透明。手机关闭状态的菜单按钮使用相同滚动判断；展开后通过 visibility 和 pointer-events 隐藏按钮，关闭后恢复，同时维护 aria-expanded。

导航高度复用现有 ResizeObserver 和布局更新，写入 CSS offset，供桌面 scroll-padding-top 避让目录锚点，文章两侧固定栏同步避让导航高度；不能让吸顶导航遮住文章标题。滚动监听使用 passive，随 Astro 页面生命周期清理。减少动态效果仍沿用主题全局规则。

## 验证

- `bun run validate` 通过：53 个测试文件、294 项测试；Astro 检查无错误和警告，模板生成 43 HTML，SEO 和静态 Agent 隐藏检查通过。
- 9 项 Waline 定向测试覆盖重复初始化、加载期间离页、失败重试、空路径兜底、自定义路径保留、初始化失败及销毁异常时的样式释放。
- 独立真实 myblog 副本以主题链接完成 dev 桌面与 390px 手机检查：17 张一言卡片无横向溢出；评论编辑器挂载，面板和注入样式各 1 份；输入框 computed font 为系统字体栈。

原始构建日志、浏览器脚本和截图保存在工作区 `work/waline-20261018/`。

- 生产 preview 桌面/390px 手机宽度各完成 52 次真实点击导航（About 与一言往返各 26 次）：每个评论页只有 1 个面板与 1 个动态样式，离页样式为 0，生命周期注册数量保持 11，无 pageerror。真实 Waline 响应均为 HTTP 200；快速离页的 6 次 ERR_ABORTED 请求单独记录，不作为服务端错误。
- 主动阻断 Waline JS chunk 后，重载按钮出现；撤销阻断并点击页面重载，编辑器与动态样式各恢复 1 份。该测试揭示并避免了浏览器缓存失败模块时原地 import 无法恢复的情况。
- 生产导航实测：1440px 下吸顶 top=0、backdrop-filter 为 blur(20px) saturate(1.4)，锚点 padding=168px；390px 菜单按钮滚动后模糊，展开时 visibility=hidden，命中位置为面板导航链接。1920px 文章目录点击后标题 top=76.14px，导航底部为 60px。
