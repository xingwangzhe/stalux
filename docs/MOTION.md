# Stalux 模块与动效设计契约

日期：2026-10-25。结构基线：Stalux 1.43.1（2a119a30）；来源为《Stalux 页面结构与动效约束审查》及当前源码逐项复核。本文中的动效数值是本轮设计预算；验收报告记录实际实现与测量结果，本文不单独证明无闪白、无卡顿或某个帧率。

## 统计口径

共 **55 种可见语义模块**。以可见内容区域或交互边界计种类，同一个作者、社交、时钟、天气、标题组件在多处使用只计一种；每篇文章、标签、友链、摘录不是新的模块种类。卡片内的标题、封面、元信息属于卡片模块的子状态，代码/媒体/表格等正文专门交互作为独立类型列出。容器与条目的区域策略可以分别登记，但禁止由此叠加两套入场动画。

| 分组 | 模块类型数 |
| --- | ---: |
| 404 | 3 |
| 全局壳 | 13 |
| 共享模块 | 8 |
| 归档 | 3 |
| 分类与标签 | 7 |
| 文章 | 16 |
| 友链 | 2 |
| 一言 | 3 |
| 合计 | **55** |

左/右侧栏、PostLayout、ListPage、main 等纯编排包装不另计模块，路由转场作为调度层独立登记。SEO head、隐藏 AI 提示与 recovery 内容、分析脚本、滚动 sentinel、JSON/Markdown/XML/OG 端点不计可见模块。第三方 Waline/Pagefind/PhotoSwipe 内部控件按其集成模块计数，不将第三方私有 DOM 当成主题自有模块。关于页教育经历、用户 HTML、图表与图片属于对应正文或媒体模块的实例，不重复计数。

## 对旧审查的校正

| 旧审查（1.39.5） | 当前基线（1.43.1） | 本轮约束 |
| --- | --- | --- |
| Astro ClientRouter 与多组 transition:name | view-transitions.ts 仅安装 Swup；Swup 只替换 main | 壳层持久性来自容器替换边界，不依赖已删除的 Astro persist 指令 |
| main 原生VT 380/460ms，blur/scale/大位移 | 1.43.1 有 outgoing 140ms 与 incoming 220ms（手机180ms）的整main WAAPI | 本轮收敛为一次区域过渡，不再叠模块入场；长文章和长列表避免整长位移 |
| priority 卡片与文章有共享标题名 | 当前 postCard/标题无实际 transition:name；旧props仍有兼容留痕 | 不宣称已有共享标题；Canvas词也不冒充DOM共享元素 |
| 左右侧栏仅≥1600px | 当前仍然如此 | 1440px与手机不安排不存在的侧栏飞入 |
| 关于复用PostContent | 当前仍复用，但没有日期/左右侧栏 | 共享组件不等于共享内容，不persist正文或评论；只persist文章左栏与右栏时钟天气块 |

## 效果层次与预算

每个模块都定义进入、状态变化和减少动态效果行为，但**不为55个模块各自启动55条路由动画**。父区域承担一条路由淡入时，内部模块继承该效果；子模块只有用户hover/focus/pressed、数据就绪、折叠或锚点定位才产生局部反馈。静态文本采用稳定保持也是明确的设计选择：不会为了展示动效而反复移动时钟、长文或版权。

| 情境 | 桌面设计预算 | 手机 / 减少动态 | 约束 |
| --- | --- | --- | --- |
| 中性页面切换 | 100–160ms透明度 | 80–120ms透明度；reduce即时 | 正文及时可读，零人工delay |
| 层级深入/普通返回 | 可见短引导区≤6px、120–160ms | 手机纯淡入；reduce无位移 | 不推动整篇文章/整条时间线 |
| 明确上一篇/下一篇 | 可见引导区≤8px、140–180ms | 手机纯淡入 | 只由真实previous/next意图决定方向 |
| 列表和长正文 | 内容保持静态与直接可读，路由由有界引导区表达；可见列表分组可一次性层叠（单组≤16项、22ms递增、最长176ms延迟、240ms） | 同左；reduce 不层叠 | 禁止逐段stagger、逐行观察器、长高快照morph |
| 普通hover/focus/pressed | 120–160ms色彩/透明度，必要时≤2px | 触屏pressed即时 | 不改width、height、字号、行高或grid布局 |
| 跨页回顶（push/replace，无 hash） | 在出页文档内 160–360ms 二次缓出滚回顶部，随后才替换 main | 同左；reduce 瞬时到位 | 不 await 超过 360ms；wheel/touch/key 可中断；traverse 仍按历史位置恢复 |
| 同URL、同页hash、历史深位恢复 | 不启动路由入场 | 同左 | hash使用可中断平滑滚动；restore恢复已读位置与焦点 |
| 固定外壳（页头、页脚、文章左右侧栏） | 跨页保留节点身份，不参与任何淡入淡出 | 同左 | 只 persist 文章左栏与右栏时钟天气块；正文与评论必须重建 |
| 背景、页头和页脚 | 持久壳保持，背景只在完整文档首次淡显 | reduce直接显示已解码图 | html/body暗底先到；不将壳层整页截图后再淡出 |

## 完整模块清单

“现有”描述的是1.43.1结构快照；“设计”描述模块职责；下方“本轮实现映射”按当前代码列出实际覆盖，不能只凭设计数值宣称验收通过。各行默认通过共享页面生命周期在解析完成/page-load挂载，before-swap中止；全局壳只安装一次并保持节点身份。异步模块必须验证signal/token，导航取消后旧结果不得写入新DOM。

| 模块ID | 模块 | 页面与显示条件 | 基线现有效果 | 路由与交互设计 | 减少动态 | 性能边界 | 源码依据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `shell-background` | 双层背景与底色 | all-themed-pages；主题页；两层 aria-hidden 背景 | 双层 opacity 交叉淡入，CSS 650ms；html 有稳定暗色底。 | 每个完整文档随机选择并低优先级异步解码一张图，首次从暗底200ms opacity淡显；同一Swup会话软导航保持该图，不再请求新图或重复淡入。自定义URL列表继续生效；saveData保留暗底且不请求装饰图；失败或慢解码仍可阅读。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 最多两层；不等待背景阻塞正文；保持暗底与上次有效图；禁止动画 filter。 | [src/layouts/Stalux.astro](../src/layouts/Stalux.astro)<br>[src/scripts/background.ts](../src/scripts/background.ts)<br>[src/styles/base.css](../src/styles/base.css) |
| `shell-navigation` | 主导航与当前项 | all-themed-pages；所有主题页 | 链接颜色/图标反馈，导航随滚动调整。 | 跨页保留位置、尺寸与已有滚动状态。 hover/focus 的文字、底线或底色 120–160ms；active 不改变字重/宽度。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 只更新当前链接状态，不逐页重测持久导航宽度。 | [src/components/stalux/layout/navs.astro](../src/components/stalux/layout/navs.astro)<br>[src/scripts/navigation.ts](../src/scripts/navigation.ts)<br>[src/styles/rules/common.ts](../src/styles/rules/common.ts) |
| `shell-mobile-menu` | 手机菜单、按钮与遮罩 | all-themed-pages；窄屏导航模式 | 抽屉 translateX，菜单遮罩。 | 跨页不重播打开动画；导航前收起。 打开/关闭 160–200ms translateX 与遮罩 opacity；按钮即时 pressed；Escape/导航关闭。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 抽屉只改变 transform；焦点和 aria-expanded 同步；不展开布局高度。 | [src/components/stalux/layout/navs.astro](../src/components/stalux/layout/navs.astro)<br>[src/scripts/navigation.ts](../src/scripts/navigation.ts)<br>[src/styles/rules/common.ts](../src/styles/rules/common.ts) |
| `shell-navigation-overflow` | 导航横向溢出控制 | all-themed-pages；导航内容超出可用宽度时显示左右按钮 | 按钮按可滚动方向显隐。 | 跨页保留当前横滚位置。 按钮 opacity 120ms；点击原生平滑横滚；触摸或键盘可接管。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不动画容器宽度；读写布局分批；无溢出时不运行循环。 | [src/components/stalux/layout/navs.astro](../src/components/stalux/layout/navs.astro)<br>[src/scripts/navigation.ts](../src/scripts/navigation.ts) |
| `shell-search` | Pagefind 搜索对话框 | all-themed-pages；点击搜索后按需加载 | 第三方 pagefind-modal 的弹层行为与懒加载。 | 离开当前页时关闭弹层并恢复焦点，壳中单实例复用。 弹层 opacity 140ms；背景遮罩淡入；输入、结果和加载状态直接可用。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不重建搜索索引；不对每条结果 stagger；不在路由快照中保留打开的弹层。 | [src/components/stalux/common/search.astro](../src/components/stalux/common/search.astro)<br>[src/scripts/search-dialog.ts](../src/scripts/search-dialog.ts) |
| `footer-copyright` | 页脚版权 | all-themed-pages；footer.copyright.enabled | 静态文字。 | 持久页脚跨页保持，不重复淡入。 静态文字稳定保持；首次可读，不人为循环淡入。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不按数字或字逐个动效；年份更新不补间。 | [src/components/stalux/footer/FooterCopyright.astro](../src/components/stalux/footer/FooterCopyright.astro) |
| `footer-badges` | 普通徽章与可展开徽章组 | all-themed-pages；配置至少一枚徽章；组按需展开 | details 切换，箭头旋转，徽章 SVG 懒加载。 | 持久组保持用户 open 状态；不因文章切换收起。 summary hover/focus 120ms；箭头 90°/140ms；组内容一次短淡入。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 高度立即布局，不补间 height；关闭组不加载全部 SVG；不逐徽章入场。 | [src/components/stalux/footer/FooterBadges.astro](../src/components/stalux/footer/FooterBadges.astro)<br>[src/scripts/footer-badges.ts](../src/scripts/footer-badges.ts)<br>[src/styles/rules/common.ts](../src/styles/rules/common.ts) |
| `footer-beian` | 备案信息 | all-themed-pages；ICP 或公安备案信息存在 | 链接颜色 300ms。 | 随持久页脚保持。 hover/focus 颜色或底线 140ms；图标保持位置。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不旋转徽标，不等待远程图加载后才显示文字。 | [src/components/stalux/footer/FooterBeian.astro](../src/components/stalux/footer/FooterBeian.astro) |
| `footer-credits` | 主题与框架署名 | all-themed-pages；showPoweredBy 或 showThemeInfo | 链接颜色 300ms。 | 随持久页脚保持。 hover/focus 颜色或底线 140ms。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不改字重、字号或行高。 | [src/components/stalux/footer/FooterThemeInfo.astro](../src/components/stalux/footer/FooterThemeInfo.astro) |
| `footer-statistics` | 站点访客、访问量与总字数 | all-themed-pages；FooterStats 渲染；统计数据可失败 | Loading 到真实计数；SSR 字数。 | 持久统计平稳更新，不重复入场。 数据就绪直接更新数字，保留稳定行高；不做装饰滚动数字。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不做滚动数字；不反复替换整段 DOM；不能靠隐藏统计刷性能。 | [src/components/stalux/footer/FooterStats.astro](../src/components/stalux/footer/FooterStats.astro)<br>[src/scripts/analytics-runtime.ts](../src/scripts/analytics-runtime.ts) |
| `footer-uptime` | 站点运行时长 | all-themed-pages；配置 buildtime | 定时更新运行时长。 | 跨页保持时钟实例。 数字原位更新，不随每秒tick重播动效。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 等宽数字/稳定行高；页面隐藏时暂停；不逐秒重新入场。 | [src/components/stalux/footer/FooterStats.astro](../src/components/stalux/footer/FooterStats.astro)<br>[src/scripts/runtime-counter.ts](../src/scripts/runtime-counter.ts) |
| `footer-custom` | 用户自定义页脚内容 | all-themed-pages；footer.custom 非空 | 直接渲染用户 HTML。 | 保持已渲染用户内容。 继承页脚可见性；交互使用全局 focus/链接反馈，不主动接管自定义脚本。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 未知 DOM 不逐节点扫描或添加动画；图片尺寸由内容作者负责。 | [src/components/stalux/layout/footer.astro](../src/components/stalux/layout/footer.astro) |
| `shell-back-to-top` | 回到顶部按钮 | all-themed-pages；滚动 sentinel 离开视口后显示；打印隐藏 | IntersectionObserver 显隐，点击原生 smooth scroll。 | 持久按钮不重建。 显现用 opacity 100ms；hover/focus 底色 120ms，点击平滑回顶，可被用户滚动中断。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 一个观察器；不在每次 swap 读取 scrollY 强制布局；不动画按钮所在文流高度。 | [src/components/stalux/layout/BackToTop.astro](../src/components/stalux/layout/BackToTop.astro)<br>[src/scripts/back-to-top.ts](../src/scripts/back-to-top.ts) |
| `author-identity` | 作者头像、姓名与简介 | home / post；首页；文章左栏仅 ≥1600px | 头像 hover 650ms 单次旋转，姓名/简介静态。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 头像hover改rotate(3deg)/180ms，focus使用可见轮廓；姓名和简介稳定保持。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 固定 100×100 头像；不做首页头像→侧栏头像跨屏 morph；不无限旋转。 | [src/components/stalux/common/author.astro](../src/components/stalux/common/author.astro)<br>[src/components/stalux/posts/postAuthor.astro](../src/components/stalux/posts/postAuthor.astro) |
| `social-links` | 社交链接 | home / post；配置 mediaLinks；文章左栏仅 ≥1600px | 有逐图标延迟到达与交互反馈。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 整组随父区淡入；hover/focus 单个图标≤2px抬升、120ms；pressed 即时。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不逐个 stagger，不叠加父区与图标入场；外链仍新标签页。 | [src/components/stalux/links/socialMedia.astro](../src/components/stalux/links/socialMedia.astro)<br>[src/styles/rules/common.ts](../src/styles/rules/common.ts) |
| `typewriter` | 打字文案 | home；typetexts.items 非空 | 按字素打字/删除、保留最长文案高度、离屏暂停。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 保留原打字节奏；路由过渡后再恢复输入；光标使用 opacity，当前文案不跳位。 | 减少动态时直接显示完整文案、无闪烁光标。 | 最大文案换行高度提前预留；离屏/hidden 暂停；swap 清除计时器。 | [src/components/stalux/common/Typewriter.astro](../src/components/stalux/common/Typewriter.astro)<br>[src/components/stalux/common/textType.astro](../src/components/stalux/common/textType.astro)<br>[src/scripts/typewriter.ts](../src/scripts/typewriter.ts) |
| `date-clock` | 日期与数字时钟 | home / post；首页；文章右栏 ≥1600px | 内联首个值与可见时钟更新。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 随父区一次淡入；数字更新不再播放动画。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 等宽数字、稳定行高，隐藏/离屏暂停；不得逐秒 scale/fade。 | [src/components/stalux/common/date.astro](../src/components/stalux/common/date.astro)<br>[src/scripts/date-time.ts](../src/scripts/date-time.ts)<br>[src/scripts/visible-clock.ts](../src/scripts/visible-clock.ts) |
| `weather` | 天气、IP 提示与重试 | all-themed-pages；site.weather.enabled；页脚与 ≥1600px 文章右栏复用 | 异步加载、状态文案与重试。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 就绪输出用140ms纯透明度反馈；重试按钮原生可聚焦；失败文本立即可读。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 请求有界且复用；预留文字高度；不先清空卡片，不动画 height。 | [src/components/stalux/common/Weather.astro](../src/components/stalux/common/Weather.astro)<br>[src/scripts/weather.ts](../src/scripts/weather.ts) |
| `page-heading` | 页面标题与短描述 | home / archive / categories / tags / links / words；首页站名或公共列表页的标题/短描述；文章头与筛选头分别在专用模块登记，不重复计数 | data-stalux-motion-focus；1.43.1 被整 main 动画覆盖。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 有界引导区按实际preset入场160–180ms；手机120ms纯淡入；不做跨标题几何morph。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 只选一个当前可见引导区；不对首页、卡片与文章标题强行共享变形。 | [src/components/stalux/layout/PageHeading.astro](../src/components/stalux/layout/PageHeading.astro)<br>[src/pages/index.astro](../src/pages/index.astro) |
| `archive-call-to-action` | 首页归档入口 | home；首页底部入口 | 普通链接全局下划线反馈。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 hover/focus 底线120–160ms；pressed 即时；跟随首页父区入场。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不扩大按钮几何到整页时间线；仍真实链接可无JS访问。 | [src/components/stalux/archives/toArchive.astro](../src/components/stalux/archives/toArchive.astro) |
| `empty-state` | 空列表提示 | archive / tags；无已发布文章或标签 | 静态空状态文本。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 空状态立即可读；路由变化由页面引导区表达，不播放假加载或循环动效。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 保留可读最终态；不使用不断循环的假加载。 | [src/components/stalux/archives/archivesList.astro](../src/components/stalux/archives/archivesList.astro)<br>[src/components/stalux/tags/tagsCloud.astro](../src/components/stalux/tags/tagsCloud.astro) |
| `archive-timeline` | 年月分组时间线 | archive；已发布文章按真实年月分组 | 静态真实文流布局，标题与时间线。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 整条时间线保持真实静态文流；页面引导区承担进入/返回提示；深位历史恢复原样显示。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 分组进入视口时一次性层叠（单组≤16行，其余直接可读），不逐行注册观察器，不补间长列表尺寸，不叠 content-visibility 与估算月份高度。 | [src/components/stalux/archives/archivesList.astro](../src/components/stalux/archives/archivesList.astro)<br>[src/styles/rules/archives.ts](../src/styles/rules/archives.ts) |
| `archive-entry` | 日期与文章标题行 | archive；每篇有日期的已发布文章；实例数量不计模块种类 | 标题 hover/focus 颜色与下划线。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 hover/focus 单一底线120ms；点击后由路由过渡接管。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不为每行注册观察器/VT名称；不因悬停改变文字宽度或行高。 | [src/components/stalux/archives/archivesList.astro](../src/components/stalux/archives/archivesList.astro)<br>[src/styles/rules/archives.ts](../src/styles/rules/archives.ts) |
| `archive-description` | 文章摘要预览浮层 | archive；有 desc 且 hover/focus 的标题；触屏直接访问 | 定位顶层 tooltip，隐藏/显示。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 opacity .9→1/100ms；定位完成再显示；离开、滚动或导航立即收起。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 单浮层复用；不在 pointermove 循环读全列表布局；不截获触屏点击。 | [src/components/stalux/archives/archivesList.astro](../src/components/stalux/archives/archivesList.astro)<br>[src/scripts/archive-descriptions.ts](../src/scripts/archive-descriptions.ts) |
| `category-grid` | 分类集合区 | categories；分类列表 | 网格布局；条目使用 content-visibility。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 分类集合保持静态布局；由页面引导区表达进入/返回，卡片只在真实交互时反馈。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不动画 grid 重排、宽高或最大高度；避免同帧海量 getBoundingClientRect。 | [src/components/stalux/categories/categoriesList.astro](../src/components/stalux/categories/categoriesList.astro) |
| `category-card` | 分类卡片 | categories；每个有文章的分类 | hover 卡片上移2px、扫光、图标旋转。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 hover/focus 轻抬升≤2px/140ms与边框强调；图标小幅转动，按下即时归位。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 一个局部反馈，不叠扫光/大阴影/旋转多套绘制；不把卡片 morph 成结果页。 | [src/components/stalux/categories/categoriesCard.astro](../src/components/stalux/categories/categoriesCard.astro)<br>[src/styles/rules/categories.ts](../src/styles/rules/categories.ts) |
| `taxonomy-header` | 筛选标题、数量与返回入口 | category-detail / tag-detail；分类详情与标签详情 | 标题/计数静态，返回链接颜色。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 同维度切换标题区≤6px/140ms；标签↔分类为纯淡入；返回链接底线反馈。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 计数直接更新；不同名称不共享文字形状；路径不同才播放路由效果。 | [src/components/stalux/tags/tagHeader.astro](../src/components/stalux/tags/tagHeader.astro) |
| `post-results` | 筛选文章结果区 | category-detail / tag-detail；分类或标签过滤结果 | PostList 静态结果，data-stalux-motion-content。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 筛选结果直接显示并可立即访问；筛选标题区表达方向，结果不等待动画。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不隐藏所有结果等逐卡动画结束；不复用旧筛选内容冒充新结果。 | [src/components/stalux/posts/postList.astro](../src/components/stalux/posts/postList.astro) |
| `post-card` | 文章卡片、封面、标签与阅读入口 | category-detail / tag-detail；每篇过滤结果；cover/tags/categories 可选 | 封面 hover scale1.025，卡片阴影与标签底色。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 卡片hover/focus轻边框与≤2px抬升；封面可局部极小缩放；内部链接一致底线/底色反馈。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 封面固定尺寸、异步解码；卡片种类计一次；不每张创建VT共享名；触屏不保留hover态。 | [src/components/stalux/posts/postCard.astro](../src/components/stalux/posts/postCard.astro)<br>[src/styles/rules/common.ts](../src/styles/rules/common.ts) |
| `tag-cloud` | 桌面 Canvas 标签云 | tags；≥769px；有标签且容器可见 | 异步加载标签云；IntersectionObserver/页面可见性启停；离开销毁。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 Canvas本体保持原位并由自身循环更新；页面引导区承担路由提示，导航离开销毁循环。 | 减少动态时停止自动旋转，保留链接选择与文本可访问入口。 | Canvas单词不是共享DOM；不捕获整张大Canvas做缩放/滤镜；不要与路由转场并发重建。 | [src/components/stalux/tags/tagsCloud.astro](../src/components/stalux/tags/tagsCloud.astro)<br>[src/scripts/tags-cloud.ts](../src/scripts/tags-cloud.ts) |
| `tag-cards` | 手机标签卡片集合与条目 | tags；≤768px SSR 卡片；无JS也可访问 | 卡片按文章数字号变化、hover扫光与边框。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 集合一次淡入；条目hover/focus边框/底色120ms，pressed即时。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不逐标签stagger；字号由数据决定但不补间；不在切换中重建全部卡片。 | [src/components/stalux/tags/tagsCloud.astro](../src/components/stalux/tags/tagsCloud.astro)<br>[src/styles/rules/tags.ts](../src/styles/rules/tags.ts) |
| `article-header` | 文章标题、发布日期与更新日期 | post / about；文章；关于页没有日期 | 标题/元信息静态，整体跟随1.43.1 main。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 跟随阅读区域一次淡入；标题可承接明确进入/返回方向的小落点。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 日期直接输出，不逐字动画；不把长标题几何morph；长标题换行保持正常文流。 | [src/components/stalux/posts/postContent.astro](../src/components/stalux/posts/postContent.astro) |
| `article-statistics` | 阅读时长、字数与阅读量 | post / about；有对应数据；阅读量可异步 | SSR时长字数，Vercount Loading到数值；区域有占位。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 就绪数值短淡入，固定起点且允许区域扩展。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不滚动数字，不隐藏计数器避CLS；首次字体与Loading宽度必须预留空间。 | [src/components/stalux/posts/postContent.astro](../src/components/stalux/posts/postContent.astro)<br>[src/styles/rules/article.ts](../src/styles/rules/article.ts) |
| `article-source` | Markdown 原文入口 | post；promote.export_md=true；关于页隐藏 | 按钮色彩反馈，原文新标签页。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 hover/focus边框/底色120–160ms，pressed即时。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不将.md端点交给Swup；不为导出入口阻塞文章显示。 | [src/components/stalux/posts/postContent.astro](../src/components/stalux/posts/postContent.astro) |
| `article-summary` | 文章摘要 | post / about；description 非空 | 固定风格静态摘要卡。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 继承正文区域淡入；可用边框轻强调，无独立延迟。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 摘要文字始终直接可读；不动画卡片height，不逐段文字出现。 | [src/components/stalux/posts/ArticleSummary.astro](../src/components/stalux/posts/ArticleSummary.astro) |
| `article-body` | 正文与关于页自定义内容 | post / about；正文内容；关于教育经历等用户内容属于此模块实例 | 静态已编译HTML，链接底线/颜色；无段落入场。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 正文保持原位与即时可读；本地链接、复制、灯箱、表格与details使用各自局部反馈。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 长文不做全长位移/缩放/逐段stagger；内容先可读；不把关于和文章正文误persist。 | [src/components/stalux/posts/postContent.astro](../src/components/stalux/posts/postContent.astro)<br>[src/pages/about.astro](../src/pages/about.astro)<br>[src/styles/content.css](../src/styles/content.css) |
| `prose-code` | 代码块、复制按钮与横向滚动 | post / about；Markdown代码块存在 | Expressive Code静态高亮，复制控制与可聚焦滚动区。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 复制成功反馈淡入100ms；按钮hover/focus底色120ms；代码内容不移动。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 关键代码CSS在swap前准备；不逐行高亮动画；横滚保留键盘可用性。 | [src/scripts/code-accessibility.ts](../src/scripts/code-accessibility.ts)<br>[src/styles/generated-prose.css](../src/styles/generated-prose.css)<br>[src/components/stalux/posts/postContent.astro](../src/components/stalux/posts/postContent.astro) |
| `prose-media` | 正文图片、题注与 PhotoSwipe 灯箱 | post / about；文章包含图片；首点懒加载PhotoSwipe | 首点preventDefault后打开灯箱；图片懒加载并保留尺寸。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 灯箱按库原生轻淡入/手势；正文图片只做边框/阴影反馈，退出回到原图位置。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不等待所有远程图片解码才换页；图片占位先到；灯箱不叠路由morph。 | [src/scripts/photoswipe.ts](../src/scripts/photoswipe.ts)<br>[src/components/stalux/posts/postContent.astro](../src/components/stalux/posts/postContent.astro)<br>[src/styles/content.css](../src/styles/content.css) |
| `prose-table` | 正文表格 | post / about；Markdown表格存在 | 行hover底色，窄屏横滚。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 hover/focus行底色120ms；内容随父区淡入。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不逐行stagger，不动画列宽/高度；窄屏横滚不能拖动正文。 | [src/styles/content.css](../src/styles/content.css) |
| `prose-details` | 正文可折叠详情 | post / about；用户内容details/summary | details边框hover，原生展开。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 summary hover/focus边框120ms；内容一次透明度反馈；高度直接布局。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 保留原生open/键盘语义，不补间长内容高度。 | [src/styles/content.css](../src/styles/content.css) |
| `prose-formula-diagram` | 数学公式与 Mermaid 静态图 | post / about；Markdown含公式或Mermaid | 构建期生成MathML/SVG，不需要客户端逐图渲染。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 只继承父阅读区域淡入；SVG内部保持静态。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不为装饰动效加载客户端Mermaid/数学渲染器；不逐节点画线或大图缩放。 | [src/plugins/satteri-temml.ts](../src/plugins/satteri-temml.ts)<br>[src/index.ts](../src/index.ts)<br>[src/styles/math.css](../src/styles/math.css) |
| `article-license` | 版权声明与CC水印 | post / about；文章或关于页底部 | 水印hover透明度、许可链接颜色/底线。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 水印opacity .15→.22/140ms；链接hover/focus底线；随正文父区淡入。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 无区域缩放、无重阴影呼吸；真实许可内容不动。 | [src/components/stalux/posts/postCC.astro](../src/components/stalux/posts/postCC.astro)<br>[src/styles/rules/article.ts](../src/styles/rules/article.ts) |
| `article-adjacent-navigation` | 上一篇与下一篇 | post；至少一个相邻文章；缺失方向禁用 | 带 previous/next 意图，箭头hover定向位移。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 hover/focus箭头≤3px/140ms；点击路由仅明确相邻方向可≤8px横向提示。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | disabled不动画；不能把随机/正文链接伪装成时间方向；不拖动整篇长文。 | [src/components/stalux/posts/postNavigation.astro](../src/components/stalux/posts/postNavigation.astro)<br>[src/styles/rules/article.ts](../src/styles/rules/article.ts) |
| `article-comments` | Waline 评论与加载/重试 | post / about；comment.enabled且serverURL存在 | 异步SDK，评论交互，失败提示/重试。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 容器随父区；SDK就绪可用opacity反馈；错误/重试即时可读。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不等待第三方评论阻塞转场；切换文章销毁实例并绑定新path；不捕获整个评论区morph。 | [src/components/stalux/posts/WalineComment.astro](../src/components/stalux/posts/WalineComment.astro)<br>[src/scripts/waline.ts](../src/scripts/waline.ts)<br>[src/scripts/waline-client.ts](../src/scripts/waline-client.ts) |
| `article-random-posts` | 随机文章与刷新控制 | post；左栏≥1600px | 刷新图标0.6s旋转，列表opacity .5→1。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 刷新不增加人为等待；数据就绪后列表100ms opacity .82→1，busy阻止并发刷新。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不让异步结果写回已离开页面；刷新不启动路由动效；不逐项stagger。 | [src/components/stalux/posts/randomPost.astro](../src/components/stalux/posts/randomPost.astro)<br>[src/scripts/random-posts.ts](../src/scripts/random-posts.ts) |
| `article-table-of-contents` | 目录、当前项与侧栏跟随 | post；右栏≥1600px；无标题显示空文案 | IntersectionObserver选当前标题；仅侧栏平滑跟随，Swup接管锚点。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 当前项底色/边框120ms；目录列表按分组层叠一次（≤16项），目录自身滚动，点击正文锚点平滑定位。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不使用scrollIntoView拉动整个页面；hover目录时暂停自动跟随；swap清观察器。 | [src/components/stalux/posts/postToc.astro](../src/components/stalux/posts/postToc.astro)<br>[src/utils/toc-scrollspy.ts](../src/utils/toc-scrollspy.ts) |
| `article-taxonomy` | 文章侧栏标签与分类 | post；右栏≥1600px；空集合有提示 | pill/column链接hover底色。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 hover/focus底色和边框120ms；单项按下即时；跨页时标签/分类分组各层叠一次（≤16项），整块不再整体淡入。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 同一组件两种kind算同一模块类型；不逐标签动画，不误持久旧文章数据。 | [src/components/stalux/posts/PostTaxonomy.astro](../src/components/stalux/posts/PostTaxonomy.astro)<br>[src/styles/rules/article.ts](../src/styles/rules/article.ts) |
| `links-collection` | 友链集合 | links；配置 links.sites | 响应式列表网格。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 集合直接可读；页面标题区表达进入，头像按需加载不阻塞集合。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不等待全部头像解码，不动画网格重排，不逐卡延迟。 | [src/components/stalux/links/linkList.astro](../src/components/stalux/links/linkList.astro) |
| `link-card` | 友链卡片、头像与简介 | links；每个友链条目 | 内容上移2px，头像hover650ms旋转，卡片边框/阴影。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 卡片保留≤2px抬升与边框；头像改rotate(3deg)/180ms，focus轮廓反馈。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 固定头像80×80，懒加载；target=_blank保持；不要所有头像一齐旋转。 | [src/components/stalux/links/linkCard.astro](../src/components/stalux/links/linkCard.astro)<br>[src/styles/rules/links.ts](../src/styles/rules/links.ts) |
| `word-collection` | 一言集合 | words；所有非draft words，按时间排序 | 静态变高卡片列表。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 变高列表保持静态文流；页面标题区表达路由变化，同页hash不重播入场。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不补间高度，不逐卡stagger，不给长列表多快照。 | [src/components/stalux/words/wordList.astro](../src/components/stalux/words/wordList.astro) |
| `word-card` | 摘录卡片、正文与引号 | words；每条一言，可长短不同 | hover边框/阴影；定位有2s glow/scale。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 hover/focus边框140ms；锚点定位用伪层opacity .4→0/1200ms，正文不scale，无大阴影重绘。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 去掉定位scale和大面积持续阴影；不要日期点击重新入场。 | [src/components/stalux/words/wordCard.astro](../src/components/stalux/words/wordCard.astro)<br>[src/styles/rules/words.ts](../src/styles/rules/words.ts) |
| `word-permalink-source` | 摘录日期永久链接与出处 | words；有abbrlink/date/source/sourceDate | 日期hash定位，来源链接可能新标签页。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 hover/focus底线120ms；hash原生平滑滚动后只强调目标卡片。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 锚点不走整页VT；来源保留target=_blank；日期/来源换行走真实布局。 | [src/components/stalux/words/wordCard.astro](../src/components/stalux/words/wordCard.astro)<br>[src/scripts/word-list.ts](../src/scripts/word-list.ts) |
| `error-message` | 404数字与说明 | error；主题404页；隐藏agent-recovery不计可见模块 | 静态数字与提示，跟随main。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 短淡入≤100ms，错误说明立即可读。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 不弹跳、红闪或抖动；不让动画占用自动恢复倒计时。 | [src/pages/404.astro](../src/pages/404.astro) |
| `error-countdown` | 404自动恢复倒计时 | error；404页，默认5秒 | 每秒更新并自动返回首页。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 数字原位更新，首次随错误内容淡入；不逐秒缩放。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 离开清计时器；不得与未完成旧导航同时提交；不因重挂载创建多个倒计时。 | [src/pages/404.astro](../src/pages/404.astro)<br>[src/scripts/countdown.ts](../src/scripts/countdown.ts) |
| `error-recovery-action` | 404返回首页按钮 | error；404可见恢复入口 | 按钮hover反馈。 | 路由由有界引导区表达；本模块保持可读，仅被所属有界区域实际包含时继承该效果，不再另播入场。 hover/focus边框/底色120ms，pressed即时；返回主页中性淡入。 | prefers-reduced-motion: reduce 时去除位移、旋转和循环，状态立即切换；保留焦点、可读内容与功能。 | 真实href可无JS恢复；不添加装饰等待。 | [src/pages/404.astro](../src/pages/404.astro)<br>[src/styles/rules/common.ts](../src/styles/rules/common.ts) |

## 本轮实现映射（待验收数据补齐）

本节已对照本轮实际代码，不把旧基线设计数值当成当前实现。路由由 **Swup + WAAPI 有界引导区**承担；没有启用原生 ViewTransition API 的全页快照，也没有把整个 main 隐藏后等待。长正文、长列表与未选中的模块直接可读，路由效果通过标题/短引导区表达。

| 实际策略 | 当前实现 |
| --- | --- |
| 目标选择 | 从data-stalux-motion-focus向上找data-stalux-motion-region；区域超过min(420px,视口高60%)时退回可见h1；标题不可见则跳过，不抢阅读滚动位置 |
| 退场 | 目标HTML、CSS及有时限字体准备完成后，所选小区域80ms opacity1→.82；桌面Y0→-4px；手机无位移；正文保持可读 |
| 入场 | 按preset160–180ms；错误100ms；手机120ms纯淡入；进入Y6px、返回Y-4px、明确上下篇X±8px；没有人为delay |
| 筛选语义 | 同维度详情切换taxonomy/X6px；分类详情↔标签详情glide纯淡入；index→detail为enter |
| 跳过 | 同URL、hash、历史恢复、浏览器原生手势视觉、页面隐藏、reduce及无可见目标 |
| 模块可见提示 | module-motion.ts只观察summary/license/comments/sidebar/post-navigation，最多12个；140ms opacity.88→1；无预隐藏；过高区域/路由期间/引导区内部直接跳过 |
| 清理 | before-swap断观察器、取消动画；reduce动态切换取消效果；路由取消恢复旧区并释放fill效果 |
| 头像 | common.ts和links.ts中旧650ms整圈旋转已替换为rotate3deg/180ms，使用稳定data-stalux-control钩子补focus/pressed反馈 |
| 一言定位 | words.ts删除旧2s大阴影与scale，module-motion.css用不截点击的伪层opacity.4→0/1200ms提示目标 |
| 标签云减动画 | reduce时销毁/不创建Canvas并显示SSR标签卡片；不把消失的Canvas当作“关闭旋转后功能仍可用” |
| 搜索弹层 | Pagefind可达dialog/::backdrop用160/140ms CSS动画；≤640px手机120ms纯淡入；不依赖猜测的shadow内部选择器 |

下表的“保留”表示复用已有交互或稳定内容策略，不能解读为本轮给每个模块新增独立动画。55种模块都有明确的当前覆盖路径；测试与真实浏览器结果由本轮验收记录补齐。

| 模块ID | 当前覆盖方式 | 稳定钩子 / 归属 | 实际表现 |
| --- | --- | --- | --- |
| `shell-background` | changed-runtime | `[data-stalux-background]` | 完整文档首次随机选图并解码一次、200ms淡显；同Swup会话保持该图且不重新解码。reduce即时、saveData暗底零装饰请求；原SSR双层与暗底不变。 |
| `shell-navigation` | retained-control | `[data-ref="stalux-nav-link"]` | 持久导航原位；保留链接颜色/底线反馈，当前项直接更新。 |
| `shell-mobile-menu` | retained-control | `[data-ref="stalux-nav-list"], [data-ref="stalux-nav-overlay"]` | 保留抽屉transform与遮罩交互；新增全局reduce规则取消动画。 |
| `shell-navigation-overflow` | retained-control | `[data-ref="stalux-nav-scroll-left"], [data-ref="stalux-nav-scroll-right"]` | 保留横滚按钮显隐与原生横向滚动。 |
| `shell-search` | new-css-control | `pagefind-modal#search dialog[open], dialog::backdrop` | 桌面弹层160ms opacity .88→1/Y4px→0；≤640px手机120ms纯淡入；暗遮罩140ms；reduce取消。 |
| `footer-copyright` | stable | `[data-stalux-module="footer"]` | 持久页脚静态文本保持稳定，不在每次换页重复入场。 |
| `footer-badges` | new-css-control | `[data-stalux-module="badge-group"][open] > div` | 展开内容140ms纯opacity .88→1；箭头保留原有open状态；不动画height。 |
| `footer-beian` | new-css-control | `[data-stalux-module="footer"] a` | 页脚链接color/background/opacity统一140ms反馈，内容跨页持久。 |
| `footer-credits` | new-css-control | `[data-stalux-module="footer"] a` | 页脚链接color/background/opacity统一140ms反馈，内容跨页持久。 |
| `footer-statistics` | stable | `FooterStats / analytics-runtime` | 保留真实异步统计，数字直接更新；没有装饰滚动数字或独立入场。 |
| `footer-uptime` | stable | `[data-stalux-buildtime]` | 保留可见时钟与运行时长原位更新，不逐秒重播动效。 |
| `footer-custom` | stable | `[data-stalux-module="footer"]` | 保留用户HTML，不注入逐节点动画；其中普通链接继承footer140ms反馈。 |
| `shell-back-to-top` | new-css-control | `[data-stalux-back-to-top]` | 按钮color/background/opacity140ms；保留IntersectionObserver和原生smooth回顶。 |
| `author-identity` | new-css-control | `[data-stalux-control="avatar"]` | 旧650ms整圈旋转已在rules/common.ts移除；hover改rotate3deg/180ms，focus有轮廓。 |
| `social-links` | new-css-control | `[data-stalux-control="social"]` | 140ms颜色与hover≤2px上移；pressed归位；不逐图标延迟入场。 |
| `typewriter` | retained-runtime | `[data-stalux-typewriter]` | 保留已有字素打字节奏、完整文案占位、hidden/离屏暂停及reduce静态文案。 |
| `date-clock` | retained-runtime | `[data-ref="date"], [data-ref="time"]` | 保留稳定行高与可见时钟，数字直接更新。 |
| `weather` | new-data-ready-cue | `[data-stalux-weather][data-weather-state="ready"] [data-weather-output]` | 就绪输出140ms纯透明度反馈；真实加载/失败/重试、请求清理与原位布局保留。 |
| `page-heading` | new-route-region | `[data-stalux-motion-focus], [data-stalux-motion-region]` | 有界引导区统一WAAPI路由效果；入场按preset160–180ms，手机120ms纯淡入。 |
| `archive-call-to-action` | new-css-control | `[data-stalux-control="button"]` | 最小44px按钮，140ms交互反馈与hover≤2px上移，pressed归位。 |
| `empty-state` | stable | `所属内容区域` | 页面引导区表达路由变化；本模块保持可读与原位，不增加独立路由动画。 |
| `archive-timeline` | grouped-cascade | `[data-stalux-reveal]` | 页面引导区表达路由变化；每个可见分组一次性层叠，不逐行、不补间高度。 |
| `archive-entry` | grouped-cascade | `[data-stalux-reveal-item]` | 保留颜色/单一下划线与可聚焦标题；仅随所属分组层叠，单组≤16行。 |
| `archive-description` | retained-control | `[data-archive-tooltip]` | 保留单一顶层浮层的定位、显示和清理；不新增mousemove动画。 |
| `category-grid` | stable | `所属内容区域` | 页面引导区表达路由变化；本模块保持可读与原位，不增加独立路由动画。 |
| `category-card` | new-control-hook | `[data-stalux-control="category-card"]` | 增加统一focus-visible轮廓，保留原有卡片≤2px反馈与局部图标反馈；reduce取消。 |
| `taxonomy-header` | new-route-region | `.stalux-tag-header[data-stalux-motion-region]` | 同维度详情用taxonomy≤6px；分类/标签交叉用glide纯淡入；index进入详情用enter。 |
| `post-results` | stable | `所属内容区域` | 页面引导区表达路由变化；本模块保持可读与原位，不增加独立路由动画。 |
| `post-card` | new-control-hook | `[data-stalux-control="post-card"]` | 增加统一focus-within反馈，保留封面极小缩放与内部标签反馈；不增加逐卡入场。 |
| `tag-cloud` | new-reduced-fallback | `[data-stalux-tag-canvas], [data-stalux-tag-cards]` | reduce立即销毁/停建Canvas并显示SSR标签卡片；保留可见性/断点销毁及点击导航。 |
| `tag-cards` | new-css-control | `[data-stalux-control="tag-card"]` | 140ms边框/颜色/transform，hover≤2px；reduce下提供桌面可访问SSR替代。 |
| `article-header` | new-route-region | `.stalux-post-article-header[data-stalux-motion-region]` | 有限标题区域作为转场对象；高度超过min(420px,视口60%)时退回可见h1。 |
| `article-statistics` | inherited-route-region | `.stalux-post-page-stats` | 位于有界article header时继承同一转场，不独立做Loading/数字动画；原位计数。 |
| `article-source` | inherited-route-region | `.stalux-post-source-link` | 位于有界header时继承同一转场；保留按钮hover/focus，.md仍完整/新标签页访问。 |
| `article-summary` | new-bounded-visible-cue | `[data-stalux-module="summary"]` | 首次可见且不在路由转场时140ms opacity .88→1；高于min(420px,视口60%)则保持直接可读。 |
| `article-body` | stable | `所属内容区域` | 页面引导区表达路由变化；本模块保持可读与原位，不增加独立路由动画。 |
| `prose-code` | retained-control | `Expressive Code / mountCodeAccessibility` | 保留复制按钮与可聚焦横向滚动；代码CSS预备；不增加逐行动画。 |
| `prose-media` | retained-control | `PhotoSwipe / [data-stalux-gallery]` | 保留原生PhotoSwipe打开/关闭与手势；正文图片无独立路由形变。 |
| `prose-table` | retained-control | `.stalux-prose table` | 保留表格行hover与原生横滚，行列尺寸不补间。 |
| `prose-details` | retained-control | `.stalux-prose details` | 保留details原生展开与边框反馈；不补间未知长内容height。 |
| `prose-formula-diagram` | stable | `所属内容区域` | 页面引导区表达路由变化；本模块保持可读与原位，不增加独立路由动画。 |
| `article-license` | new-bounded-visible-cue | `[data-stalux-module="license"]` | 首次可见时有界140ms opacity .88→1；保留许可链接/水印反馈；路由期间跳过。 |
| `article-adjacent-navigation` | new-bounded-visible-cue | `[data-stalux-module="post-navigation"]` | 首次可见有界140ms淡入；保留箭头hover；真实prev/next路由引导区x±8px。 |
| `article-comments` | new-bounded-visible-cue | `[data-stalux-module="comments"]` | 小于高度预算时首次可见140ms淡入；长评论区保持原位；SDK加载、失败与重试不阻塞转场。 旧80ms delay加350ms/30px入场及box-shadow过渡已删除。 |
| `article-random-posts` | new-async-update | `[data-stalux-random-posts]` | 请求立即开始，等待时旧列表可读且aria-busy；新点击取消旧请求，revision拒绝过期写回；数据就绪后仅在高度不超过min(420px,视口60%)时100ms opacity .82→1；长标题超高、减动/隐藏直接显示，卸载清理。 |
| `article-table-of-contents` | retained-control | `[data-toc-active-class]` | 保留当前项边框/底色；只平滑滚动目录pane，正文hash交给Swup。 |
| `article-taxonomy` | retained-control | `.stalux-post-taxonomy-container` | 保留标签/分类链接hover/focus底色；更新新文章数据，不独立入场。 |
| `links-collection` | stable | `所属内容区域` | 页面引导区表达路由变化；本模块保持可读与原位，不增加独立路由动画。 |
| `link-card` | new-css-control | `[data-stalux-control="link-card"]` | 旧650ms旋转已移除；头像rotate3deg/180ms，focus轮廓与既有卡片轻抬升保留。 |
| `word-collection` | stable | `所属内容区域` | 页面引导区表达路由变化；本模块保持可读与原位，不增加独立路由动画。 |
| `word-card` | new-css-location | `[data-stalux-module="word"]:is(:target,[data-glow])::after` | 去掉旧2s大阴影/scale；改伪层opacity .4→0/1200ms定位提示，正文不缩放。 |
| `word-permalink-source` | retained-control | `[data-word-hash]` | 保留hash原生平滑定位，目标卡片用新伪层强调；出处仍新标签页。 |
| `error-message` | new-route-region | `.stalux-404-error-content[data-stalux-motion-region]` | 有界错误引导区100ms入场，手机120ms；无弹跳/红闪。 |
| `error-countdown` | inherited-route-region | `#countdown` | 随404引导区一次转场，秒数原位更新；离开保留既有计时器清理。 |
| `error-recovery-action` | new-css-control | `[data-stalux-control="button"]` | 140ms按钮反馈、44px高度；返回首页由中性route policy接管。 |

## 验收边界

| 项目 | 通过条件 | 证据性质 |
| --- | --- | --- |
| 模块覆盖 | inventory.json中的55个ID均对应实际源码与设计；同一模块复用不重复计数 | 静态结构/设计 |
| 路由转场 | 首页、归档、文章、分类/标签列表与详情、关于、友链、一言、404均有有效策略；同URL/hash/历史恢复正确跳过 | 真实导航与自动回归 |
| 闪白 | 首次/冷缓存/连续软导航和失败导航中，根暗底稳定；关键CSS准备好；无内容先显后隐或旧页复现 | 时间序列帧或视频，单张截图不足 |
| 流畅度 | 区分资源准备、swap、动画ready与finished；真实浏览器记录帧间隔/长任务并保留失败轮次 | 不能凭transform/opacity或静态截图保证帧率 |
| 内容功能 | 字体、首篇代码CSS、Pagefind、灯箱、评论、目录、锚点、计数与词云生命周期正常 | 独立myblog副本，桌面与手机 |
| 减少动态 | 无位移/旋转/循环，页面立即可读；导航和交互仍可用 | emulated或系统reduce场景 |

机读清单：工作区 `work/module-motion-20261025/inventory.json`。本次新增UI模块须同步此清单与实现映射；纯配置内容实例数量变化不修改模块类型总数。浏览器原生滚动条属于宿主控件，不另算主题 DOM 模块；它的稳定空间、原生滚动与可中断平滑定位受统一滚动策略约束。

内置42张背景使用预生成的无损 WebP，保留 SVG 原图与透明度。原 SVG 只有 viewBox，其 auto 背景尺寸等价于 contain；内置 WebP 显式沿用 contain，自定义背景 URL 仍保持原有尺寸。修改原图后用 `bun run backgrounds:build` 重新生成实体资源；消费项目构建只复制资源，不重复栅格化。性能结论以独立 preview 验收报告为准。

## 1.44.0 生产 preview 验收记录

2026-10-25，真实 myblog 原始配置的独立副本，主题为实体目录；只使用生产 build 后的 http://127.0.0.1:4432。738个HTML、735个主题页字体预载、250篇文章，Pagefind与sitemap完整。内置42张无损WebP全部可访问，自定义背景语义保留。

| 检查 | 实际结果 |
| --- | --- |
| 功能长跑 | 桌面217、手机217条导航记录；各4条主要路径20次，另50次连续真实链接导航；历史恢复、hash、快速取消、Pagefind、字体、灯箱、评论挂载通过 |
| 首次发现与修复 | 真实长标题让随机列表达到428px，突破420px动画预算；补高度保护，单测先红后绿；1920×400 preview中10次真实刷新得到288–388px列表，对应240px预算，均静态可读 |
| 最终定向复验 | 修复后桌面/手机/reduce各15条导航，全部检查通过；旧reduce脚本瞬时可见性断言改为等待真实可见链接后点击，重试通过 |
| 轻量桌面测时 | Iris Xe硬件加速、独立无头隐私上下文、1920×900、CPU1、未限网，50次真实导航；动画区间完整包含的rAF中位16.7ms、p95 50ms、>50ms约3.9% |
| 轻量手机测时 | 同进程条件、390×900、CPU1，50次含实际抽屉操作的导航；对应rAF中位16.7ms、p95 33.3ms、>50ms约0.7% |
| 独立截图轮 | 桌面/手机文章、标签、搜索及各8张转场采样通过；未采到整屏白帧；本地pageerror为0 |

逐帧样式读取的功能探针不用于最终帧率结论；轻量轮只记录rAF、Long Tasks、生命周期和动画起止。rAF不是合成器FPS或INP。3次诊断导航另采集到DrawFrame/FramePresented/DrawAndSwap事件，保留真实长帧。测试主机未隔离，统计、评论和天气保持真实配置，第三方取消请求单列。结果不承诺所有设备始终60fps，也不能由8张截图排除每个亚帧白闪。原失败、软件渲染诊断及修复后结果均保留在工作区work/module-motion-20261025；不将调试代理或dev结果作为发布依据。
