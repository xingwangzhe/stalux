# 性能与加载

Stalux 的加载策略以“首屏可读”为优先：首屏外内容、第三方资源和装饰性资源都尽量延后，正文与导航保持可用。

## 按可见性加载

| 资源 | 策略 |
| --- | --- |
| 友链图标 | 滚动到附近时请求（400px 预取边距）；失败保留占位圆盘 |
| 随机文章侧栏 | 接近视口才请求索引 |
| 评论 | 距离视口约半屏（最多 400px）时加载 |
| 标签云 | 桌面端进入视口附近后动态加载；离屏、切到移动布局或页面隐藏时销毁实例 |
| 时钟 / 页脚运行时间 | 仅在可见时更新；日期仅在跨天时重写 |
| 归档 / 分类 / 标签 | 保留静态 HTML，跳过离屏渲染 |
| Google Analytics | 首屏稳定后加载（见 [统计](./ANALYTICS.md)） |

## 首页路由预热

首页首屏稳定后（`load` 后约 1 秒，最迟 2.5 秒兜底）按导航顺序逐个预热主要路由，使用 Swup preload 的页面缓存和并发上限。

| 条件 | 行为 |
| --- | --- |
| `saveData` | 不预热 |
| 2G 网络 | 不预热 |
| 减少流量偏好 | 不预热 |
| 隐藏标签页 | 不预热 |
| 点击已预热路由 | 直接复用缓存 |

## 首屏 CSS

主题默认使用 Astro 的 `build.inlineStylesheets: "never"`，共享样式作为带哈希、可缓存的外部 CSS 输出，组件专用样式按页面加载。样式表正常阻塞首次绘制，避免无样式内容闪烁。

消费项目显式设置 `build.inlineStylesheets: "always"` 可恢复内联，但会增加每页 HTML 大小。

Pagefind 搜索弹窗样式单独输出为带哈希的静态文件，以 `prefetch` 提示浏览器提前获取；打开搜索时才作为样式表启用。它不阻塞正文首屏，也不依赖搜索 JavaScript 动态生成 CSS 文件。详见 [搜索](./SEARCH.md)。

## 现代 JavaScript

TypeScript 使用 ESNext，主题默认将 `vite.build.target` 设为 `"esnext"`，保留现代 JavaScript 语法并减少兼容转换；消费方显式指定的 target 优先。

此目标面向现代浏览器，不会自动补齐缺失的 Web API，也不代表普通脚本会使用 GPU。自有源码由 Biome 的 `noVar`、`useConst` 错误规则约束；第三方依赖和构建器生成的代码不在这项源码约束内。

## 背景资源

内置 42 张背景默认使用预生成的深色底 WebP（quality 80），保持原分辨率，减少透明度边缘带来的首访流量。CSS 自定义底色时使用原透明 WebP，SVG 原图继续保留。

修改原图后运行：

```bash
bun run backgrounds:build
```

重新生成实体资源；消费项目构建只复制资源，不重复栅格化。

## 构建缓存

| 缓存 | 作用 |
| --- | --- |
| `node_modules/.astro/` | 字体子集、页面后处理、分享图、增量构建 |
| `node_modules/.astro/stalux-page-output/` | 页面后处理结果 |
| `node_modules/.astro/stalux-social-cards/` | OG 分享图 |
| `node_modules/.astro/stalux-fonts/` | 字体分片输出 |

保留该目录可以跨构建复用；删除后会自动重建。Astro 的增量缓存 (`node_modules/.astro`) 如果未在 CI 恢复，会全量重建。

## 样式输出

Stalux 使用 UnoCSS 在主题内预编译样式，消费项目无需安装或配置 UnoCSS。生产构建会在 Astro 编译与资源哈希生成之前压缩私有 class、CSS variables 和 keyframes；公开变量、`data-*` 行为钩子、第三方组件接口和文章自定义名称保持原义。

不要把动画时长当作完整导航耗时或性能提升数据；性能结论应以独立 preview 中的真实测量为准，并注明浏览器、视口、缓存与网络条件。样式维护细节见 [样式维护](./STYLING.md)。
