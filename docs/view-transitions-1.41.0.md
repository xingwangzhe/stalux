# 1.41.0 空间视图过渡

## 设计与阅读方向

1.40.1 的动效只作用于可见标题，手机仅保留淡入。这次只让中央正文、摘要或列表内容使用方向平移、小角度旋转或透视倾转；侧栏、背景、导航和页脚不参与这些变换。文章之间的同级切换为 260ms，其余正常路由动画为 100–180ms；手机保留相同语义并缩小幅度。导航栏保持静止，帮助读者保持方位。

| 路由关系或操作 | preset | 新页面起始状态（桌面） | 手机差异 | 时长 |
| --- | --- | --- | --- | --- |
| 归档、分类或其他页面进入文章 | enter | 从右侧 35–50px 进入 | 25px | 160ms |
| 文章 → 另一文章，普通正文或侧栏链接 | article | 从右侧 45–70px 进入，不推断文章时间顺序 | 25px | 260ms |
| 显式下一篇按钮 | next | 从右侧 54–84px 进入，旧页向左退出 | 30px | 260ms |
| 显式上一篇按钮 | previous | 从左侧 54–84px 进入，旧页向右退出 | 30px | 260ms |
| 文章 → 列表，分类/标签详情 → 对应索引 | up | 向左上返回，X 为 −21 至 −30px，Y 为 −10px | X 为 −15px | 140ms |
| 进入分类/标签详情，含不同参数之间的自类别切换 | taxonomy | Y 为 18px，X 轴倾转 −4° | 倾转 −2° | 140ms |
| 进入关于页 | panel | X 为 17–24px，Y 轴倾转 −8° | X 为 12px，倾转 −4° | 160ms |
| 进入友链页 | panel / links | Y 为 12px，X 轴倾转 6° | 倾转 3° | 160ms |
| 进入一言页 | panel / words | Y 为 16px，Z 轴旋转 −1° | 同桌面 | 160ms |
| 返回首页 | home | Y 为 20px，X 轴倾转 −5°，缩放 0.985 | 倾转 −2.5° | 180ms |
| 其他主题内部切换、replace、离开 404 | glide | X 为 28–40px，Z 轴旋转 −0.35° | X 为 20px | 160ms |
| 进入 404 | error | Y 为 12px，Z 轴旋转 −0.7° | 同桌面 | 120ms |
| 浏览器后退/前进 | restore | X 为 −12px / 12px，无倾转 | −8px / 8px | 100ms |
| 同 URL、hash、reduced-motion、后台文档、浏览器历史手势、外部或独立 HTML | none | 不增加主题空间动画 | 同桌面 | 无 |

文章的方向由显式 previous/next 链接决定；普通侧栏文章链接不冒充时间顺序。直接点击父级链接属于新导航，浏览器后退属于历史遍历，两者使用不同动画。静态页同 URL 点击不重播动效；文章、标签详情、分类详情的不同参数页面属于同类别自环，可按上表切换。策略对全部 12 个路由类别的 144 种组合求值，实际链接可达性与策略覆盖分别统计。

## 捕获与生命周期

原生 VT 只捕获页面的一个语义标题，不捕获根页面、长文章、整张归档或侧栏。正文与摘要在各自的真实 DOM 上执行 CSS transform/opacity 动画，列表页也只移动自己的内容区；文章卡片外壳保持原位。页面不为每张卡片生成单独快照或逐项延时。

新页面的内容 CSS 动画与原生标题动效先暂停在起始帧；native ready 只写入一个阶段标记，同帧释放两者。两者使用相同的时长与缓动，native finished 清理已有导航状态，移除临时变换。标题即使离屏也不读取其几何或强制滚动；它的原生捕获仍是小标题，正文不依赖长文截图。

没有添加第二套 WAAPI 动画、长文几何测量或滚动位置写入。保留原有 ClientRouter 的准备、关键代码 CSS/字体预载、swap、页面交互挂载、过期请求取消及 native finished 清理顺序。历史返回使用 Astro 保存的位置。背景脚本继续等待内容过渡完成后才提交已解码的随机纹理。

公开的 CSS 几何不能代表实际 GPU 分配或显存测量。正式性能比较需要在不装动画采样器、不截图、不录制的独占测试阶段执行。首屏 Lighthouse、软导航 ready/finished、长任务和完成后的 CLS 分开记录；TBT 不作为 INP。第三方统计、评论、字体和图片保持真实配置。

## 官方依据

| 文档 | 使用范围 |
| --- | --- |
| [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) | 原生旧/新视图与渐进增强 |
| [MDN view-transition-name](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-name) | 独立捕获与名称唯一性 |
| [W3C Capture the image](https://www.w3.org/TR/css-view-transitions-1/#capture-the-image) | documentElement 的视口捕获与普通元素边框盒捕获的区别 |
| [Astro transitions 模块](https://docs.astro.build/en/reference/modules/astro-transitions/) | ClientRouter 导航类型、生命周期与历史方向 |
| [Astro View transitions 指南](https://docs.astro.build/en/guides/view-transitions/) | 脚本执行、持久元素、无障碍与降级 |

本轮优先尝试 Astro 官方文档 MCP，连接返回 HTTP 403 / Error 1010；随后核对官方网页与本机安装的 Astro 7.4.1 源码。没有通过改动请求身份绕过访问限制。
