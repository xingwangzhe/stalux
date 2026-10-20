# 1.40.1 路由视图过渡

按路由类别和用户意图选择单标题 CSS View Transition，覆盖首页、归档、文章、分类/标签列表与详情、关于、友链、说说和404。所有正常动效100–180ms，手机为100–120ms纯透明度；减少动态、原生历史手势、同URL和同页锚点不创建动画。独立HTML继续使用原生导航。

策略函数覆盖12×12个有向类别组合，包含自环；没有真实链接的组合保留策略覆盖，不制造导航入口。404与独立HTML也有明确策略。普通自环换文章、换分类、换标签与点击完全相同URL分别处理。

| 类别 | 路由 | 新页视觉焦点 |
| --- | --- | --- |
| 首页 | `/` | 站名标题 |
| 归档 | `/archives/` | 归档标题 |
| 文章 | `/posts/:id/` | 文章H1 |
| 分类列表 | `/categories/` | 分类总标题 |
| 分类详情 | `/categories/:name/` | 分类名标题 |
| 标签列表 | `/tags/` | 标签总标题；Canvas不作为共享元素 |
| 标签详情 | `/tags/:name/` | 标签名标题 |
| 关于 | `/about/` | 页面H1 |
| 友链 | `/links/` | 页面H1 |
| 说说 | `/words/` | 页面H1 |
| 404 | `/404/` | 错误页H1 |
| 独立HTML等 | 其他路径 | 原生导航，不注入主题生命周期 |

| 意图 | 动效 | 时长 |
| --- | --- | --- |
| 平级主题 | 标题轻淡入 | 120ms |
| 进入阅读 | 新标题上收6px | 160ms |
| 返回目录（普通点击） | 新标题下收4px | 140ms |
| 分类/标签筛选 | 筛选标题替换 | 140ms |
| 显式上一篇/下一篇 | 新标题左右8px | 160ms |
| 回首页 | 站名轻抬4px | 180ms |
| 历史前进/回退 | 原滚动位置弱淡入，不移动正文 | 100ms |
| 404 | 错误提示淡入 | 100ms |

根与整个main不捕获，旧文章布局/侧栏的命名不再生成多层快照，只有经可见性检查的一个h1参与。旧标题即时退出，group禁止尺寸与位置插值。正文直接清晰显示，不做模糊、缩放、超调或延迟入场。深滚回退时标题不在视口则不捕获，不为动画强制滚顶。

只在同步 `astro:after-swap` 中、Astro 已恢复滚动后测量新标题一次。导航前只清理旧标题标记，避免为最终不显示的旧图强制布局或捕获位图；原生新侧独有名称照常创建 `::view-transition-new`。

保留 Astro 的 loader、swap、history、滚动、page-load 与 page-runtime 清理/挂载顺序。动效状态跨根属性swap保留到真正finished/取消；现有analytics/background共享协调器明确结算安装门，不再等待未启动的第二套WAAPI。导航和页脚持久壳层保持原位，文章目录、随机文章、评论仍更新当前页面的数据。

官方依据：[MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)、[Astro transitions API](https://docs.astro.build/en/reference/modules/astro-transitions/)、[MDN finished](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition/finished)、[W3C新状态捕获](https://www.w3.org/TR/css-view-transitions-1/#capture-the-new-state)。

完整类别设计及实施验收证据在工作区 `work/myblog-route-graph-20261020/route-transition-design.md` 与 `work/vt-redesign-20261020/`。本文描述实现规则，性能结论以同内容、同运行时、同限速的实际对照报告为准。

1.40.1补充慢网络取消语义：仅在没有未完成导航时拦截完全相同的URL；准备中的导航允许用户点击当前页，由Astro取消先前请求并结算最后一次导航，避免最后一次点击失效。正常路由策略和CSS时长不变。
